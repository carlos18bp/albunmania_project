import pytest
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import override_settings
from django.urls import reverse
from rest_framework import status

from albunmania_app.views import auth as auth_views


@pytest.fixture(autouse=True)
def _clear_presence_cache():
    cache.clear()
    yield
    cache.clear()


class DummyResponse:
    def __init__(self, status_code=200, payload=None, text=''):
        self.status_code = status_code
        self._payload = payload or {}
        self.text = text

    def json(self):
        return self._payload


# --------------------------------------------------------------------------- google login

@pytest.mark.django_db
def test_google_login_requires_credential(api_client):
    response = api_client.post(reverse('google_login'), {}, format='json')

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.json()['error'] == 'Google credential is required'


@pytest.mark.django_db
@override_settings(DEBUG=False, GOOGLE_OAUTH_CLIENT_ID='')
def test_google_login_invalid_credential_when_not_debug(api_client, monkeypatch):
    """Verifies Google login returns 401 when credential is invalid and the app is not in debug mode."""

    def fake_get(*_args, **_kwargs):
        return DummyResponse(status_code=500)

    monkeypatch.setattr(auth_views.requests, 'get', fake_get)

    response = api_client.post(
        reverse('google_login'),
        {'credential': 'bad-token', 'email': 'user@example.com'},
        format='json',
    )

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert response.json()['error'] == 'Invalid Google credential'


@pytest.mark.django_db
@override_settings(DEBUG=False, GOOGLE_OAUTH_CLIENT_ID='client-1')
def test_google_login_aud_mismatch_returns_error(api_client, monkeypatch):
    """Verifies Google login returns 401 when the token audience does not match the configured client ID."""

    def fake_get(*_args, **_kwargs):
        return DummyResponse(status_code=200, payload={'aud': 'other'})

    monkeypatch.setattr(auth_views.requests, 'get', fake_get)

    response = api_client.post(
        reverse('google_login'),
        {'credential': 'bad-aud', 'email': 'user@example.com'},
        format='json',
    )

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert response.json()['error'] == 'Invalid Google client'


@pytest.mark.django_db
@override_settings(DEBUG=True)
def test_google_login_requires_email_when_payload_missing(api_client, monkeypatch):
    """Verifies Google login returns 400 when the Google API call fails and no fallback email is provided."""

    def fake_get(*_args, **_kwargs):
        raise auth_views.requests.RequestException('fail')

    monkeypatch.setattr(auth_views.requests, 'get', fake_get)

    response = api_client.post(
        reverse('google_login'),
        {'credential': 'token'},
        format='json',
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.json()['error'] == 'Email is required'


@pytest.mark.django_db
@override_settings(DEBUG=False, GOOGLE_OAUTH_CLIENT_ID='client-1')
def test_google_login_creates_user_with_payload(api_client, monkeypatch):
    """Verifies Google login creates a new user when the token payload contains a valid audience and email."""

    payload = {
        'aud': 'client-1',
        'email': 'google@example.com',
        'given_name': 'Google',
        'family_name': 'User',
        'picture': 'pic',
    }

    def fake_get(*_args, **_kwargs):
        return DummyResponse(status_code=200, payload=payload)

    monkeypatch.setattr(auth_views.requests, 'get', fake_get)
    # Bypass the People-API account age check (covered by dedicated tests).
    monkeypatch.setattr(auth_views, 'verify_account_age', lambda token, min_days=30: (True, 365))

    response = api_client.post(
        reverse('google_login'),
        {'credential': 'token', 'email': 'other@example.com'},
        format='json',
    )

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data['created'] is True
    assert data['google_validated'] is True

    User = get_user_model()
    user = User.objects.get(email='google@example.com')
    assert user.first_name == 'Google'


@pytest.mark.django_db
@override_settings(DEBUG=False, GOOGLE_OAUTH_CLIENT_ID='client-1')
def test_google_login_updates_existing_user_names(api_client, monkeypatch):
    """Verifies Google login updates the first and last name of an existing user when the payload provides new values."""

    User = get_user_model()
    user = User.objects.create_user(email='existing@example.com', password='pass1234')
    user.first_name = ''
    user.last_name = ''
    user.save(update_fields=['first_name', 'last_name'])

    payload = {
        'aud': 'client-1',
        'email': 'existing@example.com',
        'given_name': 'Given',
        'family_name': 'Name',
    }

    def fake_get(*_args, **_kwargs):
        return DummyResponse(status_code=200, payload=payload)

    monkeypatch.setattr(auth_views.requests, 'get', fake_get)

    response = api_client.post(
        reverse('google_login'),
        {'credential': 'token'},
        format='json',
    )

    assert response.status_code == status.HTTP_200_OK
    assert response.json()['created'] is False

    user.refresh_from_db()
    assert user.first_name == 'Given'
    assert user.last_name == 'Name'


@pytest.mark.django_db
@override_settings(DEBUG=True)
def test_google_login_allows_debug_without_payload(api_client, monkeypatch):
    """Verifies Google login succeeds in debug mode using the fallback email when the Google API call fails."""

    def fake_get(*_args, **_kwargs):
        return DummyResponse(status_code=500)

    monkeypatch.setattr(auth_views.requests, 'get', fake_get)

    response = api_client.post(
        reverse('google_login'),
        {'credential': 'token', 'email': 'debug@example.com'},
        format='json',
    )

    assert response.status_code == status.HTTP_200_OK
    assert response.json()['google_validated'] is False


# --------------------------------------------------------------------------- validate token

@pytest.mark.django_db
def test_validate_token_requires_auth(api_client):
    response = api_client.get(reverse('validate_token'))

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
def test_validate_token_success(api_client):
    User = get_user_model()
    user = User.objects.create_user(email='token@example.com', password='pass1234')

    api_client.force_authenticate(user=user)
    response = api_client.get(reverse('validate_token'))

    assert response.status_code == status.HTTP_200_OK
    assert response.json()['valid'] is True


@pytest.mark.django_db
def test_validate_token_refreshes_presence(api_client):
    """validate_token bumps Profile.last_seen (presence)."""
    User = get_user_model()
    user = User.objects.create_user(email='presence@example.com', password='pass1234')
    assert user.profile.last_seen is None

    api_client.force_authenticate(user=user)
    api_client.get(reverse('validate_token'))

    user.profile.refresh_from_db()
    assert user.profile.last_seen is not None
