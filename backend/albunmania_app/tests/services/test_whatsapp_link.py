"""whatsapp_link service — wa.me URL construction."""
from urllib.parse import parse_qs, urlparse

import pytest
from django.contrib.auth import get_user_model

from albunmania_app.models import Album, Match, Sticker, Trade
from albunmania_app.services.whatsapp_link import build_whatsapp_link


User = get_user_model()


@pytest.fixture
def setup(db):
    a = User.objects.create_user(email='a@x.com', password='pw')
    b = User.objects.create_user(email='b@x.com', password='pw')
    b.profile.whatsapp_e164 = '+573001234567'
    b.profile.save()
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
def test_link_uses_peer_phone_only_digits(setup):
    link = build_whatsapp_link(setup['trade'], viewer_id=setup['a'].id)
    assert link is not None
    parsed = urlparse(link)
    assert parsed.netloc == 'wa.me'
    assert parsed.path == '/573001234567'  # digits only, no +


@pytest.mark.django_db
def test_link_message_is_viewer_centric(setup):
    link = build_whatsapp_link(setup['trade'], viewer_id=setup['a'].id)
    text = parse_qs(urlparse(link).query)['text'][0]
    assert 'Yo te doy: #1' in text
    assert 'Yo busco: #2' in text


@pytest.mark.django_db
def test_returns_none_when_peer_has_no_whatsapp(setup):
    setup['b'].profile.whatsapp_e164 = ''
    setup['b'].profile.save()
    assert build_whatsapp_link(setup['trade'], viewer_id=setup['a'].id) is None


@pytest.mark.django_db
def test_returns_none_when_viewer_not_participant(setup):
    other = User.objects.create_user(email='outsider@x.com', password='pw')
    assert build_whatsapp_link(setup['trade'], viewer_id=other.id) is None
