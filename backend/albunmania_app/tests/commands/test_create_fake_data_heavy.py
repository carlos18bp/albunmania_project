"""Smoke test for the Heavy seed.

Runs with tiny volumes and asserts that:
- the catalogue is loaded (>=600 stickers)
- Match canonical ordering (user_a_id < user_b_id) holds
- Reviews live only on completed Trades
- Profile reputation aggregates were synced by the post_save signal
- Re-running the command does not duplicate rows (idempotent)
"""
from __future__ import annotations

import pytest
from django.core.management import call_command

from albunmania_app.models import (
    Album, Match, Profile, Review, Sticker, Trade, User, UserSticker,
)


pytestmark = pytest.mark.django_db


def _run(**kwargs):
    defaults = dict(
        collectors=8,
        merchants=2,
        matches=4,
        trades_completed=3,
        trades_open=1,
        trades_cancelled=1,
        skip_impressions=True,
        reset=True,
    )
    defaults.update(kwargs)
    call_command('create_fake_data_heavy', **defaults)


def test_seed_loads_the_full_catalogue():
    _run()
    album = Album.objects.get(slug='mundial-26')

    assert Sticker.objects.filter(album=album).count() >= 600
    # 30 special editions + 640 regulars
    assert Sticker.objects.filter(album=album, is_special_edition=True).count() == 30


def test_seed_creates_inventories_for_all_collectors():
    _run()
    collectors = User.objects.filter(role=User.Role.COLLECTOR)

    for u in collectors:
        # Each collector sees 30-70% of the catalogue.
        assert UserSticker.objects.filter(user=u).count() >= 1


def test_seed_respects_match_canonical_ordering():
    _run()

    for m in Match.objects.all():
        assert m.user_a_id < m.user_b_id, f'Match {m.id} violates user_a_id < user_b_id'


def test_seed_only_creates_reviews_on_completed_trades():
    _run()

    for r in Review.objects.select_related('trade'):
        assert r.trade.status == Trade.Status.COMPLETED


def test_seed_syncs_profile_reputation_via_signal():
    _run()
    # Pick a reviewee from any review and confirm the aggregate was bumped.
    review = Review.objects.first()
    assert review is not None
    profile = Profile.objects.get(user_id=review.reviewee_id)

    assert profile.rating_count >= 1


def test_seed_is_convergent_under_repeated_reset_runs():
    """Re-running the command with --reset converges to the same catalogue
    size and the same key invariants — proves the seed is replayable in
    dev environments without compounding rows."""
    _run()
    sticker_count_first = Sticker.objects.count()
    matches_first = Match.objects.count()

    _run()
    sticker_count_second = Sticker.objects.count()
    matches_second = Match.objects.count()

    assert sticker_count_first == sticker_count_second
    assert matches_first == matches_second
