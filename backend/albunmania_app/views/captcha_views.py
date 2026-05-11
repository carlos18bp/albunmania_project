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

import requests  # re-exported so existing tests can monkeypatch it here

from albunmania_app.services.captcha_service import verify_hcaptcha


def verify_recaptcha(token: str) -> bool:
    """Backwards-compat shim: routes to the hCaptcha service.

    Existing tests in tests/views/test_captcha_views.py and other call sites
    import `verify_recaptcha` from this module. Keep it importable so the
    captcha migration is incremental.
    """
    return verify_hcaptcha(token)


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
