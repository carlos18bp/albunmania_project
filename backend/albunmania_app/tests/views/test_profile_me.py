"""GET /api/profile/me/ tests."""
import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status


@pytest.mark.django_db
def test_requires_authentication(api_client):
    response = api_client.get(reverse('profile-me'))

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
def test_returns_user_and_profile(api_client):
    User = get_user_model()
    user = User.objects.create_user(
        email='c@example.com',
        password='pass1234',
        first_name='Carla',
        last_name='Coleccionista',
    )
    api_client.force_authenticate(user=user)

    response = api_client.get(reverse('profile-me'))

    assert response.status_code == status.HTTP_200_OK
    body = response.json()
    assert body['email'] == 'c@example.com'
    assert body['first_name'] == 'Carla'
    assert body['role'] == 'collector'
    assert body['profile']['is_onboarded'] is False


@pytest.mark.django_db
def test_returns_profile_for_merchant_role(api_client):
    User = get_user_model()
    user = User.objects.create_user(
        email='m@example.com',
        password='pass1234',
        role=User.Role.MERCHANT,
    )
    api_client.force_authenticate(user=user)

    response = api_client.get(reverse('profile-me'))

    assert response.status_code == status.HTTP_200_OK
    assert response.json()['role'] == 'merchant'
