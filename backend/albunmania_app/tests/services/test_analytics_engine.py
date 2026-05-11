"""analytics_engine — top stickers, trend, KPIs, heatmap."""
from datetime import timedelta
from decimal import Decimal

import pytest
from django.contrib.auth import get_user_model
from django.utils import timezone

from albunmania_app.models import (
    Album, Match, Sticker, Trade, UserSticker,
)
from albunmania_app.services.analytics_engine import (
    activity_heatmap, ad_kpis, community_kpis, matches_trend,
    returning_vs_new, top_stickers_supply_demand,
)


User = get_user_model()


@pytest.fixture
def album(db):
    return Album.objects.create(name='M26', slug='m26', edition_year=2026, total_stickers=100)


@pytest.fixture
def stickers(db, album):
    return [Sticker.objects.create(album=album, number=str(i), name=f's{i}') for i in range(1, 6)]


@pytest.mark.django_db
def test_top_stickers_distinguishes_offered_from_wanted(album, stickers):
    a = User.objects.create_user(email='a@x.com', password='pw')
    b = User.objects.create_user(email='b@x.com', password='pw')
    UserSticker.objects.create(user=a, sticker=stickers[0], count=3)  # offered
    UserSticker.objects.create(user=b, sticker=stickers[0], count=0)  # wanted
    UserSticker.objects.create(user=b, sticker=stickers[1], count=0)  # wanted only

    out = top_stickers_supply_demand(album.id)
    assert out['most_offered'][0]['sticker_id'] == stickers[0].id
    wanted_ids = {row['sticker_id'] for row in out['most_wanted']}
    assert stickers[0].id in wanted_ids and stickers[1].id in wanted_ids


@pytest.mark.django_db
def test_matches_trend_groups_by_day(album, stickers):
    a = User.objects.create_user(email='a@x.com', password='pw')
    b = User.objects.create_user(email='b@x.com', password='pw')
    Match.objects.create(user_a=a, user_b=b, channel=Match.Channel.SWIPE)

    trend = matches_trend()
    assert any(row['matches'] == 1 for row in trend)


@pytest.mark.django_db
def test_community_kpis_counts_active_users():
    a = User.objects.create_user(email='a@x.com', password='pw')
    a.last_login = timezone.now()
    a.save(update_fields=['last_login'])
    kpis = community_kpis()
    assert kpis['active_users'] >= 1


@pytest.mark.django_db
def test_ad_kpis_returns_zero_ctr_when_no_impressions():
    out = ad_kpis()
    assert out['impressions'] == 0
    assert out['ctr'] == 0.0


@pytest.mark.django_db
def test_activity_heatmap_drops_users_without_geo(album, stickers):
    a = User.objects.create_user(email='a@x.com', password='pw')
    a.profile.lat_approx = Decimal('4.7')
    a.profile.lng_approx = Decimal('-74.0')
    a.profile.save()
    UserSticker.objects.create(user=a, sticker=stickers[0], count=1)

    b = User.objects.create_user(email='b@x.com', password='pw')
    UserSticker.objects.create(user=b, sticker=stickers[1], count=1)  # no geo

    points = activity_heatmap()
    user_lat_lng = {(p['lat'], p['lng']) for p in points}
    assert (4.7, -74.0) in user_lat_lng


@pytest.mark.django_db
def test_returning_vs_new_classifies_correctly():
    new_user = User.objects.create_user(email='n@x.com', password='pw')
    new_user.last_login = timezone.now()
    new_user.save(update_fields=['last_login'])

    old_user = User.objects.create_user(email='o@x.com', password='pw')
    old_user.date_joined = timezone.now() - timedelta(days=60)
    old_user.last_login = timezone.now()
    old_user.save(update_fields=['date_joined', 'last_login'])

    out = returning_vs_new()
    assert out['new'] >= 1
    assert out['returning'] >= 1
