"""EmailService — thin wrapper that delegates to the auth_utils mail helpers.

The underlying send functions are exercised in tests/utils/test_auth_utils.py;
these tests verify the service-layer wrapper actually delivers a real email
(via Django's locmem backend) and propagates the success/failure boolean.
"""
import pytest
from django.contrib.auth import get_user_model
from django.core import mail

from albunmania_app.services.email_service import EmailService
from albunmania_app.utils import auth_utils

User = get_user_model()


def _raise_send(*_args, **_kwargs):
    raise RuntimeError('mail backend unavailable')


@pytest.mark.django_db
def test_send_password_reset_code_delivers_email_to_the_user():
    user = User.objects.create_user(email='reset@example.com', password='pw', first_name='Reset')

    result = EmailService.send_password_reset_code(user, '424242')

    assert result is True
    assert len(mail.outbox) == 1
    assert mail.outbox[0].to == ['reset@example.com']


@pytest.mark.django_db
def test_send_password_reset_code_includes_the_code_in_the_body():
    user = User.objects.create_user(email='reset@example.com', password='pw', first_name='Reset')

    EmailService.send_password_reset_code(user, '424242')

    assert '424242' in mail.outbox[0].body


@pytest.mark.django_db
def test_send_password_reset_code_returns_false_when_the_backend_raises(monkeypatch):
    user = User.objects.create_user(email='reset@example.com', password='pw', first_name='Reset')
    monkeypatch.setattr(auth_utils, 'send_mail', _raise_send)

    assert EmailService.send_password_reset_code(user, '424242') is False


@pytest.mark.django_db
def test_send_verification_code_delivers_email_to_the_address():
    result = EmailService.send_verification_code('verify@example.com', '999000')

    assert result is True
    assert len(mail.outbox) == 1
    assert mail.outbox[0].to == ['verify@example.com']


@pytest.mark.django_db
def test_send_verification_code_includes_the_code_in_the_body():
    EmailService.send_verification_code('verify@example.com', '999000')

    assert '999000' in mail.outbox[0].body


@pytest.mark.django_db
def test_send_verification_code_returns_false_when_the_backend_raises(monkeypatch):
    monkeypatch.setattr(auth_utils, 'send_mail', _raise_send)

    assert EmailService.send_verification_code('verify@example.com', '999000') is False
