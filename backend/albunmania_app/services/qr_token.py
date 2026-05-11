"""HMAC-signed QR tokens for the face-to-face match flow.

A token is a self-contained, tamper-resistant blob that encodes the
issuing user id and an expiration timestamp. It is rendered as a QR by
the frontend, scanned by another collector and POSTed back to verify
identity before the offline inventory cross is confirmed.

Format:
    base64url(payload).base64url(hmac256(payload, SECRET_KEY))

Payload is `<user_id>|<exp_unix>` where exp_unix is an integer. Both
halves use base64 url-safe encoding without padding to stay short
enough for an alphanumeric QR (~30 chars at error correction L).

There is intentionally no library dependency: stdlib `hmac`, `hashlib`,
`base64` and `time` cover everything.
"""
from __future__ import annotations

import base64
import hashlib
import hmac
import time

from django.conf import settings


DEFAULT_TTL_SECONDS = 24 * 60 * 60  # 24h


def _b64url_encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).rstrip(b'=').decode('ascii')


def _b64url_decode(s: str) -> bytes:
    pad = '=' * (-len(s) % 4)
    return base64.urlsafe_b64decode(s + pad)


def _sign(payload: bytes) -> bytes:
    key = settings.SECRET_KEY.encode('utf-8')
    return hmac.new(key, payload, hashlib.sha256).digest()


def sign_user_token(user_id: int, ttl_seconds: int = DEFAULT_TTL_SECONDS) -> tuple[str, int]:
    """Return `(token, expires_at_unix)` for the given user id.

    `ttl_seconds` defaults to 24h. Lower it for sensitive flows.
    """
    if user_id <= 0:
        raise ValueError('user_id must be a positive integer.')
    if ttl_seconds <= 0:
        raise ValueError('ttl_seconds must be positive.')

    expires_at = int(time.time()) + ttl_seconds
    payload = f'{user_id}|{expires_at}'.encode('utf-8')
    sig = _sign(payload)
    token = f'{_b64url_encode(payload)}.{_b64url_encode(sig)}'
    return token, expires_at


def verify_user_token(token: str) -> int | None:
    """Return the issuing user id if `token` is valid and not expired.

    Returns `None` for any failure (malformed, bad signature, expired) —
    the caller should not differentiate to avoid leaking which check
    failed.
    """
    if not isinstance(token, str) or token.count('.') != 1:
        return None
    try:
        payload_b64, sig_b64 = token.split('.', 1)
        payload = _b64url_decode(payload_b64)
        provided_sig = _b64url_decode(sig_b64)
    except (ValueError, base64.binascii.Error):
        return None

    expected_sig = _sign(payload)
    if not hmac.compare_digest(expected_sig, provided_sig):
        return None

    try:
        user_id_str, exp_str = payload.decode('utf-8').split('|', 1)
        user_id = int(user_id_str)
        exp_unix = int(exp_str)
    except (UnicodeDecodeError, ValueError):
        return None

    if exp_unix <= int(time.time()):
        return None
    if user_id <= 0:
        return None

    return user_id
