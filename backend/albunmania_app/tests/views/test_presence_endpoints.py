"""Presence endpoints — heartbeat ping + active-collectors count + is_online surfacing."""
from datetime import timedelta

import pytest
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from albunmania_app.models import Profile

User = get_user_model()


@pytest.fixture(autouse=True)
def _clear_presence_cache():
    cache.clear()
    yield
    cache.clear()


def _client(user):
    c = APIClient()
    c.force_authenticate(user=user)
    return c


@pytest.mark.django_db
def test_ping_requires_authentication():
    assert APIClient().post(reverse('presence-ping')).status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
def test_ping_sets_last_seen():
    user = User.objects.create_user(email='a@example.com', password='pw')
    assert user.profile.last_seen is None

    res = _client(user).post(reverse('presence-ping'))

    assert res.status_code == status.HTTP_200_OK
    assert res.json() == {'ok': True}
    user.profile.refresh_from_db()
    assert user.profile.last_seen is not None


@pytest.mark.django_db
def test_ping_is_throttled_per_user():
    user = User.objects.create_user(email='b@example.com', password='pw')
    client = _client(user)

    client.post(reverse('presence-ping'))
    user.profile.refresh_from_db()
    first = user.profile.last_seen
    # Backdate last_seen; a second ping within the throttle window must NOT update it.
    Profile.objects.filter(user=user).update(last_seen=timezone.now() - timedelta(hours=1))

    client.post(reverse('presence-ping'))

    user.profile.refresh_from_db()
    assert user.profile.last_seen < first


@pytest.mark.django_db
def test_active_count_counts_only_recently_seen_collectors():
    online = User.objects.create_user(email='on@example.com', password='pw')
    Profile.objects.filter(user=online).update(last_seen=timezone.now())
    stale = User.objects.create_user(email='stale@example.com', password='pw')
    Profile.objects.filter(user=stale).update(last_seen=timezone.now() - timedelta(hours=2))
    User.objects.create_user(email='never@example.com', password='pw')  # last_seen=None

    res = APIClient().get(reverse('presence-active-count'))

    assert res.status_code == status.HTTP_200_OK
    assert res.json()['count'] == 1


@pytest.mark.django_db
def test_active_count_can_be_scoped_by_city():
    bogota = User.objects.create_user(email='bog@example.com', password='pw')
    Profile.objects.filter(user=bogota).update(last_seen=timezone.now(), city='Bogotá')
    medellin = User.objects.create_user(email='med@example.com', password='pw')
    Profile.objects.filter(user=medellin).update(last_seen=timezone.now(), city='Medellín')

    body = APIClient().get(reverse('presence-active-count'), {'city': 'bogotá'}).json()

    assert body == {'count': 1, 'city': 'bogotá'}


@pytest.mark.django_db
def test_public_profile_exposes_is_online():
    user = User.objects.create_user(email='c@example.com', password='pw')
    Profile.objects.filter(user=user).update(last_seen=timezone.now())

    body = APIClient().get(reverse('user-public-profile', args=[user.id])).json()

    assert body['is_online'] is True


@pytest.mark.django_db
def test_public_profile_is_online_false_when_never_seen():
    user = User.objects.create_user(email='d@example.com', password='pw')

    body = APIClient().get(reverse('user-public-profile', args=[user.id])).json()

    assert body['is_online'] is False
