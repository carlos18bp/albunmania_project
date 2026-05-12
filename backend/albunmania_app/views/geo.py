"""Geolocation endpoints — IP-based location lookup (GeoIP2)."""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from albunmania_app.services import geoip


@api_view(['GET'])
@permission_classes([AllowAny])
def geo_ip_locate(request):
    """`GET /api/geo/ip-locate/` — approximate location from the caller's IP.

    Returns `{available: bool, lat?, lng?, city?, country?, source: 'geoip'}`.
    The onboarding wizard calls this to pre-fill the map before asking for the
    precise browser geolocation; when the GeoIP2 DB isn't provisioned it just
    returns `{available: false}` and the wizard falls back to the browser API.
    """
    if not geoip.available():
        return Response({'available': False, 'source': 'geoip'})
    loc = geoip.locate_ip(geoip.client_ip(request))
    if not loc:
        return Response({'available': True, 'located': False, 'source': 'geoip'})
    return Response({'available': True, 'located': True, 'source': 'geoip', **loc})
