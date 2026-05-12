"""Collector stats — streak, completion %, weekly velocity, ETA, ranking.

These aggregates power the Stat Card on the dashboard. They are
computed on demand for V1 (a Huey nightly job is left for V2 once the
inventory volume justifies it). All numbers scope to the user's
`active_album_id`.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta

from django.contrib.auth import get_user_model
from django.db.models import Count, Max, Q

from albunmania_app.models import Album, Profile, UserSticker


User = get_user_model()


@dataclass
class CollectorStats:
    album_id: int | None
    total_stickers: int
    pasted_count: int          # count >= 1 (sticker is in the album)
    repeated_count: int        # count >= 2
    completion_pct: float      # pasted / total * 100
    weekly_velocity: int       # new pasted in the last 7 days
    streak_days: int           # consecutive days with at least one paste
    eta_days: int | None       # estimated days to finish (None if velocity = 0)


def _streak_days_for(user_id: int, album_id: int, today: date) -> int:
    """Count of consecutive days ending today with at least one new paste.

    A "paste day" is a day on which any UserSticker for this album moved
    from count=0 to count>=1. We approximate it by inspecting
    `updated_at` of rows with `count >= 1`. If a user pastes today, the
    streak includes today; if they last pasted yesterday but not today,
    the streak still counts yesterday backwards (no break yet).
    """
    paste_dates = list(
        UserSticker.objects.filter(
            user_id=user_id,
            sticker__album_id=album_id,
            count__gte=1,
        )
        .values_list('updated_at', flat=True)
        .order_by('-updated_at')[:1000]
    )
    if not paste_dates:
        return 0

    distinct_days: set[date] = {dt.date() for dt in paste_dates}
    streak = 0
    cursor = today
    while cursor in distinct_days:
        streak += 1
        cursor -= timedelta(days=1)
    if streak == 0:
        # Allow yesterday as the latest day before considering the streak broken.
        cursor = today - timedelta(days=1)
        while cursor in distinct_days:
            streak += 1
            cursor -= timedelta(days=1)
    return streak


def compute_stats(user, today: date | None = None) -> CollectorStats:
    today = today or date.today()
    profile: Profile | None = getattr(user, 'profile', None)
    album_id = profile.active_album_id if profile else None

    if not album_id:
        return CollectorStats(
            album_id=None, total_stickers=0, pasted_count=0, repeated_count=0,
            completion_pct=0.0, weekly_velocity=0, streak_days=0, eta_days=None,
        )

    album = Album.objects.filter(id=album_id).first()
    total = album.total_stickers if album else 0

    base = UserSticker.objects.filter(user_id=user.id, sticker__album_id=album_id)
    pasted = base.filter(count__gte=1).count()
    repeated = base.filter(count__gte=2).count()

    seven_days_ago = today - timedelta(days=7)
    weekly_velocity = base.filter(
        count__gte=1, updated_at__date__gte=seven_days_ago,
    ).count()

    completion_pct = (pasted / total * 100.0) if total else 0.0

    eta_days: int | None
    remaining = max(0, total - pasted)
    if weekly_velocity > 0 and remaining > 0:
        velocity_per_day = weekly_velocity / 7.0
        eta_days = int(round(remaining / velocity_per_day))
    elif remaining == 0:
        eta_days = 0
    else:
        eta_days = None

    streak = _streak_days_for(user.id, album_id, today)

    return CollectorStats(
        album_id=album_id,
        total_stickers=total,
        pasted_count=pasted,
        repeated_count=repeated,
        completion_pct=round(completion_pct, 2),
        weekly_velocity=weekly_velocity,
        streak_days=streak,
        eta_days=eta_days,
    )


def city_ranking(album_id: int, city: str, *, limit: int = 20) -> list[dict]:
    """Top collectors of `album_id` in `city`, ranked by pasted count desc.

    `city` is matched case-insensitively. Returns a list of
    `{user_id, email, city, pasted_count, is_online}`. Excludes users with
    zero pasted stickers in the album.
    """
    if not city.strip():
        return []

    qs = (
        UserSticker.objects.filter(
            sticker__album_id=album_id,
            count__gte=1,
            user__profile__city__iexact=city.strip(),
        )
        .values('user_id')
        .annotate(pasted_count=Count('id'))
        .order_by('-pasted_count')[:limit]
    )

    user_ids = [row['user_id'] for row in qs]
    users_by_id = {
        u.id: u for u in User.objects.filter(id__in=user_ids).select_related('profile')
    }

    return [
        {
            'user_id': row['user_id'],
            'email': users_by_id[row['user_id']].email,
            'city': users_by_id[row['user_id']].profile.city,
            'pasted_count': row['pasted_count'],
            'is_online': users_by_id[row['user_id']].profile.is_online,
        }
        for row in qs
        if row['user_id'] in users_by_id
    ]
