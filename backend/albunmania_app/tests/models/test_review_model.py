"""Review model — uniqueness, stars constraint, edit window."""
from datetime import timedelta

import pytest
from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.utils import timezone

from albunmania_app.models import Album, Match, Review, Sticker, Trade


User = get_user_model()


@pytest.fixture
def trade(db):
    a = User.objects.create_user(email='a@x.com', password='pw')
    b = User.objects.create_user(email='b@x.com', password='pw')
    album = Album.objects.create(name='M26', slug='m26', edition_year=2026, total_stickers=10)
    s1 = Sticker.objects.create(album=album, number='1', name='S1')
    match = Match.objects.create(user_a=a, user_b=b, channel=Match.Channel.SWIPE)
    trade = Trade.objects.create(match=match, items=[
        {'from_user': a.id, 'to_user': b.id, 'sticker_id': s1.id},
    ])
    return {'a': a, 'b': b, 'trade': trade}


@pytest.mark.django_db
def test_review_unique_per_trade_reviewer(trade):
    Review.objects.create(trade=trade['trade'], reviewer=trade['a'], reviewee=trade['b'], stars=5)
    with transaction.atomic(), pytest.raises(IntegrityError):
        Review.objects.create(trade=trade['trade'], reviewer=trade['a'], reviewee=trade['b'], stars=4)


@pytest.mark.django_db
def test_review_rejects_stars_out_of_range(trade):
    with transaction.atomic(), pytest.raises(IntegrityError):
        Review.objects.create(trade=trade['trade'], reviewer=trade['a'], reviewee=trade['b'], stars=0)


@pytest.mark.django_db
def test_is_editable_within_window(trade):
    r = Review.objects.create(trade=trade['trade'], reviewer=trade['a'], reviewee=trade['b'], stars=5)
    assert r.is_editable is True


@pytest.mark.django_db
def test_is_editable_after_window(trade):
    r = Review.objects.create(trade=trade['trade'], reviewer=trade['a'], reviewee=trade['b'], stars=5)
    Review.objects.filter(pk=r.pk).update(created_at=timezone.now() - timedelta(hours=25))
    r.refresh_from_db()
    assert r.is_editable is False
