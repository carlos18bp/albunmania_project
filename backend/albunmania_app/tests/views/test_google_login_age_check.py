"""Integration tests for the Google account-age rule on /auth/google-login/."""
from unittest.mock import patch

import pytest
from django.test import override_settings
from django.urls import reverse
from rest_framework import status

from albunmania_app.views import auth as auth_views


class _DummyTokeninfo:
    def __init__(self, payload):
        self.status_code = 200
        self.text = ''
        self._payload = payload

    def json(self):
        return self._payload


def _patch_tokeninfo(monkeypatch, payload):
    monkeypatch.setattr(
        auth_views.requests, 'get',
        lambda *args, **kwargs: _DummyTokeninfo(payload),
    )


@pytest.mark.django_db
@override_settings(DEBUG=False, GOOGLE_OAUTH_CLIENT_ID='client-1')
def test_new_user_is_blocked_when_google_account_too_young(api_client, monkeypatch):
    _patch_tokeninfo(monkeypatch, {'aud': 'client-1', 'email': 'young@example.com'})

    with patch(
        'albunmania_app.views.auth.verify_account_age',
        return_value=(False, 7),
    ):
        response = api_client.post(
            reverse('google_login'),
            {'credential': 'token', 'access_token': 'access', 'email': 'young@example.com'},
            format='json',
        )

    assert response.status_code == status.HTTP_403_FORBIDDEN
    body = response.json()
    assert body['error'] == 'account_too_young'
    assert body['account_age_days'] == 7
    assert body['min_days'] == 30


@pytest.mark.django_db
@override_settings(DEBUG=False, GOOGLE_OAUTH_CLIENT_ID='client-1')
def test_new_user_is_allowed_when_google_account_old_enough(api_client, monkeypatch):
    _patch_tokeninfo(monkeypatch, {'aud': 'client-1', 'email': 'oldenough@example.com'})

    with patch(
        'albunmania_app.views.auth.verify_account_age',
        return_value=(True, 365),
    ):
        response = api_client.post(
            reverse('google_login'),
            {'credential': 'token', 'access_token': 'access', 'email': 'oldenough@example.com'},
            format='json',
        )

    assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
@override_settings(DEBUG=False, GOOGLE_OAUTH_CLIENT_ID='client-1')
def test_returning_user_skips_age_check(api_client, monkeypatch):
    """Existing users should not be blocked even if the People API says <30 days."""
    from django.contrib.auth import get_user_model
    User = get_user_model()
    User.objects.create_user(email='returning@example.com', password='pass1234')

    _patch_tokeninfo(monkeypatch, {'aud': 'client-1', 'email': 'returning@example.com'})

    # verify_account_age would return (False, 5) but the view never reaches it.
    response = api_client.post(
        reverse('google_login'),
        {'credential': 'token', 'access_token': 'access', 'email': 'returning@example.com'},
        format='json',
    )

    assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
@override_settings(DEBUG=False, GOOGLE_OAUTH_CLIENT_ID='client-1', HCAPTCHA_SECRET='secret')
def test_captcha_failure_blocks_google_login(api_client, monkeypatch):
    _patch_tokeninfo(monkeypatch, {'aud': 'client-1', 'email': 'cap@example.com'})

    response = api_client.post(
        reverse('google_login'),
        {'credential': 'token', 'access_token': 'access', 'email': 'cap@example.com', 'captcha_token': ''},
        format='json',
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.json()['error'] == 'captcha_failed'
