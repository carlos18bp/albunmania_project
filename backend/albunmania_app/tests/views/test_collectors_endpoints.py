"""Collector discovery endpoints — /collectors/map/ and /collectors/search/."""
from decimal import Decimal

import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from albunmania_app.models import Profile

User = get_user_model()


def _client(user):
    c = APIClient()
    c.force_authenticate(user=user)
    return c


def _collector(email, *, lat=None, lng=None, city='', album_id=None, online=False, first='', last=''):
    user = User.objects.create_user(email=email, password='pw', first_name=first, last_name=last)
    Profile.objects.filter(user=user).update(
        lat_approx=Decimal(str(lat)) if lat is not None else None,
        lng_approx=Decimal(str(lng)) if lng is not None else None,
        city=city,
        active_album_id=album_id,
        last_seen=timezone.now() if online else None,
    )
    return user


# ---------------------------------------------------------------- /collectors/map/

@pytest.mark.django_db
def test_map_requires_authentication():
    assert APIClient().get(reverse('collectors-map')).status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
def test_map_rejects_invalid_limit():
    me = _collector('me@example.com')
    res = _client(me).get(reverse('collectors-map'), {'limit': 'abc'})
    assert res.status_code == status.HTTP_400_BAD_REQUEST
    assert res.json()['error'] == 'invalid_limit'


@pytest.mark.django_db
def test_map_rejects_invalid_album_id():
    me = _collector('me@example.com')
    res = _client(me).get(reverse('collectors-map'), {'album_id': 'not-a-number'})
    assert res.status_code == status.HTTP_400_BAD_REQUEST
    assert res.json()['error'] == 'invalid_album_id'


@pytest.mark.django_db
def test_map_rejects_invalid_geo_params():
    me = _collector('me@example.com')
    _collector('other@example.com', lat=4.6, lng=-74.0)  # so the bbox/haversine path runs
    res = _client(me).get(reverse('collectors-map'), {'lat': 'x', 'lng': 'y', 'radius_km': 'z'})
    assert res.status_code == status.HTTP_400_BAD_REQUEST
    assert res.json()['error'] == 'invalid_geo_params'


@pytest.mark.django_db
def test_map_returns_collectors_with_a_location():
    me = _collector('me@example.com')
    with_loc = _collector('a@example.com', lat=4.65, lng=-74.07, city='Bogotá', online=True)
    _collector('noloc@example.com')  # no lat/lng → excluded

    body = _client(me).get(reverse('collectors-map')).json()

    ids = [e['user_id'] for e in body['results']]
    assert ids == [with_loc.id]
    assert body['results'][0]['is_online'] is True
    assert body['results'][0]['city'] == 'Bogotá'


@pytest.mark.django_db
def test_map_excludes_the_requesting_user():
    me = _collector('me@example.com', lat=4.6, lng=-74.0)

    body = _client(me).get(reverse('collectors-map')).json()

    assert body['results'] == []


@pytest.mark.django_db
def test_map_filters_by_radius():
    me = _collector('me@example.com')
    near = _collector('near@example.com', lat=4.66, lng=-74.06)
    _collector('far@example.com', lat=10.0, lng=-75.0)

    body = _client(me).get(reverse('collectors-map'), {'lat': 4.65, 'lng': -74.07, 'radius_km': 5}).json()

    assert [e['user_id'] for e in body['results']] == [near.id]


@pytest.mark.django_db
def test_map_filters_by_album():
    me = _collector('me@example.com')
    in_album = _collector('in@example.com', lat=4.6, lng=-74.0, album_id=42)
    _collector('out@example.com', lat=4.6, lng=-74.0, album_id=99)

    body = _client(me).get(reverse('collectors-map'), {'album_id': 42}).json()

    assert [e['user_id'] for e in body['results']] == [in_album.id]


# ---------------------------------------------------------------- /collectors/search/

@pytest.mark.django_db
def test_search_requires_authentication():
    assert APIClient().get(reverse('collectors-search')).status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
def test_search_returns_empty_for_short_query():
    me = _collector('me@example.com')
    assert _client(me).get(reverse('collectors-search'), {'q': 'a'}).json() == {'results': []}


@pytest.mark.django_db
def test_search_matches_name_and_excludes_self():
    me = _collector('me@example.com', first='Lucía', last='Yo')
    lucia = _collector('l@example.com', first='Lucía', last='Rojas')
    _collector('camilo@example.com', first='Camilo', last='Pérez')

    body = _client(me).get(reverse('collectors-search'), {'q': 'lucía'}).json()

    assert [r['user_id'] for r in body['results']] == [lucia.id]
    assert body['results'][0]['display_name'] == 'Lucía Rojas'


@pytest.mark.django_db
def test_search_matches_city():
    me = _collector('me@example.com')
    barranquilla = _collector('b@example.com', first='Ana', city='Barranquilla')

    body = _client(me).get(reverse('collectors-search'), {'q': 'barran'}).json()

    assert [r['user_id'] for r in body['results']] == [barranquilla.id]
