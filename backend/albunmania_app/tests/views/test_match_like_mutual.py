"""POST /match/like/ — single + mutual."""
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from albunmania_app.models import Album, Match, Sticker, Trade


User = get_user_model()


@pytest.fixture
def album(db):
    return Album.objects.create(name='M26', slug='m26', edition_year=2026, total_stickers=10)


@pytest.fixture
def stickers(db, album):
    return [
        Sticker.objects.create(album=album, number='1', name='S1'),
        Sticker.objects.create(album=album, number='2', name='S2'),
    ]


@pytest.fixture
def two_users(db):
    a = User.objects.create_user(email='a@x.com', password='pw')
    b = User.objects.create_user(email='b@x.com', password='pw')
    return a, b


@pytest.mark.django_db
def test_first_like_returns_mutual_false(two_users, stickers):
    a, b = two_users
    s1, s2 = stickers
    client = APIClient()
    client.force_authenticate(user=a)
    res = client.post('/api/match/like/', {
        'to_user': b.id, 'sticker_offered': s1.id, 'sticker_wanted': s2.id,
    }, format='json')
    assert res.status_code == 201
    body = res.json()
    assert body['mutual'] is False
    assert 'like_id' in body


@pytest.mark.django_db
def test_mirror_like_creates_match_and_trade(two_users, stickers):
    a, b = two_users
    s1, s2 = stickers
    client = APIClient()
    client.force_authenticate(user=a)
    client.post('/api/match/like/', {
        'to_user': b.id, 'sticker_offered': s1.id, 'sticker_wanted': s2.id,
    }, format='json')

    client.force_authenticate(user=b)
    res = client.post('/api/match/like/', {
        'to_user': a.id, 'sticker_offered': s2.id, 'sticker_wanted': s1.id,
    }, format='json')

    assert res.status_code == 201
    body = res.json()
    assert body['mutual'] is True
    assert body['match_id']
    assert body['trade_id']

    match = Match.objects.get(id=body['match_id'])
    assert match.channel == Match.Channel.SWIPE
    assert match.user_a_id < match.user_b_id

    trade = Trade.objects.get(id=body['trade_id'])
    assert len(trade.items) == 2


@pytest.mark.django_db
def test_like_self_is_rejected(stickers):
    a = User.objects.create_user(email='solo@x.com', password='pw')
    s1, s2 = stickers
    client = APIClient()
    client.force_authenticate(user=a)
    res = client.post('/api/match/like/', {
        'to_user': a.id, 'sticker_offered': s1.id, 'sticker_wanted': s2.id,
    }, format='json')
    assert res.status_code == 400
