"""GET /stats/me/ + GET /stats/ranking/."""
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from albunmania_app.models import Album, Sticker, UserSticker


User = get_user_model()


@pytest.fixture
def user_with_album(db):
    album = Album.objects.create(name='M26', slug='m26', edition_year=2026, total_stickers=50)
    user = User.objects.create_user(email='c@x.com', password='pw')
    user.profile.active_album_id = album.id
    user.profile.city = 'Cali'
    user.profile.save()
    s1 = Sticker.objects.create(album=album, number='1', name='S1')
    UserSticker.objects.create(user=user, sticker=s1, count=1)
    return {'user': user, 'album': album}


@pytest.mark.django_db
def test_stats_me_returns_aggregates(user_with_album):
    client = APIClient()
    client.force_authenticate(user=user_with_album['user'])
    res = client.get('/api/stats/me/')
    assert res.status_code == 200
    body = res.json()
    assert body['pasted_count'] == 1
    assert body['total_stickers'] == 50
    assert body['album_id'] == user_with_album['album'].id


@pytest.mark.django_db
def test_stats_me_requires_authentication():
    client = APIClient()
    res = client.get('/api/stats/me/')
    assert res.status_code in (401, 403)


@pytest.mark.django_db
def test_stats_ranking_returns_results_for_city(user_with_album):
    client = APIClient()
    client.force_authenticate(user=user_with_album['user'])
    res = client.get(
        f"/api/stats/ranking/?album_id={user_with_album['album'].id}&city=Cali"
    )
    assert res.status_code == 200
    body = res.json()
    assert len(body['results']) == 1
    assert body['results'][0]['user_id'] == user_with_album['user'].id


@pytest.mark.django_db
def test_stats_ranking_validates_required_params(user_with_album):
    client = APIClient()
    client.force_authenticate(user=user_with_album['user'])
    res = client.get('/api/stats/ranking/')
    assert res.status_code == 400
