"""Banner CPM rotation engine.

Selects which `AdCreative` to serve in a given slot, given the viewer's
city. The selection is weighted random:

  weight(creative) = creative.weight * campaign.weight

It honours:

  - `AdCampaign.status == 'active'`
  - `AdCampaign.start_date <= today <= end_date`
  - `AdCampaign.remaining_impressions > 0`
  - `AdCampaign.cities()` is empty OR contains `city.lower()`
  - `AdCreative.is_active`

A `None` return means the slot should render nothing (no eligible
campaign).
"""
from __future__ import annotations

import random
from datetime import date

from django.db import transaction
from django.db.models import F

from albunmania_app.models import AdCampaign, AdCreative, AdImpression


def _eligible_creatives(slot: str, city: str, today: date) -> list[tuple[AdCreative, int]]:
    qs = AdCreative.objects.select_related('campaign').filter(
        is_active=True,
        campaign__status=AdCampaign.Status.ACTIVE,
        campaign__start_date__lte=today,
        campaign__end_date__gte=today,
    )
    out: list[tuple[AdCreative, int]] = []
    needle = (city or '').strip().lower()
    for creative in qs:
        camp = creative.campaign
        if camp.remaining_impressions <= 0:
            continue
        cities = camp.cities()
        if cities and needle and needle not in cities:
            continue
        if cities and not needle:
            # Untargeted viewer, geo-targeted campaign → skip.
            continue
        weight = max(1, creative.weight) * max(1, camp.weight)
        out.append((creative, weight))
    return out


def select_creative(slot: str, city: str = '', today: date | None = None) -> AdCreative | None:
    today = today or date.today()
    candidates = _eligible_creatives(slot, city, today)
    if not candidates:
        return None
    population, weights = zip(*candidates)
    return random.choices(list(population), weights=list(weights), k=1)[0]


def serve_banner(*, slot: str, city: str, user) -> tuple[AdCreative, AdImpression] | None:
    """Select a creative AND record the impression atomically."""
    creative = select_creative(slot, city)
    if creative is None:
        return None
    with transaction.atomic():
        AdCampaign.objects.filter(pk=creative.campaign_id).update(
            impressions_served=F('impressions_served') + 1,
        )
        impression = AdImpression.objects.create(
            creative=creative,
            user=user if user and user.is_authenticated else None,
            slot=slot,
            city=(city or '').strip(),
        )
    return creative, impression
