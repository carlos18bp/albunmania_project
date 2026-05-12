"""Album catalogue + sticker search endpoints."""
from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from albunmania_app.models import Album, Profile, Sticker, UserSticker
from albunmania_app.serializers.album import (
    AlbumDetailSerializer,
    AlbumListSerializer,
    StickerSerializer,
)
from albunmania_app.services.match_engine import _bounding_box, haversine_km


class StickerPagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 200


_TRUTHY = ('1', 'true', 'yes')
_AVAILABILITY_CHOICES = ('mine', 'missing', 'repeated')


def _nearby_offerer_user_ids(lat: float, lng: float, radius_km: float, *, exclude_user_id) -> list[int]:
    """Ids of collectors whose approximate Profile location is within `radius_km`.

    Coarse bbox prefilter in SQL, then exact haversine in memory — same shape as
    `match_engine.find_candidates`. The requester is excluded.
    """
    lat_min, lat_max, lng_min, lng_max = _bounding_box(lat, lng, radius_km)
    rows = (
        Profile.objects
        .exclude(user_id=exclude_user_id)
        .exclude(lat_approx__isnull=True).exclude(lng_approx__isnull=True)
        .filter(
            lat_approx__gte=lat_min, lat_approx__lte=lat_max,
            lng_approx__gte=lng_min, lng_approx__lte=lng_max,
        )
        .values_list('user_id', 'lat_approx', 'lng_approx')
    )
    return [
        uid for uid, plat, plng in rows
        if haversine_km(lat, lng, float(plat), float(plng)) <= radius_km
    ]


@api_view(['GET'])
@permission_classes([AllowAny])
def album_list(request):
    """Public list of active albums."""
    albums = Album.objects.filter(is_active=True)
    return Response(AlbumListSerializer(albums, many=True).data)


@api_view(['GET'])
@permission_classes([AllowAny])
def album_detail(request, slug: str):
    """Public album detail by slug."""
    try:
        album = Album.objects.get(slug=slug, is_active=True)
    except Album.DoesNotExist:
        return Response({'error': 'album_not_found'}, status=status.HTTP_404_NOT_FOUND)
    return Response(AlbumDetailSerializer(album).data)


@api_view(['GET'])
@permission_classes([AllowAny])
def sticker_list(request, slug: str):
    """Paginated sticker catalogue for an album, with filters and search.

    Query params (all optional):
      team         — exact match (case-insensitive)
      special      — '1'/'true'/'yes' keep only special editions; '0'/'false'/'no' exclude them
      special_tier — gold/metallic/brand/zero
      number       — exact match
      q            — search on name + team + number
      availability — 'mine' | 'missing' | 'repeated' (based on the requester's UserSticker;
                     requires authentication → 400 if anonymous)
      nearby       — '1'/'true'/'yes' to keep only stickers some collector within `radius_km`
                     has available to trade (UserSticker.count >= 2). Requires authentication
                     and a location: `lat` & `lng` params, or the requester's Profile location
                     as fallback (→ 400 if neither). The requester is excluded.
      lat, lng, radius_km — geo point for `nearby` (radius default 50, clamped 0.5–500)
    """
    try:
        album = Album.objects.get(slug=slug, is_active=True)
    except Album.DoesNotExist:
        return Response({'error': 'album_not_found'}, status=status.HTTP_404_NOT_FOUND)

    qs = Sticker.objects.filter(album=album)

    team = request.query_params.get('team')
    if team:
        qs = qs.filter(team__iexact=team)

    special_param = (request.query_params.get('special') or '').strip().lower()
    if special_param in _TRUTHY:
        qs = qs.filter(is_special_edition=True)
    elif special_param in ('0', 'false', 'no'):
        qs = qs.filter(is_special_edition=False)

    tier = request.query_params.get('special_tier')
    if tier:
        qs = qs.filter(special_tier=tier)

    number = request.query_params.get('number')
    if number:
        qs = qs.filter(number=number)

    q = (request.query_params.get('q') or '').strip()
    if q:
        qs = qs.filter(Q(name__icontains=q) | Q(team__icontains=q) | Q(number__icontains=q))

    # ── Availability (inventory state of the requester) ──
    availability = (request.query_params.get('availability') or '').strip().lower()
    if availability in _AVAILABILITY_CHOICES:
        if not request.user.is_authenticated:
            return Response({'error': 'auth_required_for_filter'}, status=status.HTTP_400_BAD_REQUEST)
        owned_ids = UserSticker.objects.filter(user=request.user, count__gte=1).values('sticker_id')
        if availability == 'mine':
            qs = qs.filter(id__in=owned_ids)
        elif availability == 'missing':
            qs = qs.exclude(id__in=owned_ids)
        else:  # repeated
            qs = qs.filter(
                id__in=UserSticker.objects.filter(user=request.user, count__gte=2).values('sticker_id'),
            )

    # ── Proximity ("available within X km") ──
    if (request.query_params.get('nearby') or '').strip().lower() in _TRUTHY:
        if not request.user.is_authenticated:
            return Response({'error': 'auth_required_for_filter'}, status=status.HTTP_400_BAD_REQUEST)
        lat_p, lng_p = request.query_params.get('lat'), request.query_params.get('lng')
        if lat_p and lng_p:
            try:
                lat, lng = float(lat_p), float(lng_p)
            except (TypeError, ValueError):
                return Response({'error': 'invalid_geo_params'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            prof = getattr(request.user, 'profile', None)
            if prof is None or prof.lat_approx is None or prof.lng_approx is None:
                return Response({'error': 'geo_required_for_proximity'}, status=status.HTTP_400_BAD_REQUEST)
            lat, lng = float(prof.lat_approx), float(prof.lng_approx)
        try:
            radius_km = max(0.5, min(float(request.query_params.get('radius_km', 50)), 500.0))
        except (TypeError, ValueError):
            return Response({'error': 'invalid_geo_params'}, status=status.HTTP_400_BAD_REQUEST)
        nearby_ids = _nearby_offerer_user_ids(lat, lng, radius_km, exclude_user_id=request.user.id)
        offered_sticker_ids = UserSticker.objects.filter(
            user_id__in=nearby_ids, sticker__album=album, count__gte=2,
        ).values('sticker_id')
        qs = qs.filter(id__in=offered_sticker_ids)

    paginator = StickerPagination()
    page = paginator.paginate_queryset(qs, request)
    return paginator.get_paginated_response(StickerSerializer(page, many=True).data)


@api_view(['GET'])
@permission_classes([AllowAny])
def sticker_search(request, slug: str):
    """Predictive autocomplete — returns at most 10 stickers matching `q`.

    Used by the catalogue header search bar with a 200 ms debounce on the
    client. Returns minimal payload for speed.
    """
    try:
        album = Album.objects.get(slug=slug, is_active=True)
    except Album.DoesNotExist:
        return Response({'error': 'album_not_found'}, status=status.HTTP_404_NOT_FOUND)

    q = (request.query_params.get('q') or '').strip()
    if not q or len(q) < 2:
        return Response({'results': []})

    qs = Sticker.objects.filter(album=album).filter(
        Q(name__icontains=q) | Q(team__icontains=q) | Q(number__istartswith=q),
    )[:10]

    return Response({'results': StickerSerializer(qs, many=True).data})
