"""Catalogue `availability` + `nearby` (proximity-radius) filters on /albums/<slug>/stickers/."""
from decimal import Decimal

import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from albunmania_app.models import Album, Profile, Sticker, UserSticker

User = get_user_model()


@pytest.fixture
def album(db):
    return Album.objects.create(name='Mundial 26', slug='mundial-26', edition_year=2026, total_stickers=670)


@pytest.fixture
def stickers(db, album):
    s1 = Sticker.objects.create(album=album, number='1', name='Mbappé', team='Francia')
    s2 = Sticker.objects.create(album=album, number='2', name='Messi', team='Argentina')
    s3 = Sticker.objects.create(album=album, number='3', name='Vinícius', team='Brasil')
    return s1, s2, s3


def _client(user=None):
    c = APIClient()
    if user is not None:
        c.force_authenticate(user=user)
    return c


def _url():
    return reverse('album-stickers', args=['mundial-26'])


def _ids(response):
    return sorted(r['id'] for r in response.json()['results'])


# --------------------------------------------------------------------------- availability

@pytest.mark.django_db
def test_availability_requires_authentication(album, stickers):
    res = _client().get(_url(), {'availability': 'missing'})
    assert res.status_code == status.HTTP_400_BAD_REQUEST
    assert res.json()['error'] == 'auth_required_for_filter'


@pytest.mark.django_db
def test_availability_mine_returns_only_owned_stickers(album, stickers):
    me = User.objects.create_user(email='me@example.com', password='pw')
    s1, s2, s3 = stickers
    UserSticker.objects.create(user=me, sticker=s1, count=1)
    UserSticker.objects.create(user=me, sticker=s2, count=2)
    UserSticker.objects.create(user=me, sticker=s3, count=0)

    res = _client(me).get(_url(), {'availability': 'mine'})

    assert res.status_code == status.HTTP_200_OK
    assert _ids(res) == sorted([s1.id, s2.id])


@pytest.mark.django_db
def test_availability_missing_excludes_owned_stickers(album, stickers):
    me = User.objects.create_user(email='me@example.com', password='pw')
    s1, s2, s3 = stickers
    UserSticker.objects.create(user=me, sticker=s1, count=1)
    UserSticker.objects.create(user=me, sticker=s3, count=0)  # count 0 still counts as missing

    res = _client(me).get(_url(), {'availability': 'missing'})

    assert _ids(res) == sorted([s2.id, s3.id])


@pytest.mark.django_db
def test_availability_repeated_returns_only_count_ge_2(album, stickers):
    me = User.objects.create_user(email='me@example.com', password='pw')
    s1, s2, s3 = stickers
    UserSticker.objects.create(user=me, sticker=s1, count=1)
    UserSticker.objects.create(user=me, sticker=s2, count=3)

    res = _client(me).get(_url(), {'availability': 'repeated'})

    assert _ids(res) == [s2.id]


@pytest.mark.django_db
def test_availability_combines_with_other_filters(album, stickers):
    me = User.objects.create_user(email='me@example.com', password='pw')
    s1, s2, s3 = stickers
    UserSticker.objects.create(user=me, sticker=s2, count=1)

    # availability=missing AND team=Argentina → s2 is owned so excluded → empty
    res = _client(me).get(_url(), {'availability': 'missing', 'team': 'Argentina'})
    assert _ids(res) == []


# --------------------------------------------------------------------------- nearby (proximity)

def _located(email, lat, lng, *, album=None):
    user = User.objects.create_user(email=email, password='pw')
    Profile.objects.filter(user=user).update(
        lat_approx=Decimal(str(lat)), lng_approx=Decimal(str(lng)),
        active_album_id=album.id if album else None,
    )
    user.refresh_from_db()  # drop the reverse-OneToOne cache the create signal warmed
    return user


@pytest.mark.django_db
def test_nearby_requires_authentication(album, stickers):
    res = _client().get(_url(), {'nearby': 'true', 'lat': 4.65, 'lng': -74.07})
    assert res.status_code == status.HTTP_400_BAD_REQUEST
    assert res.json()['error'] == 'auth_required_for_filter'


@pytest.mark.django_db
def test_nearby_without_geo_and_no_profile_location_is_400(album, stickers):
    me = User.objects.create_user(email='me@example.com', password='pw')  # no lat/lng on profile
    res = _client(me).get(_url(), {'nearby': 'true'})
    assert res.status_code == status.HTTP_400_BAD_REQUEST
    assert res.json()['error'] == 'geo_required_for_proximity'


@pytest.mark.django_db
def test_nearby_rejects_non_numeric_lat_lng(album, stickers):
    me = User.objects.create_user(email='me@example.com', password='pw')
    res = _client(me).get(_url(), {'nearby': 'true', 'lat': 'x', 'lng': 'y'})
    assert res.status_code == status.HTTP_400_BAD_REQUEST
    assert res.json()['error'] == 'invalid_geo_params'


@pytest.mark.django_db
def test_nearby_rejects_non_numeric_radius(album, stickers):
    me = _located('me@example.com', 4.65, -74.07)
    res = _client(me).get(_url(), {'nearby': 'true', 'radius_km': 'banana'})
    assert res.status_code == status.HTTP_400_BAD_REQUEST
    assert res.json()['error'] == 'invalid_geo_params'


@pytest.mark.django_db
def test_nearby_keeps_only_stickers_a_nearby_collector_offers(album, stickers):
    me = User.objects.create_user(email='me@example.com', password='pw')
    s1, s2, s3 = stickers
    near = _located('near@example.com', 4.66, -74.06)
    far = _located('far@example.com', 10.0, -75.0)
    UserSticker.objects.create(user=near, sticker=s1, count=2)   # offered, near → included
    UserSticker.objects.create(user=near, sticker=s2, count=1)   # owned but not extra → not offered
    UserSticker.objects.create(user=far, sticker=s3, count=3)    # offered but far → excluded

    res = _client(me).get(_url(), {'nearby': 'true', 'lat': 4.65, 'lng': -74.07, 'radius_km': 5})

    assert _ids(res) == [s1.id]


@pytest.mark.django_db
def test_nearby_excludes_the_requesters_own_offers(album, stickers):
    me = _located('me@example.com', 4.65, -74.07)
    s1, s2, s3 = stickers
    UserSticker.objects.create(user=me, sticker=s1, count=2)  # I offer it — but I shouldn't see my own

    res = _client(me).get(_url(), {'nearby': 'true', 'lat': 4.65, 'lng': -74.07, 'radius_km': 5})

    assert _ids(res) == []


@pytest.mark.django_db
def test_nearby_falls_back_to_the_requesters_profile_location(album, stickers):
    me = _located('me@example.com', 4.65, -74.07)
    s1, s2, s3 = stickers
    near = _located('near@example.com', 4.66, -74.06)
    UserSticker.objects.create(user=near, sticker=s2, count=2)

    res = _client(me).get(_url(), {'nearby': 'true', 'radius_km': 5})  # no lat/lng → use my Profile

    assert _ids(res) == [s2.id]


@pytest.mark.django_db
def test_nearby_combines_with_availability(album, stickers):
    me = _located('me@example.com', 4.65, -74.07)
    s1, s2, s3 = stickers
    near = _located('near@example.com', 4.66, -74.06)
    UserSticker.objects.create(user=near, sticker=s1, count=2)
    UserSticker.objects.create(user=near, sticker=s2, count=2)
    UserSticker.objects.create(user=me, sticker=s1, count=1)  # I already have s1

    # missing AND nearby → s2 (nearby has it, I don't own it); s1 excluded (I own it)
    res = _client(me).get(_url(), {'nearby': 'true', 'availability': 'missing', 'lat': 4.65, 'lng': -74.07, 'radius_km': 5})

    assert _ids(res) == [s2.id]
