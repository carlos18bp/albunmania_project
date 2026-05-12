"""qr_token service — round-trip + expiry + tampering + forged-payload paths."""
import time

import pytest

from albunmania_app.services.qr_token import (
    _b64url_encode,
    _sign,
    sign_user_token,
    verify_user_token,
)


def _forge(payload: bytes) -> str:
    """A token whose signature is valid for an arbitrary (possibly bad) payload."""
    return f'{_b64url_encode(payload)}.{_b64url_encode(_sign(payload))}'


@pytest.mark.django_db
def test_sign_and_verify_roundtrip():
    token, exp = sign_user_token(123, ttl_seconds=60)
    assert verify_user_token(token) == 123
    assert exp > int(time.time())


@pytest.mark.django_db
def test_verify_returns_none_for_garbage():
    assert verify_user_token('not-a-token') is None
    assert verify_user_token('') is None
    assert verify_user_token('a.b.c') is None


@pytest.mark.django_db
def test_verify_rejects_tampered_token():
    token, _ = sign_user_token(7)
    payload, sig = token.split('.')
    tampered = payload[:-1] + ('A' if payload[-1] != 'A' else 'B') + '.' + sig
    assert verify_user_token(tampered) is None


@pytest.mark.django_db
def test_verify_rejects_expired_token():
    token, _ = sign_user_token(99, ttl_seconds=1)
    time.sleep(1.1)
    assert verify_user_token(token) is None


@pytest.mark.django_db
def test_sign_rejects_invalid_inputs():
    with pytest.raises(ValueError):
        sign_user_token(0)
    with pytest.raises(ValueError):
        sign_user_token(5, ttl_seconds=0)


@pytest.mark.django_db
def test_verify_rejects_well_signed_token_with_non_utf8_payload():
    assert verify_user_token(_forge(b'\xff\xfe\x00bad')) is None


@pytest.mark.django_db
def test_verify_rejects_well_signed_token_without_delimiter():
    assert verify_user_token(_forge(b'42-no-pipe-9999999999')) is None


@pytest.mark.django_db
def test_verify_rejects_well_signed_token_with_non_positive_user_id():
    exp = int(time.time()) + 3600
    assert verify_user_token(_forge(f'-5|{exp}'.encode('utf-8'))) is None


@pytest.mark.django_db
def test_verify_rejects_token_with_non_b64_halves():
    assert verify_user_token('not!b64.also@not#b64') is None
