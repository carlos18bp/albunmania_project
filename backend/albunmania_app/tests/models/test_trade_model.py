"""Trade model — items shape + status workflow."""
import pytest
from django.contrib.auth import get_user_model

from albunmania_app.models import Match, Trade


User = get_user_model()


@pytest.fixture
def match(db):
    a = User.objects.create_user(email='a@x.com', password='pw')
    b = User.objects.create_user(email='b@x.com', password='pw')
    return Match.objects.create(user_a=a, user_b=b, channel=Match.Channel.SWIPE)


@pytest.mark.django_db
def test_trade_default_status_is_open(match):
    trade = Trade.objects.create(match=match, items=[])
    assert trade.status == Trade.Status.OPEN


@pytest.mark.django_db
def test_trade_persists_items_json(match):
    items = [{'from_user': 1, 'to_user': 2, 'sticker_id': 42}]
    trade = Trade.objects.create(match=match, items=items)
    trade.refresh_from_db()
    assert trade.items == items


@pytest.mark.django_db
def test_trade_participants_property_reads_match_pair(match):
    trade = Trade.objects.create(match=match, items=[])
    assert trade.participant_ids == (match.user_a_id, match.user_b_id)
