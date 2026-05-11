"""Inventory endpoints — list, bulk sync, single tap."""
import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status

from albunmania_app.models import Album, Sticker, UserSticker


@pytest.fixture
def album(db):
    return Album.objects.create(name='Mundial 26', slug='mundial-26', edition_year=2026)


@pytest.fixture
def sticker_a(db, album):
    return Sticker.objects.create(album=album, number='1', name='A')


@pytest.fixture
def sticker_b(db, album):
    return Sticker.objects.create(album=album, number='2', name='B')


@pytest.fixture
def authed(db, api_client):
    user = get_user_model().objects.create_user(email='c@example.com', password='pass1234')
    api_client.force_authenticate(user=user)
    return api_client, user


@pytest.mark.django_db
def test_inventory_requires_auth(api_client):
    response = api_client.get(reverse('inventory-list'))
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
def test_inventory_list_returns_user_rows(authed, sticker_a, sticker_b):
    client, user = authed
    UserSticker.objects.create(user=user, sticker=sticker_a, count=1)
    UserSticker.objects.create(user=user, sticker=sticker_b, count=2)

    response = client.get(reverse('inventory-list'))

    assert response.status_code == status.HTTP_200_OK
    assert len(response.json()) == 2


@pytest.mark.django_db
def test_inventory_list_scoped_by_album_slug(authed, album, sticker_a):
    client, user = authed
    other_album = Album.objects.create(name='Champions', slug='champions', edition_year=2025)
    other_sticker = Sticker.objects.create(album=other_album, number='1', name='X')
    UserSticker.objects.create(user=user, sticker=sticker_a, count=1)
    UserSticker.objects.create(user=user, sticker=other_sticker, count=1)

    response = client.get(reverse('inventory-list') + '?album_slug=mundial-26')

    assert response.status_code == status.HTTP_200_OK
    assert len(response.json()) == 1


@pytest.mark.django_db
def test_inventory_bulk_creates_and_updates(authed, sticker_a, sticker_b):
    client, user = authed
    UserSticker.objects.create(user=user, sticker=sticker_a, count=1)

    response = client.post(
        reverse('inventory-bulk-sync'),
        {'items': [
            {'sticker': sticker_a.id, 'count': 3},
            {'sticker': sticker_b.id, 'count': 1},
        ]},
        format='json',
    )

    assert response.status_code == status.HTTP_200_OK
    assert response.json()['written'] == 2
    user.refresh_from_db()
    assert UserSticker.objects.get(user=user, sticker=sticker_a).count == 3
    assert UserSticker.objects.get(user=user, sticker=sticker_b).count == 1


@pytest.mark.django_db
def test_inventory_bulk_skips_unknown_sticker_ids(authed, sticker_a):
    client, user = authed

    response = client.post(
        reverse('inventory-bulk-sync'),
        {'items': [
            {'sticker': sticker_a.id, 'count': 1},
            {'sticker': 9999, 'count': 5},
        ]},
        format='json',
    )

    assert response.status_code == status.HTTP_200_OK
    assert response.json()['written'] == 1
    assert response.json()['skipped'] == 1


@pytest.mark.django_db
def test_inventory_bulk_rejects_empty_payload(authed):
    client, _ = authed
    response = client.post(reverse('inventory-bulk-sync'), {'items': []}, format='json')
    assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
def test_inventory_tap_creates_and_increments(authed, sticker_a):
    client, user = authed

    r1 = client.post(reverse('inventory-tap'), {'sticker': sticker_a.id}, format='json')
    r2 = client.post(reverse('inventory-tap'), {'sticker': sticker_a.id}, format='json')

    assert r1.status_code == status.HTTP_200_OK
    assert r1.json()['count'] == 1
    assert r2.json()['count'] == 2


@pytest.mark.django_db
def test_inventory_tap_404_when_sticker_not_found(authed):
    client, _ = authed
    response = client.post(reverse('inventory-tap'), {'sticker': 9999}, format='json')
    assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
def test_inventory_tap_400_without_sticker_id(authed):
    client, _ = authed
    response = client.post(reverse('inventory-tap'), {}, format='json')
    assert response.status_code == status.HTTP_400_BAD_REQUEST
