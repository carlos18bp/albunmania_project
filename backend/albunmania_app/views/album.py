"""Album catalogue + sticker search endpoints."""
from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from albunmania_app.models import Album, Sticker
from albunmania_app.serializers.album import (
    AlbumDetailSerializer,
    AlbumListSerializer,
    StickerSerializer,
)


class StickerPagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 200


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

    Query params:
      team        — exact match
      special     — '1', 'true', 'yes' to keep only special editions;
                    '0', 'false', 'no' to exclude them
      special_tier — gold/metallic/brand/zero (filter by tier)
      number      — exact match
      q           — full-text-ish search on name + team + number
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
    if special_param in ('1', 'true', 'yes'):
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

    paginator = StickerPagination()
    page = paginator.paginate_queryset(qs, request)
    return paginator.get_paginated_response(StickerSerializer(page, many=True).data)


@api_view(['GET'])
@permission_classes([AllowAny])
def sticker_search(request, slug: str):
    """Predictive autocomplete — returns at most 10 stickers matching `q`.

    Used by the catalogue header search bar with a 300 ms debounce on the
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
