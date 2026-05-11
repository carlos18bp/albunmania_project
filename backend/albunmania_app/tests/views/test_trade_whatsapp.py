"""POST /trade/{id}/whatsapp-optin/ + GET /trade/{id}/whatsapp-link/."""
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from albunmania_app.models import Album, Match, Sticker, Trade


User = get_user_model()


@pytest.fixture
def trade_setup(db):
    a = User.objects.create_user(email='a@x.com', password='pw')
    b = User.objects.create_user(email='b@x.com', password='pw')
    b.profile.whatsapp_e164 = '+573001234567'
    b.profile.save()
    a.profile.whatsapp_e164 = '+573008888888'
    a.profile.save()
    album = Album.objects.create(name='M26', slug='m26', edition_year=2026, total_stickers=10)
    s1 = Sticker.objects.create(album=album, number='1', name='S1')
    s2 = Sticker.objects.create(album=album, number='2', name='S2')
    match = Match.objects.create(user_a=a, user_b=b, channel=Match.Channel.SWIPE)
    trade = Trade.objects.create(match=match, items=[
        {'from_user': a.id, 'to_user': b.id, 'sticker_id': s1.id},
        {'from_user': b.id, 'to_user': a.id, 'sticker_id': s2.id},
    ])
    return {'a': a, 'b': b, 'trade': trade}


@pytest.mark.django_db
def test_optin_records_caller_and_reports_both_status(trade_setup):
    client = APIClient()
    client.force_authenticate(user=trade_setup['a'])
    res = client.post(
        f"/api/trade/{trade_setup['trade'].id}/whatsapp-optin/",
        {'opted_in': True}, format='json',
    )
    assert res.status_code == 200
    body = res.json()
    assert body['opted_in'] is True
    assert body['both_opted_in'] is False


@pytest.mark.django_db
def test_link_blocked_when_only_one_side_opted_in(trade_setup):
    client = APIClient()
    client.force_authenticate(user=trade_setup['a'])
    client.post(f"/api/trade/{trade_setup['trade'].id}/whatsapp-optin/", {'opted_in': True}, format='json')
    res = client.get(f"/api/trade/{trade_setup['trade'].id}/whatsapp-link/")
    assert res.status_code == 403
    assert res.json()['error'] == 'both_must_opt_in'


@pytest.mark.django_db
def test_link_returned_when_both_opted_in(trade_setup):
    client = APIClient()
    client.force_authenticate(user=trade_setup['a'])
    client.post(f"/api/trade/{trade_setup['trade'].id}/whatsapp-optin/", {'opted_in': True}, format='json')
    client.force_authenticate(user=trade_setup['b'])
    client.post(f"/api/trade/{trade_setup['trade'].id}/whatsapp-optin/", {'opted_in': True}, format='json')

    client.force_authenticate(user=trade_setup['a'])
    res = client.get(f"/api/trade/{trade_setup['trade'].id}/whatsapp-link/")
    assert res.status_code == 200
    assert res.json()['wa_link'].startswith('https://wa.me/573001234567')


@pytest.mark.django_db
def test_outsider_cannot_optin(trade_setup):
    outsider = User.objects.create_user(email='outsider@x.com', password='pw')
    client = APIClient()
    client.force_authenticate(user=outsider)
    res = client.post(f"/api/trade/{trade_setup['trade'].id}/whatsapp-optin/", {'opted_in': True}, format='json')
    assert res.status_code == 403


@pytest.mark.django_db
def test_optin_can_be_revoked(trade_setup):
    client = APIClient()
    client.force_authenticate(user=trade_setup['a'])
    client.post(f"/api/trade/{trade_setup['trade'].id}/whatsapp-optin/", {'opted_in': True}, format='json')
    res = client.post(
        f"/api/trade/{trade_setup['trade'].id}/whatsapp-optin/",
        {'opted_in': False}, format='json',
    )
    assert res.json()['opted_in'] is False
