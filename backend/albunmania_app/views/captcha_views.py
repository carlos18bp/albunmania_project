"""Views for hCaptcha integration.

Provides endpoints to fetch the hCaptcha sitekey and verify captcha tokens.
The verification logic lives in services/captcha_service.py so it can be
reused from other views (e.g. the Google login endpoint).
"""

from django.conf import settings
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from albunmania_app.services.captcha_service import verify_hcaptcha


@api_view(['GET'])
@permission_classes([AllowAny])
def get_site_key(request):
    """Return the hCaptcha sitekey for frontend integration.

    Falls back to the legacy RECAPTCHA_SITE_KEY during the migration window
    so an unset HCAPTCHA_SITEKEY does not break the existing dev flow.
    """
    site_key = (
        getattr(settings, 'HCAPTCHA_SITEKEY', '')
        or getattr(settings, 'RECAPTCHA_SITE_KEY', '')
    )
    return Response({'site_key': site_key})


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_captcha(request):
    """Verify an hCaptcha response token.

    Request body:
        {"token": "hcaptcha-response-token"}
    """
    token = request.data.get('token', '')
    success = verify_hcaptcha(token)

    if success:
        return Response({'success': True})
    return Response(
        {'success': False, 'detail': 'hCaptcha verification failed.'},
        status=status.HTTP_400_BAD_REQUEST,
    )
