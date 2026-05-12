"""Presence endpoints — heartbeat ping + active-collectors count."""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from albunmania_app.services import presence


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def presence_ping(request):
    """Heartbeat — the client calls this on an interval while the tab is visible."""
    presence.touch(request.user)
    return Response({'ok': True})


@api_view(['GET'])
@permission_classes([AllowAny])
def presence_active_count(request):
    """`GET /api/presence/active-count/?city=` — collectors active right now."""
    city = (request.query_params.get('city') or '').strip() or None
    return Response({'count': presence.active_collector_count(city), 'city': city})
