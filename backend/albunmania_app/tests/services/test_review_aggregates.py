"""review_aggregates.recompute_for + signal-driven updates."""
from decimal import Decimal

import pytest
from django.contrib.auth import get_user_model

from albunmania_app.models import Album, Match, Review, Sticker, Trade


User = get_user_model()


def _make_trade(reviewer, reviewee):
    album = Album.objects.create(
        name=f'M-{reviewer.id}-{reviewee.id}',
        slug=f'm-{reviewer.id}-{reviewee.id}',
        edition_year=2026, total_stickers=10,
    )
    s1 = Sticker.objects.create(album=album, number='1', name='S1')
    a, b = (reviewer, reviewee) if reviewer.id < reviewee.id else (reviewee, reviewer)
    match = Match.objects.create(user_a=a, user_b=b, channel=Match.Channel.SWIPE)
    return Trade.objects.create(match=match, items=[
        {'from_user': reviewer.id, 'to_user': reviewee.id, 'sticker_id': s1.id},
    ])


@pytest.mark.django_db
def test_first_review_updates_profile_aggregates():
    a = User.objects.create_user(email='a@x.com', password='pw')
    b = User.objects.create_user(email='b@x.com', password='pw')
    Review.objects.create(trade=_make_trade(a, b), reviewer=a, reviewee=b, stars=5)

    b.profile.refresh_from_db()
    assert b.profile.rating_count == 1
    assert b.profile.rating_avg == Decimal('5.00')
    assert b.profile.positive_pct == Decimal('100.00')


@pytest.mark.django_db
def test_hidden_review_excluded_from_aggregates():
    a = User.objects.create_user(email='a@x.com', password='pw')
    b = User.objects.create_user(email='b@x.com', password='pw')
    review = Review.objects.create(trade=_make_trade(a, b), reviewer=a, reviewee=b, stars=5)
    review.is_visible = False
    review.save()

    b.profile.refresh_from_db()
    assert b.profile.rating_count == 0
    assert b.profile.rating_avg == Decimal('0.00')


@pytest.mark.django_db
def test_positive_pct_counts_reviews_with_4_or_5_stars():
    a = User.objects.create_user(email='a@x.com', password='pw')
    b = User.objects.create_user(email='b@x.com', password='pw')
    c = User.objects.create_user(email='c@x.com', password='pw')

    Review.objects.create(trade=_make_trade(a, c), reviewer=a, reviewee=c, stars=5)
    Review.objects.create(trade=_make_trade(b, c), reviewer=b, reviewee=c, stars=2)

    c.profile.refresh_from_db()
    assert c.profile.rating_count == 2
    assert c.profile.positive_pct == Decimal('50.00')
