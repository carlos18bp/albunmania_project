"""Sponsor model tests — single-active resolution."""
from datetime import timedelta

import pytest
from django.utils import timezone

from albunmania_app.models import Sponsor


def _make_sponsor(name: str, days_from: int, days_until: int) -> Sponsor:
    now = timezone.now()
    return Sponsor.objects.create(
        brand_name=name,
        logo_url='https://example.com/logo.png',
        primary_color='#000000',
        secondary_color='#ffffff',
        active_from=now + timedelta(days=days_from),
        active_until=now + timedelta(days=days_until),
    )


@pytest.mark.django_db
def test_active_returns_none_when_no_sponsors():
    assert Sponsor.active() is None


@pytest.mark.django_db
def test_active_returns_currently_running_sponsor():
    s = _make_sponsor('Coca-Cola', days_from=-10, days_until=20)

    assert Sponsor.active() == s


@pytest.mark.django_db
def test_active_skips_expired_sponsor():
    _make_sponsor('Old', days_from=-100, days_until=-1)

    assert Sponsor.active() is None


@pytest.mark.django_db
def test_active_skips_future_sponsor():
    _make_sponsor('Future', days_from=10, days_until=20)

    assert Sponsor.active() is None


@pytest.mark.django_db
def test_active_picks_most_recently_started_on_overlap():
    older = _make_sponsor('Older', days_from=-30, days_until=30)
    newer = _make_sponsor('Newer', days_from=-1, days_until=10)

    chosen = Sponsor.active()
    assert chosen == newer
    assert chosen != older


@pytest.mark.django_db
def test_is_currently_active_property_matches_window():
    s = _make_sponsor('Now', days_from=-1, days_until=1)
    expired = _make_sponsor('Expired', days_from=-30, days_until=-2)

    assert s.is_currently_active is True
    assert expired.is_currently_active is False
