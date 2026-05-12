"""Lightweight presence tracking — drives the "en línea ahora" Live Badge.

No WebSocket / SSE: a collector is "online" if their `Profile.last_seen`
is within `ONLINE_WINDOW`. `touch()` is called on authenticated activity
(token validation, profile fetch, an explicit `/presence/ping/` interval on
the client) and is throttled with the cache so we write to the DB at most
once per `TOUCH_THROTTLE_SECONDS` per user.
"""
from datetime import timedelta

from django.core.cache import cache
from django.utils import timezone

ONLINE_WINDOW = timedelta(minutes=5)
TOUCH_THROTTLE_SECONDS = 60


def touch(user) -> None:
    """Mark the user as active now (throttled). No-op for anonymous users."""
    user_id = getattr(user, 'id', None)
    if not user_id or not getattr(user, 'is_authenticated', False):
        return
    if not cache.add(f'presence:touch:{user_id}', 1, TOUCH_THROTTLE_SECONDS):
        return
    # Avoid importing the model at module load (apps not ready yet).
    from albunmania_app.models import Profile
    Profile.objects.filter(user_id=user_id).update(last_seen=timezone.now())


def is_online(last_seen) -> bool:
    """True if `last_seen` falls within the online window."""
    if not last_seen:
        return False
    return last_seen >= timezone.now() - ONLINE_WINDOW


def active_collector_count(city: str | None = None) -> int:
    """Number of collectors active within the online window (optionally by city)."""
    from albunmania_app.models import Profile
    qs = Profile.objects.filter(last_seen__gte=timezone.now() - ONLINE_WINDOW)
    if city:
        qs = qs.filter(city__icontains=city.strip())
    return qs.count()
