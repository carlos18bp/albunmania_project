"""stats_engine — collector aggregates."""
from datetime import date, timedelta

import pytest
from django.contrib.auth import get_user_model

from albunmania_app.models import Album, Sticker, UserSticker
from albunmania_app.services.stats_engine import city_ranking, compute_stats


User = get_user_model()


@pytest.fixture
def album(db):
    return Album.objects.create(name='M26', slug='m26', edition_year=2026, total_stickers=100)


@pytest.fixture
def stickers(db, album):
    return [Sticker.objects.create(album=album, number=str(i), name=f's{i}') for i in range(1, 21)]


def _set_active_album(user, album):
    user.profile.active_album_id = album.id
    user.profile.save()


@pytest.mark.django_db
def test_zero_stats_when_no_active_album(db):
    user = User.objects.create_user(email='solo@x.com', password='pw')
    stats = compute_stats(user)
    assert stats.album_id is None
    assert stats.completion_pct == 0.0
    assert stats.eta_days is None


@pytest.mark.django_db
def test_completion_pct_reflects_pasted_over_total(album, stickers):
    user = User.objects.create_user(email='c@x.com', password='pw')
    _set_active_album(user, album)
    for s in stickers[:10]:
        UserSticker.objects.create(user=user, sticker=s, count=1)

    stats = compute_stats(user)
    assert stats.pasted_count == 10
    assert stats.completion_pct == pytest.approx(10.0)


@pytest.mark.django_db
def test_eta_uses_weekly_velocity(album, stickers):
    user = User.objects.create_user(email='c@x.com', password='pw')
    _set_active_album(user, album)
    # 7 pasted in last 7 days → velocity 1/day → 90 remaining → eta 90 days
    for s in stickers[:7]:
        UserSticker.objects.create(user=user, sticker=s, count=1)

    stats = compute_stats(user, today=date.today())
    assert stats.weekly_velocity == 7
    assert stats.eta_days == 93  # 100 - 7 = 93 remaining at 1/day


@pytest.mark.django_db
def test_eta_none_when_no_velocity(album):
    user = User.objects.create_user(email='c@x.com', password='pw')
    _set_active_album(user, album)
    stats = compute_stats(user)
    assert stats.eta_days is None


@pytest.mark.django_db
def test_eta_zero_when_album_complete(album, stickers):
    # mark as small album to make completion realistic
    album.total_stickers = 5
    album.save()
    user = User.objects.create_user(email='c@x.com', password='pw')
    _set_active_album(user, album)
    for s in stickers[:5]:
        UserSticker.objects.create(user=user, sticker=s, count=1)

    stats = compute_stats(user)
    assert stats.eta_days == 0


@pytest.mark.django_db
def test_city_ranking_orders_by_pasted_count_desc(album, stickers):
    a = User.objects.create_user(email='a@x.com', password='pw')
    b = User.objects.create_user(email='b@x.com', password='pw')
    a.profile.city = 'Bogotá'
    a.profile.save()
    b.profile.city = 'Bogotá'
    b.profile.save()

    for s in stickers[:5]:
        UserSticker.objects.create(user=a, sticker=s, count=1)
    for s in stickers[:10]:
        UserSticker.objects.create(user=b, sticker=s, count=1)

    rank = city_ranking(album.id, 'Bogotá')
    assert [r['user_id'] for r in rank[:2]] == [b.id, a.id]


@pytest.mark.django_db
def test_city_ranking_filters_by_city_case_insensitive(album, stickers):
    a = User.objects.create_user(email='a@x.com', password='pw')
    b = User.objects.create_user(email='b@x.com', password='pw')
    a.profile.city = 'Bogotá'
    a.profile.save()
    b.profile.city = 'Medellín'
    b.profile.save()

    UserSticker.objects.create(user=a, sticker=stickers[0], count=1)
    UserSticker.objects.create(user=b, sticker=stickers[0], count=1)

    rank = city_ranking(album.id, 'bogotá')
    assert len(rank) == 1
    assert rank[0]['user_id'] == a.id


@pytest.mark.django_db
def test_city_ranking_returns_empty_for_blank_city(album):
    assert city_ranking(album.id, '') == []
