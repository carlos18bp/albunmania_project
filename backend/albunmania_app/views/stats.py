"""Stats endpoints for the collector dashboard (Epic 12)."""
from dataclasses import asdict

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from albunmania_app.services.stats_engine import city_ranking, compute_stats


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def stats_me(request):
    """Return the caller's collector stats for the active album."""
    stats = compute_stats(request.user)
    return Response(asdict(stats))


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def stats_ranking(request):
    """Top collectors of `?album_id=` in `?city=`."""
    try:
        album_id = int(request.query_params.get('album_id', 0))
    except (TypeError, ValueError):
        return Response({'error': 'invalid_album_id'}, status=status.HTTP_400_BAD_REQUEST)

    city = request.query_params.get('city') or ''
    if album_id <= 0 or not city.strip():
        return Response({'error': 'album_id_and_city_required'},
                        status=status.HTTP_400_BAD_REQUEST)

    return Response({'results': city_ranking(album_id, city)})
