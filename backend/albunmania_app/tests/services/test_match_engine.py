"""match_engine — haversine numeric + find_candidates filtering."""
from decimal import Decimal

import pytest
from django.contrib.auth import get_user_model

from albunmania_app.models import Album, Profile, Sticker, UserSticker
from albunmania_app.services.match_engine import find_candidates, haversine_km


User = get_user_model()


def test_haversine_bogota_medellin_distance_known_value():
    bog = (4.711, -74.072)
    med = (6.244, -75.581)
    d = haversine_km(*bog, *med)
    assert 235 <= d <= 245


def test_haversine_zero_for_same_point():
    assert haversine_km(4.7, -74.0, 4.7, -74.0) == pytest.approx(0.0, abs=1e-6)


@pytest.fixture
def album(db):
    return Album.objects.create(name='M26', slug='m26', edition_year=2026, total_stickers=10)


@pytest.fixture
def stickers(db, album):
    return [Sticker.objects.create(album=album, number=str(i), name=f's{i}') for i in range(1, 5)]


def _setup_profile(user, *, lat, lng, album_id):
    p = user.profile
    p.lat_approx = Decimal(str(lat))
    p.lng_approx = Decimal(str(lng))
    p.browser_geo_optin = True
    p.active_album_id = album_id
    p.save()
    return p


@pytest.mark.django_db
def test_find_candidates_returns_empty_without_geo_optin(album):
    user = User.objects.create_user(email='c@x.com', password='pw')
    user.profile.active_album_id = album.id
    user.profile.save()
    assert find_candidates(user) == []


@pytest.mark.django_db
def test_find_candidates_filters_by_radius(album, stickers):
    me = User.objects.create_user(email='me@x.com', password='pw')
    near = User.objects.create_user(email='near@x.com', password='pw')
    far = User.objects.create_user(email='far@x.com', password='pw')

    _setup_profile(me, lat=4.7, lng=-74.0, album_id=album.id)
    _setup_profile(near, lat=4.71, lng=-74.01, album_id=album.id)
    _setup_profile(far, lat=6.24, lng=-75.58, album_id=album.id)  # Medellín

    UserSticker.objects.create(user=me, sticker=stickers[0], count=2)
    UserSticker.objects.create(user=near, sticker=stickers[0], count=0)
    UserSticker.objects.create(user=far, sticker=stickers[0], count=0)

    candidates = find_candidates(me, radius_km=10)
    user_ids = [c.user_id for c in candidates]
    assert near.id in user_ids
    assert far.id not in user_ids


@pytest.mark.django_db
def test_find_candidates_excludes_other_album(album, stickers):
    other_album = Album.objects.create(name='Champions', slug='ucl', edition_year=2026, total_stickers=5)
    me = User.objects.create_user(email='me@x.com', password='pw')
    them = User.objects.create_user(email='them@x.com', password='pw')

    _setup_profile(me, lat=4.7, lng=-74.0, album_id=album.id)
    _setup_profile(them, lat=4.71, lng=-74.0, album_id=other_album.id)

    UserSticker.objects.create(user=me, sticker=stickers[0], count=2)
    UserSticker.objects.create(user=them, sticker=stickers[0], count=0)

    assert find_candidates(me) == []


@pytest.mark.django_db
def test_find_candidates_ranks_by_match_count_then_distance(album, stickers):
    me = User.objects.create_user(email='me@x.com', password='pw')
    one = User.objects.create_user(email='one@x.com', password='pw')
    two = User.objects.create_user(email='two@x.com', password='pw')

    _setup_profile(me, lat=4.7, lng=-74.0, album_id=album.id)
    _setup_profile(one, lat=4.701, lng=-74.0, album_id=album.id)  # closer, 1 match
    _setup_profile(two, lat=4.71, lng=-74.0, album_id=album.id)   # farther, 2 matches

    UserSticker.objects.create(user=me, sticker=stickers[0], count=2)
    UserSticker.objects.create(user=me, sticker=stickers[1], count=2)

    UserSticker.objects.create(user=one, sticker=stickers[0], count=0)
    UserSticker.objects.create(user=two, sticker=stickers[0], count=0)
    UserSticker.objects.create(user=two, sticker=stickers[1], count=0)

    ranked = find_candidates(me, radius_km=20)
    assert ranked[0].user_id == two.id
    assert ranked[1].user_id == one.id
