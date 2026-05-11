"""Merchant subscription lifecycle helpers."""
from __future__ import annotations

from datetime import timedelta
from decimal import Decimal

from django.utils import timezone

from albunmania_app.models import MerchantProfile, MerchantSubscriptionPayment


def register_payment(
    *,
    merchant: MerchantProfile,
    registered_by,
    amount_cop: Decimal | str,
    period_months: int,
    method: str,
    reference: str = '',
    notes: str = '',
    paid_at=None,
) -> MerchantSubscriptionPayment:
    """Create a payment row and extend `subscription_expires_at`.

    `paid_at` defaults to now. The expiration extends from
    `max(now, current_expires_at)` so consecutive payments stack
    correctly even when the merchant pre-pays.
    """
    if period_months <= 0:
        raise ValueError('period_months must be positive.')

    paid_at = paid_at or timezone.now()
    payment = MerchantSubscriptionPayment.objects.create(
        merchant=merchant,
        registered_by=registered_by,
        amount_cop=Decimal(str(amount_cop)),
        period_months=period_months,
        method=method,
        reference=reference,
        notes=notes,
        paid_at=paid_at,
    )

    base = merchant.subscription_expires_at if (
        merchant.subscription_expires_at and merchant.subscription_expires_at > timezone.now()
    ) else timezone.now()
    merchant.subscription_expires_at = base + timedelta(days=30 * period_months)
    merchant.subscription_status = 'active'
    merchant.save(update_fields=['subscription_expires_at', 'subscription_status', 'updated_at'])

    return payment
