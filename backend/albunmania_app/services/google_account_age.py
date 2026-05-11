"""Google account age verification via People API.

Albunmanía's Auth & Onboarding spec requires that only Google accounts older
than 30 days can register. Google's id_token does NOT carry account creation
date — only `iat` (token issuance time). The only reliable signal is the
People API field `metadata.sources[].createTime`, which is exposed when the
client requests it with the `profile` scope.

Frontend integration:
    Use `@react-oauth/google` `useGoogleLogin({ flow: 'implicit' })` which
    returns an `access_token`. POST it to `/auth/google-login/` together with
    the id_token `credential`. The backend forwards the access_token here.

Dev / test behaviour:
    - When `access_token` is empty and `DJANGO_DEBUG` is True, the check is
      bypassed and the function returns (True, -1) so dev flows keep working
      without coordinated frontend changes.
    - When `access_token` is empty and `DJANGO_DEBUG` is False, the check
      fails (False, -1).
    - Tests mock `requests.get` to control the People API response.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone

import requests
from django.conf import settings

logger = logging.getLogger(__name__)

PEOPLE_API_URL = (
    'https://people.googleapis.com/v1/people/me'
    '?personFields=metadata'
)
DEFAULT_TIMEOUT_SECONDS = 5
MIN_ACCOUNT_AGE_DAYS = 30


def _parse_create_time(create_time_iso: str) -> datetime | None:
    """Parse a People API `createTime` value (RFC 3339) to an aware datetime."""
    if not create_time_iso:
        return None
    try:
        # People API returns e.g. "2020-04-15T13:42:11.123Z"
        if create_time_iso.endswith('Z'):
            create_time_iso = create_time_iso[:-1] + '+00:00'
        return datetime.fromisoformat(create_time_iso)
    except ValueError:
        logger.warning('Could not parse Google People API createTime: %s', create_time_iso)
        return None


def verify_account_age(
    access_token: str,
    min_days: int = MIN_ACCOUNT_AGE_DAYS,
) -> tuple[bool, int]:
    """Check whether a Google account is at least `min_days` old.

    Args:
        access_token: OAuth access token obtained from the Google sign-in
            flow on the frontend.
        min_days: Minimum age in calendar days the account must have to be
            considered eligible.

    Returns:
        Tuple `(is_old_enough, account_age_days)`.
        `account_age_days` is `-1` when the check could not be performed
        (missing token in DEBUG mode, network failure, missing createTime
        field in the response).
    """
    if not access_token:
        if getattr(settings, 'DEBUG', False):
            logger.info(
                'Google account age check bypassed in DEBUG mode (no access_token).',
            )
            return True, -1
        logger.warning('Google account age check failed: missing access_token.')
        return False, -1

    try:
        response = requests.get(
            PEOPLE_API_URL,
            headers={'Authorization': f'Bearer {access_token}'},
            timeout=DEFAULT_TIMEOUT_SECONDS,
        )
    except requests.RequestException as exc:
        logger.warning('Google People API request failed: %s', exc)
        return False, -1

    if response.status_code != 200:
        logger.warning(
            'Google People API non-200: status=%s body=%s',
            response.status_code, response.text[:200],
        )
        return False, -1

    try:
        payload = response.json()
    except ValueError:
        logger.warning('Google People API returned non-JSON body.')
        return False, -1

    sources = (payload.get('metadata') or {}).get('sources') or []
    earliest: datetime | None = None
    for source in sources:
        create_time = _parse_create_time(source.get('createTime') or '')
        if create_time is None:
            continue
        if earliest is None or create_time < earliest:
            earliest = create_time

    if earliest is None:
        logger.warning('Google People API response missing metadata.sources[].createTime.')
        return False, -1

    age = datetime.now(timezone.utc) - earliest
    age_days = age.days
    return age_days >= min_days, age_days
