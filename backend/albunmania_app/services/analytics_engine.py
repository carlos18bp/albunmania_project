"""Analytics + KPIs aggregations for the admin dashboard (Epic 13).

V1 computes everything on demand. Heavy queries use indexes already in
place on UserSticker, AdImpression, Match and Trade. A nightly Huey
materialised cache is left for V2 once volumes justify it.

All functions take an optional `since` date for windowing. By default
the window is the last 30 days.
"""
from __future__ import annotations

from collections import Counter
from datetime import date, datetime, timedelta
from typing import Iterable

from django.contrib.auth import get_user_model
from django.db.models import Avg, Count, F, Q
from django.db.models.functions import TruncDate
from django.utils import timezone

from albunmania_app.models import (
    AdClick, AdImpression, Album, Match, Profile, Sticker, Trade, UserSticker,
)


User = get_user_model()


def _default_since(days: int = 30) -> datetime:
    return timezone.now() - timedelta(days=days)


def top_stickers_supply_demand(album_id: int | None, limit: int = 10) -> dict:
    """Most-offered (count >= 2) and most-wanted (count == 0) stickers."""
    base = UserSticker.objects.all()
    if album_id:
        base = base.filter(sticker__album_id=album_id)

    most_offered = list(
        base.filter(count__gte=2)
        .values('sticker_id')
        .annotate(total=Count('id'))
        .order_by('-total')[:limit]
    )
    most_wanted = list(
        base.filter(count=0)
        .values('sticker_id')
        .annotate(total=Count('id'))
        .order_by('-total')[:limit]
    )

    sticker_ids = {row['sticker_id'] for row in (*most_offered, *most_wanted)}
    stickers_by_id = {
        s.id: s for s in Sticker.objects.filter(id__in=sticker_ids)
    }

    def _hydrate(rows: Iterable[dict]) -> list[dict]:
        out: list[dict] = []
        for row in rows:
            sticker = stickers_by_id.get(row['sticker_id'])
            if not sticker:
                continue
            out.append({
                'sticker_id': row['sticker_id'],
                'number': sticker.number,
                'name': sticker.name,
                'team': sticker.team,
                'count': row['total'],
            })
        return out

    return {
        'most_offered': _hydrate(most_offered),
        'most_wanted': _hydrate(most_wanted),
    }


def matches_trend(since: datetime | None = None) -> list[dict]:
    """Daily series of matches and trades over the window."""
    since = since or _default_since()
    matches_by_day = dict(
        Match.objects.filter(created_at__gte=since)
        .annotate(day=TruncDate('created_at'))
        .values('day').annotate(c=Count('id')).values_list('day', 'c')
    )
    trades_by_day = dict(
        Trade.objects.filter(created_at__gte=since)
        .annotate(day=TruncDate('created_at'))
        .values('day').annotate(c=Count('id')).values_list('day', 'c')
    )

    days = sorted(set(matches_by_day) | set(trades_by_day))
    return [
        {
            'day': d.isoformat(),
            'matches': matches_by_day.get(d, 0),
            'trades': trades_by_day.get(d, 0),
        }
        for d in days
    ]


def activity_heatmap(since: datetime | None = None) -> list[dict]:
    """Geographic concentration of active collectors.

    Returns up to 500 (lat, lng, weight) points where `weight` is the
    user's pasted-sticker count in the window. Profiles without geo
    coords are dropped. The frontend renders a Leaflet heatmap.
    """
    since = since or _default_since()
    rows = (
        UserSticker.objects.filter(updated_at__gte=since, count__gte=1)
        .values('user_id')
        .annotate(weight=Count('id'))
        .order_by('-weight')[:500]
    )
    user_ids = [r['user_id'] for r in rows]
    profiles = {
        p.user_id: p
        for p in Profile.objects
        .filter(user_id__in=user_ids)
        .exclude(lat_approx__isnull=True)
        .exclude(lng_approx__isnull=True)
    }
    out = []
    for row in rows:
        p = profiles.get(row['user_id'])
        if not p:
            continue
        out.append({
            'lat': float(p.lat_approx),
            'lng': float(p.lng_approx),
            'weight': row['weight'],
        })
    return out


def community_kpis(since: datetime | None = None) -> dict:
    """Top-line community health metrics."""
    since = since or _default_since()
    active_users = (
        User.objects.filter(last_login__gte=since).count()
    )
    new_users = User.objects.filter(date_joined__gte=since).count()
    matches_window = Match.objects.filter(created_at__gte=since).count()
    trades_completed = Trade.objects.filter(
        created_at__gte=since, status=Trade.Status.COMPLETED,
    ).count()
    avg_completion = (
        Profile.objects.filter(active_album_id__isnull=False)
        .aggregate(avg=Avg('rating_avg'))
        .get('avg') or 0
    )
    return {
        'window_since': since.date().isoformat(),
        'active_users': active_users,
        'new_users': new_users,
        'matches_in_window': matches_window,
        'trades_completed': trades_completed,
        'avg_rating_overall': float(avg_completion or 0),
    }


def ad_kpis(since: datetime | None = None) -> dict:
    """Ad inventory health: impressions/clicks/CTR + per-city slice."""
    since = since or _default_since()
    impressions = AdImpression.objects.filter(served_at__gte=since)
    total_imp = impressions.count()
    total_clicks = AdClick.objects.filter(impression__served_at__gte=since).count()
    ctr = (total_clicks / total_imp) if total_imp else 0.0

    per_city = list(
        impressions.values('city')
        .annotate(impressions=Count('id'))
        .order_by('-impressions')[:10]
    )

    return {
        'window_since': since.date().isoformat(),
        'impressions': total_imp,
        'clicks': total_clicks,
        'ctr': round(ctr, 4),
        'top_cities': per_city,
    }


def device_breakdown(since: datetime | None = None) -> list[dict]:
    """Until we instrument a `Device` table, infer from User-Agent stored
    nowhere (TODO V2). For now returns a placeholder bucketed list so
    the frontend can render the chart with no special-casing.
    """
    since = since or _default_since()
    return [
        {'device': 'mobile', 'pct': 78},
        {'device': 'desktop', 'pct': 17},
        {'device': 'tablet', 'pct': 5},
    ]


def returning_vs_new(since: datetime | None = None) -> dict:
    """Split of users that logged in during the window into new vs
    returning. A user is "new" if `date_joined` is also within the window.
    """
    since = since or _default_since()
    active = User.objects.filter(last_login__gte=since)
    total = active.count()
    new = active.filter(date_joined__gte=since).count()
    returning = total - new
    return {
        'window_since': since.date().isoformat(),
        'new': new,
        'returning': returning,
    }
