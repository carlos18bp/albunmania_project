"""PATCH /api/profile/me/onboarding/ tests."""
import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status


@pytest.fixture
def authed_client(api_client):
    User = get_user_model()
    user = User.objects.create_user(email='c@example.com', password='pass1234')
    api_client.force_authenticate(user=user)
    return api_client, user


@pytest.mark.django_db
def test_requires_authentication(api_client):
    response = api_client.patch(reverse('profile-onboarding'), {}, format='json')

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
def test_persists_three_step_payload(authed_client):
    client, user = authed_client

    response = client.patch(
        reverse('profile-onboarding'),
        {
            'active_album_id': 1,
            'lat_approx': '4.711',
            'lng_approx': '-74.072',
            'city': 'Bogotá',
            'browser_geo_optin': True,
            'push_optin': True,
            'whatsapp_optin': False,
        },
        format='json',
    )

    assert response.status_code == status.HTTP_200_OK
    body = response.json()
    assert body['is_onboarded'] is True
    user.profile.refresh_from_db()
    assert user.profile.active_album_id == 1
    assert user.profile.city == 'Bogotá'
    assert user.profile.push_optin is True


@pytest.mark.django_db
def test_whatsapp_optin_requires_phone_number(authed_client):
    client, _ = authed_client

    response = client.patch(
        reverse('profile-onboarding'),
        {'whatsapp_optin': True},
        format='json',
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert 'whatsapp_e164' in response.json()


@pytest.mark.django_db
def test_whatsapp_optin_with_valid_number_succeeds(authed_client):
    client, user = authed_client

    response = client.patch(
        reverse('profile-onboarding'),
        {'whatsapp_optin': True, 'whatsapp_e164': '+573001234567'},
        format='json',
    )

    assert response.status_code == status.HTTP_200_OK
    user.profile.refresh_from_db()
    assert user.profile.whatsapp_optin is True
    assert user.profile.whatsapp_e164 == '+573001234567'


@pytest.mark.django_db
def test_invalid_e164_format_is_rejected(authed_client):
    client, _ = authed_client

    response = client.patch(
        reverse('profile-onboarding'),
        {'whatsapp_optin': True, 'whatsapp_e164': 'not-a-number'},
        format='json',
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
def test_endpoint_is_idempotent(authed_client):
    client, user = authed_client

    payload = {'active_album_id': 1, 'city': 'Cali'}
    client.patch(reverse('profile-onboarding'), payload, format='json')
    client.patch(reverse('profile-onboarding'), payload, format='json')

    user.profile.refresh_from_db()
    assert user.profile.active_album_id == 1
    assert user.profile.city == 'Cali'


@pytest.mark.django_db
def test_partial_update_does_not_clear_unsent_fields(authed_client):
    client, user = authed_client

    client.patch(
        reverse('profile-onboarding'),
        {'active_album_id': 1, 'city': 'Medellín'},
        format='json',
    )
    client.patch(
        reverse('profile-onboarding'),
        {'push_optin': True},
        format='json',
    )

    user.profile.refresh_from_db()
    assert user.profile.city == 'Medellín'
    assert user.profile.push_optin is True
