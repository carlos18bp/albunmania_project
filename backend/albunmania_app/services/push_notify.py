"""Send Web Push notifications via VAPID + pywebpush.

`send_to(user, payload)` iterates the user's `PushSubscription` rows
and posts the encrypted payload to each push service endpoint. Stale
subscriptions (404 / 410 from the push service) are deleted so the
collector's notification list stays clean.

A failed delivery is logged and swallowed — push is best-effort.
"""
from __future__ import annotations

import json
import logging

from django.conf import settings

from albunmania_app.models import PushSubscription

try:
    from pywebpush import WebPushException, webpush  # type: ignore
except ImportError:  # pragma: no cover — pywebpush listed in requirements
    webpush = None  # type: ignore
    WebPushException = Exception  # type: ignore


logger = logging.getLogger(__name__)


def _vapid_claims() -> dict:
    return {
        'sub': f'mailto:{getattr(settings, "VAPID_CLAIMS_EMAIL", "admin@albunmania.co")}',
    }


def send_to(user, payload: dict) -> tuple[int, int]:
    """Send `payload` (JSON-serialisable) to every subscription of `user`.

    Returns `(sent, dropped)` — sent = successful posts, dropped = stale
    subscriptions cleaned up.
    """
    private_key = getattr(settings, 'VAPID_PRIVATE_KEY', '')
    if not private_key or webpush is None:
        logger.warning('push_notify.send_to skipped: VAPID not configured.')
        return (0, 0)

    sent = 0
    dropped = 0
    body = json.dumps(payload)

    for sub in PushSubscription.objects.filter(user=user):
        try:
            webpush(
                subscription_info={
                    'endpoint': sub.endpoint,
                    'keys': {'p256dh': sub.p256dh, 'auth': sub.auth},
                },
                data=body,
                vapid_private_key=private_key,
                vapid_claims=_vapid_claims(),
            )
            sent += 1
        except WebPushException as exc:
            status = getattr(getattr(exc, 'response', None), 'status_code', None)
            if status in (404, 410):
                sub.delete()
                dropped += 1
            else:
                logger.warning('push_notify failed for sub %s: %s', sub.id, exc)
        except Exception as exc:  # noqa: BLE001 — best-effort
            logger.warning('push_notify unexpected error for sub %s: %s', sub.id, exc)

    return (sent, dropped)


def build_match_mutual_payload(*, match_id: int, other_user_email: str) -> dict:
    """Standard payload for the Match mutual notification."""
    return {
        'title': '¡Match en Albunmanía!',
        'body': f'{other_user_email} también quiere intercambiar contigo.',
        'icon': '/icons/icon-192.png',
        'badge': '/icons/icon-192.png',
        'data': {'url': f'/match/{match_id}'},
    }
