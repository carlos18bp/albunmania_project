"""Recompute cached reputation aggregates on Profile.

Triggered by `Review.post_save / post_delete` signals so list views
(Match cards, Profile drawer) can read `Profile.rating_avg`,
`rating_count` and `positive_pct` without N+1 queries against Review.

Hidden reviews (`is_visible=False`) are excluded — that's the moderation
lever: a moderator can hide a review without losing the audit trail.
"""
from __future__ import annotations

from decimal import Decimal

from django.db.models import Avg, Count, Q

from albunmania_app.models import Profile, Review


def recompute_for(user_id: int) -> None:
    """Refresh aggregates for `Profile(user_id=...)` from visible reviews."""
    profile = Profile.objects.filter(user_id=user_id).first()
    if not profile:
        return

    qs = Review.objects.filter(reviewee_id=user_id, is_visible=True)
    agg = qs.aggregate(
        avg=Avg('stars'),
        total=Count('id'),
        positive=Count('id', filter=Q(stars__gte=4)),
    )
    total = agg['total'] or 0
    avg = Decimal(str(agg['avg'] or 0)).quantize(Decimal('0.01'))
    positive = agg['positive'] or 0
    pct = (Decimal(positive) / Decimal(total) * Decimal('100')).quantize(Decimal('0.01')) if total else Decimal('0.00')

    Profile.objects.filter(pk=profile.pk).update(
        rating_avg=avg,
        rating_count=total,
        positive_pct=pct,
    )
