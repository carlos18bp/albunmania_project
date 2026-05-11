"""Proximity match engine.

Given a logged-in user with a populated Profile (lat/lng + active
album), `find_candidates` returns up to N nearby collectors whose
inventory complements the caller's. Specifically:

  - Caller has stickers with `count >= 2` → things they can give away.
  - Candidate has corresponding stickers with `count == 0` → things they
    are missing.

The function is intentionally simple: prefilter by a bounding box on
`Profile.lat_approx/lng_approx`, then compute haversine distances in
Python and rank by `(matches_count desc, distance_km asc)`. There is no
external dependency — stdlib `math` gives us everything we need. The
PostGIS upgrade is left for V2; with `limit<=20` the in-Python rank is
trivial.
"""
from __future__ import annotations

import math
from dataclasses import dataclass
from decimal import Decimal

from django.db.models import Count, Q

from albunmania_app.models import Profile, UserSticker


EARTH_RADIUS_KM = 6371.0088
DEG_PER_KM_LAT = 1 / 111.0  # 1° latitude ≈ 111 km, near enough for prefiltering.


@dataclass
class MatchCandidate:
    user_id: int
    distance_km: float
    stickers_offered: list[int]  # sticker ids that the *caller* can give
    stickers_wanted: list[int]   # sticker ids that the *caller* wants from candidate


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Great-circle distance in kilometres."""
    lat1_r, lat2_r = math.radians(lat1), math.radians(lat2)
    dlat = lat2_r - lat1_r
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat / 2) ** 2 + math.cos(lat1_r) * math.cos(lat2_r) * math.sin(dlng / 2) ** 2
    c = 2 * math.asin(math.sqrt(min(1.0, a)))
    return EARTH_RADIUS_KM * c


def _bounding_box(lat: float, lng: float, radius_km: float) -> tuple[float, float, float, float]:
    """Return (lat_min, lat_max, lng_min, lng_max) for a coarse SQL prefilter."""
    dlat = radius_km * DEG_PER_KM_LAT
    cos_lat = max(0.0001, math.cos(math.radians(lat)))
    dlng = (radius_km * DEG_PER_KM_LAT) / cos_lat
    return (lat - dlat, lat + dlat, lng - dlng, lng + dlng)


def find_candidates(user, radius_km: float = 10.0, limit: int = 20) -> list[MatchCandidate]:
    """Return up to `limit` complementary collectors near `user`.

    The caller must have a Profile with `browser_geo_optin=True`,
    `lat_approx`, `lng_approx` and `active_album_id` set. Otherwise an
    empty list is returned (no exception — the frontend renders an empty
    state with onboarding link).
    """
    profile: Profile | None = getattr(user, 'profile', None)
    if not profile or not profile.browser_geo_optin:
        return []
    if profile.lat_approx is None or profile.lng_approx is None:
        return []
    if profile.active_album_id is None:
        return []

    my_lat = float(profile.lat_approx)
    my_lng = float(profile.lng_approx)

    # Caller's repeated stickers (count >= 2) in the active album.
    my_repeats = list(
        UserSticker.objects.filter(
            user=user,
            count__gte=2,
            sticker__album_id=profile.active_album_id,
        ).values_list('sticker_id', flat=True)
    )
    my_missing = list(
        UserSticker.objects.filter(
            user=user,
            count=0,
            sticker__album_id=profile.active_album_id,
        ).values_list('sticker_id', flat=True)
    )

    if not my_repeats and not my_missing:
        return []

    lat_min, lat_max, lng_min, lng_max = _bounding_box(my_lat, my_lng, radius_km)

    nearby = (
        Profile.objects
        .filter(
            browser_geo_optin=True,
            active_album_id=profile.active_album_id,
            lat_approx__gte=Decimal(str(lat_min)),
            lat_approx__lte=Decimal(str(lat_max)),
            lng_approx__gte=Decimal(str(lng_min)),
            lng_approx__lte=Decimal(str(lng_max)),
        )
        .exclude(user_id=user.id)
        .select_related('user')
    )

    candidates: list[MatchCandidate] = []
    for cand_profile in nearby:
        c_lat = float(cand_profile.lat_approx)
        c_lng = float(cand_profile.lng_approx)
        d_km = haversine_km(my_lat, my_lng, c_lat, c_lng)
        if d_km > radius_km:
            continue

        # What I can give them: my repeats they are missing.
        their_missing = set(
            UserSticker.objects.filter(
                user_id=cand_profile.user_id,
                sticker_id__in=my_repeats,
                count=0,
            ).values_list('sticker_id', flat=True)
        )
        # What they can give me: their repeats I am missing.
        their_repeats = set(
            UserSticker.objects.filter(
                user_id=cand_profile.user_id,
                sticker_id__in=my_missing,
                count__gte=2,
            ).values_list('sticker_id', flat=True)
        )

        if not their_missing and not their_repeats:
            continue

        candidates.append(MatchCandidate(
            user_id=cand_profile.user_id,
            distance_km=round(d_km, 2),
            stickers_offered=sorted(their_missing),
            stickers_wanted=sorted(their_repeats),
        ))

    candidates.sort(
        key=lambda c: (
            -(len(c.stickers_offered) + len(c.stickers_wanted)),
            c.distance_km,
        ),
    )
    return candidates[:limit]


__all__ = ['MatchCandidate', 'find_candidates', 'haversine_km']
