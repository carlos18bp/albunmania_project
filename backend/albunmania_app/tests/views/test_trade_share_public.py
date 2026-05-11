"""GET /trade/share/<token>/ — public list rendering."""
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from albunmania_app.models import Album, Sticker, UserSticker
from albunmania_app.services.qr_token import sign_user_token


User = get_user_model()


@pytest.fixture
def setup_user(db):
    album = Album.objects.create(name='M26', slug='m26', edition_year=2026, total_stickers=10)
    user = User.objects.create_user(email='c@x.com', password='pw')
    user.profile.active_album_id = album.id
    user.profile.save()
    s1 = Sticker.objects.create(album=album, number='1', name='S1')
    s2 = Sticker.objects.create(album=album, number='2', name='S2')
    UserSticker.objects.create(user=user, sticker=s1, count=3)  # available
    UserSticker.objects.create(user=user, sticker=s2, count=0)  # wanted
    return user


@pytest.mark.django_db
def test_share_lists_available_without_auth(setup_user):
    user = setup_user
    token, _ = sign_user_token(user.id)
    client = APIClient()
    res = client.get(f'/api/trade/share/{token}/?kind=available')
    assert res.status_code == 200
    body = res.json()
    assert body['kind'] == 'available'
    assert body['count'] == 1


@pytest.mark.django_db
def test_share_lists_wanted_without_auth(setup_user):
    user = setup_user
    token, _ = sign_user_token(user.id)
    client = APIClient()
    res = client.get(f'/api/trade/share/{token}/?kind=wanted')
    assert res.status_code == 200
    body = res.json()
    assert body['kind'] == 'wanted'
    assert body['count'] == 1


@pytest.mark.django_db
def test_share_rejects_invalid_token():
    client = APIClient()
    res = client.get('/api/trade/share/garbage/')
    assert res.status_code == 400


@pytest.mark.django_db
def test_share_rejects_invalid_kind(setup_user):
    user = setup_user
    token, _ = sign_user_token(user.id)
    client = APIClient()
    res = client.get(f'/api/trade/share/{token}/?kind=other')
    assert res.status_code == 400
