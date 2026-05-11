"""Sponsor endpoints — public active + admin CRUD."""
from datetime import timedelta

import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status

from albunmania_app.models import Sponsor


def _make_active_sponsor(name='Coca-Cola'):
    now = timezone.now()
    return Sponsor.objects.create(
        brand_name=name,
        logo_url='https://example.com/logo.png',
        primary_color='#000', secondary_color='#fff',
        active_from=now - timedelta(days=1), active_until=now + timedelta(days=30),
    )


@pytest.mark.django_db
def test_sponsor_active_is_public_and_returns_null_when_none(api_client):
    response = api_client.get(reverse('sponsor-active'))

    assert response.status_code == status.HTTP_200_OK
    assert response.json() == {'active': None}


@pytest.mark.django_db
def test_sponsor_active_returns_current_brand(api_client):
    sponsor = _make_active_sponsor('Bavaria')

    response = api_client.get(reverse('sponsor-active'))

    body = response.json()['active']
    assert body['brand_name'] == 'Bavaria'
    assert body['is_currently_active'] is True
    assert 'contract_amount' not in body  # Public serializer hides money.


@pytest.mark.django_db
def test_sponsor_admin_collection_requires_role(api_client):
    User = get_user_model()
    user = User.objects.create_user(email='c@example.com', password='pass1234')
    api_client.force_authenticate(user=user)

    response = api_client.get(reverse('sponsor-admin-collection'))

    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_sponsor_admin_collection_lists_all_for_web_manager(api_client):
    User = get_user_model()
    user = User.objects.create_user(
        email='wm@example.com', password='pass1234', role=User.Role.WEB_MANAGER,
    )
    api_client.force_authenticate(user=user)
    _make_active_sponsor('A')
    _make_active_sponsor('B')

    response = api_client.get(reverse('sponsor-admin-collection'))

    assert response.status_code == status.HTTP_200_OK
    assert len(response.json()) == 2


@pytest.mark.django_db
def test_sponsor_admin_collection_creates_for_admin(api_client):
    User = get_user_model()
    user = User.objects.create_user(
        email='admin@example.com', password='pass1234', role=User.Role.ADMIN,
    )
    api_client.force_authenticate(user=user)
    now = timezone.now()

    response = api_client.post(
        reverse('sponsor-admin-collection'),
        {
            'brand_name': 'Postobón',
            'logo_url': 'https://example.com/logo.png',
            'primary_color': '#ff0000',
            'secondary_color': '#ffffff',
            'message_text': 'Sed con sabor',
            'active_from': (now - timedelta(days=1)).isoformat(),
            'active_until': (now + timedelta(days=30)).isoformat(),
            'contract_amount': '5000000.00',
        },
        format='json',
    )

    assert response.status_code == status.HTTP_201_CREATED
    assert Sponsor.objects.filter(brand_name='Postobón').exists()


@pytest.mark.django_db
def test_sponsor_admin_detail_patch_updates_fields(api_client):
    User = get_user_model()
    user = User.objects.create_user(email='wm@example.com', password='pass1234', role=User.Role.WEB_MANAGER)
    api_client.force_authenticate(user=user)
    sponsor = _make_active_sponsor('Bavaria')

    response = api_client.patch(
        reverse('sponsor-admin-detail', args=[sponsor.id]),
        {'message_text': 'Nuevo lema'},
        format='json',
    )

    assert response.status_code == status.HTTP_200_OK
    sponsor.refresh_from_db()
    assert sponsor.message_text == 'Nuevo lema'


@pytest.mark.django_db
def test_sponsor_admin_detail_delete(api_client):
    User = get_user_model()
    user = User.objects.create_user(email='admin@example.com', password='pass1234', role=User.Role.ADMIN)
    api_client.force_authenticate(user=user)
    sponsor = _make_active_sponsor('Temp')

    response = api_client.delete(reverse('sponsor-admin-detail', args=[sponsor.id]))

    assert response.status_code == status.HTTP_204_NO_CONTENT
    assert not Sponsor.objects.filter(id=sponsor.id).exists()


@pytest.mark.django_db
def test_sponsor_admin_detail_collector_forbidden(api_client):
    User = get_user_model()
    user = User.objects.create_user(email='c@example.com', password='pass1234')
    api_client.force_authenticate(user=user)
    sponsor = _make_active_sponsor('Bavaria')

    response = api_client.patch(
        reverse('sponsor-admin-detail', args=[sponsor.id]), {'message_text': 'X'}, format='json',
    )

    assert response.status_code == status.HTTP_403_FORBIDDEN
