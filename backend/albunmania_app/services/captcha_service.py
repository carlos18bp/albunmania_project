"""hCaptcha verification service.

Replaces the inline reCAPTCHA logic from views/captcha_views.py.

When the secret is empty (typical local dev), verification is bypassed and
returns True so dev flows can continue without the hCaptcha hosted service.
The official hCaptcha test keys also always return success and are useful
for E2E tests:
    sitekey: 10000000-ffff-ffff-ffff-000000000001
    secret:  0x0000000000000000000000000000000000000000
"""
from __future__ import annotations

import logging

import requests
from django.conf import settings

logger = logging.getLogger(__name__)

HCAPTCHA_VERIFY_URL = 'https://api.hcaptcha.com/siteverify'
DEFAULT_TIMEOUT_SECONDS = 5


def _resolve_secret() -> str:
    """Read HCAPTCHA_SECRET with fallback to legacy RECAPTCHA_SECRET_KEY.

    The fallback exists for the single transition session — settings still
    reads RECAPTCHA_* for backwards compat. Once the env is migrated end to
    end, the legacy lookup can be removed.
    """
    return getattr(settings, 'HCAPTCHA_SECRET', '') or getattr(settings, 'RECAPTCHA_SECRET_KEY', '')


def verify_hcaptcha(token: str) -> bool:
    """Verify an hCaptcha response token against the hCaptcha siteverify API.

    Args:
        token: The hCaptcha response token returned by the frontend widget.

    Returns:
        True when the token is valid (or verification is bypassed because
        no secret is configured); False otherwise.
    """
    secret = _resolve_secret()
    if not secret:
        return True

    if not token:
        return False

    try:
        response = requests.post(
            HCAPTCHA_VERIFY_URL,
            data={'secret': secret, 'response': token},
            timeout=DEFAULT_TIMEOUT_SECONDS,
        )
    except requests.RequestException as exc:
        logger.warning('hCaptcha verification request failed: %s', exc)
        return False

    if response.status_code != 200:
        logger.warning(
            'hCaptcha verification non-200: status=%s body=%s',
            response.status_code, response.text[:200],
        )
        return False

    try:
        payload = response.json()
    except ValueError:
        logger.warning('hCaptcha verification returned non-JSON body: %s', response.text[:200])
        return False

    return bool(payload.get('success', False))
