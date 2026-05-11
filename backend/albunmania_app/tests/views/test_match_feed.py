"""GET /match/feed/ — proximity-filtered candidates."""
from decimal import Decimal

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from albunmania_app.models import Album, Sticker, UserSticker


User = get_user_model()


def _setup(user, lat, lng, album_id):
    p = user.profile
    p.lat_approx = Decimal(str(lat))
    p.lng_approx = Decimal(str(lng))
    p.browser_geo_optin = True
    p.active_album_id = album_id
    p.save()


@pytest.fixture
def album(db):
    return Album.objects.create(name='M26', slug='m26', edition_year=2026, total_stickers=10)


@pytest.fixture
def stickers(db, album):
    return [Sticker.objects.create(album=album, number=str(i), name=f's{i}') for i in range(1, 4)]


@pytest.fixture
def me(db):
    return User.objects.create_user(email='me@x.com', password='pw')


@pytest.mark.django_db
def test_feed_returns_empty_when_user_not_geo_opted_in(me):
    client = APIClient()
    client.force_authenticate(user=me)
    res = client.get('/api/match/feed/')
    assert res.status_code == 200
    assert res.json() == {'results': []}


@pytest.mark.django_db
def test_feed_returns_only_candidates_within_radius(me, album, stickers):
    _setup(me, 4.7, -74.0, album.id)
    UserSticker.objects.create(user=me, sticker=stickers[0], count=2)

    near = User.objects.create_user(email='near@x.com', password='pw')
    _setup(near, 4.701, -74.001, album.id)
    UserSticker.objects.create(user=near, sticker=stickers[0], count=0)

    far = User.objects.create_user(email='far@x.com', password='pw')
    _setup(far, 6.24, -75.58, album.id)
    UserSticker.objects.create(user=far, sticker=stickers[0], count=0)

    client = APIClient()
    client.force_authenticate(user=me)
    res = client.get('/api/match/feed/?radius_km=10')
    body = res.json()
    user_ids = [c['user_id'] for c in body['results']]
    assert near.id in user_ids
    assert far.id not in user_ids


@pytest.mark.django_db
def test_feed_validates_query_params(me):
    client = APIClient()
    client.force_authenticate(user=me)
    res = client.get('/api/match/feed/?radius_km=notanumber')
    assert res.status_code == 400


@pytest.mark.django_db
def test_feed_requires_authentication():
    client = APIClient()
    res = client.get('/api/match/feed/')
    assert res.status_code in (401, 403)
