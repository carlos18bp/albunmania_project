"""QR flow — /match/qr/{me,scan,confirm}/."""
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from albunmania_app.models import Album, Match, Sticker, UserSticker


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


@pytest.mark.django_db
def test_qr_me_returns_token_and_expiry():
    user = User.objects.create_user(email='u@x.com', password='pw')
    client = APIClient()
    client.force_authenticate(user=user)
    res = client.get('/api/match/qr/me/')
    assert res.status_code == 200
    body = res.json()
    assert body['token']
    assert body['expires_at'] > 0


@pytest.mark.django_db
def test_qr_scan_returns_user_id_for_valid_token():
    issuer = User.objects.create_user(email='issuer@x.com', password='pw')
    scanner = User.objects.create_user(email='scanner@x.com', password='pw')

    client = APIClient()
    client.force_authenticate(user=issuer)
    token = client.get('/api/match/qr/me/').json()['token']

    client.force_authenticate(user=scanner)
    res = client.post('/api/match/qr/scan/', {'token': token}, format='json')
    assert res.status_code == 200
    assert res.json()['user_id'] == issuer.id


@pytest.mark.django_db
def test_qr_scan_rejects_self_scan():
    user = User.objects.create_user(email='u@x.com', password='pw')
    client = APIClient()
    client.force_authenticate(user=user)
    token = client.get('/api/match/qr/me/').json()['token']
    res = client.post('/api/match/qr/scan/', {'token': token}, format='json')
    assert res.status_code == 400


@pytest.mark.django_db
def test_qr_scan_rejects_garbage_token():
    user = User.objects.create_user(email='u@x.com', password='pw')
    client = APIClient()
    client.force_authenticate(user=user)
    res = client.post('/api/match/qr/scan/', {'token': 'garbage'}, format='json')
    assert res.status_code == 400


@pytest.mark.django_db
def test_qr_confirm_creates_qr_presencial_match(stickers):
    a = User.objects.create_user(email='a@x.com', password='pw')
    b = User.objects.create_user(email='b@x.com', password='pw')
    s1, s2 = stickers

    UserSticker.objects.create(user=a, sticker=s1, count=2)
    UserSticker.objects.create(user=a, sticker=s2, count=0)
    UserSticker.objects.create(user=b, sticker=s1, count=0)
    UserSticker.objects.create(user=b, sticker=s2, count=2)

    client = APIClient()
    client.force_authenticate(user=a)
    res = client.post('/api/match/qr/confirm/', {
        'other_user': b.id,
        'items': [
            {'from_user': a.id, 'to_user': b.id, 'sticker_id': s1.id},
            {'from_user': b.id, 'to_user': a.id, 'sticker_id': s2.id},
        ],
    }, format='json')
    assert res.status_code == 201
    match = Match.objects.get(id=res.json()['match_id'])
    assert match.channel == Match.Channel.QR_PRESENCIAL


@pytest.mark.django_db
def test_qr_confirm_rejects_invalid_item(stickers):
    a = User.objects.create_user(email='a@x.com', password='pw')
    b = User.objects.create_user(email='b@x.com', password='pw')
    s1, _ = stickers
    # a does not own s1 → invalid
    client = APIClient()
    client.force_authenticate(user=a)
    res = client.post('/api/match/qr/confirm/', {
        'other_user': b.id,
        'items': [{'from_user': a.id, 'to_user': b.id, 'sticker_id': s1.id}],
    }, format='json')
    assert res.status_code == 400
