"""Collector discovery — map of nearby collectors + predictive search."""
from __future__ import annotations

from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from albunmania_app.models import Profile, User
from albunmania_app.serializers.collectors import CollectorMapEntrySerializer, CollectorSearchResultSerializer
from albunmania_app.services.match_engine import haversine_km


def _display_name(user) -> str:
    return (f'{user.first_name} {user.last_name}').strip() or user.email.split('@')[0]


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def collectors_map(request):
    """Collectors with an approximate location, for the "Mapa de Coleccionistas".

    Query params:
      lat, lng, radius_km — keep only collectors within `radius_km` of the point
      album_id            — keep only collectors whose active album is `album_id`
      limit               — max results (default 100, max 300)

    Privacy: only the *approximate* lat/lng stored on the Profile are exposed
    (already coarse-grained); never an exact device position. The requester is
    excluded from the result.
    """
    try:
        limit = max(1, min(int(request.query_params.get('limit', 100)), 300))
    except (TypeError, ValueError):
        return Response({'error': 'invalid_limit'}, status=status.HTTP_400_BAD_REQUEST)

    qs = (
        Profile.objects.select_related('user')
        .filter(user__role=User.Role.COLLECTOR.value)
        .exclude(user_id=request.user.id)
        .exclude(lat_approx__isnull=True)
        .exclude(lng_approx__isnull=True)
    )

    album_id_param = request.query_params.get('album_id')
    if album_id_param:
        try:
            qs = qs.filter(active_album_id=int(album_id_param))
        except (TypeError, ValueError):
            return Response({'error': 'invalid_album_id'}, status=status.HTTP_400_BAD_REQUEST)

    results = list(qs[: limit * 4])

    lat_p, lng_p, radius_p = (
        request.query_params.get('lat'),
        request.query_params.get('lng'),
        request.query_params.get('radius_km'),
    )
    if lat_p and lng_p and radius_p:
        try:
            lat, lng = float(lat_p), float(lng_p)
            radius_km = max(0.5, min(float(radius_p), 500.0))
        except (TypeError, ValueError):
            return Response({'error': 'invalid_geo_params'}, status=status.HTTP_400_BAD_REQUEST)
        results = [
            p for p in results
            if haversine_km(lat, lng, float(p.lat_approx), float(p.lng_approx)) <= radius_km
        ]

    payload = [
        {
            'user_id': p.user_id,
            'display_name': _display_name(p.user),
            'city': p.city,
            'avatar_url': p.avatar_url,
            'lat_approx': p.lat_approx,
            'lng_approx': p.lng_approx,
            'rating_avg': p.rating_avg,
            'rating_count': p.rating_count,
            'is_online': p.is_online,
        }
        for p in results[:limit]
    ]
    return Response({'results': CollectorMapEntrySerializer(payload, many=True).data})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def collectors_search(request):
    """Predictive collector search — at most 5 collectors matching `q`.

    Matches case-insensitively on first/last name, email local-part and city.
    Returns a minimal payload for the catalogue search dropdown.
    """
    q = (request.query_params.get('q') or '').strip()
    if len(q) < 2:
        return Response({'results': []})

    qs = (
        User.objects.filter(role=User.Role.COLLECTOR.value)
        .exclude(id=request.user.id)
        .filter(
            Q(first_name__icontains=q) | Q(last_name__icontains=q)
            | Q(email__icontains=q) | Q(profile__city__icontains=q),
        )
        .select_related('profile')[:5]
    )
    payload = [
        {
            'user_id': u.id,
            'display_name': _display_name(u),
            'city': getattr(u.profile, 'city', '') if hasattr(u, 'profile') else '',
            'avatar_url': getattr(u.profile, 'avatar_url', '') if hasattr(u, 'profile') else '',
        }
        for u in qs
    ]
    return Response({'results': CollectorSearchResultSerializer(payload, many=True).data})
