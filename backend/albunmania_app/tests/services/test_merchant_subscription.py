"""merchant_subscription.register_payment service."""
from datetime import timedelta
from decimal import Decimal

import pytest
from django.contrib.auth import get_user_model
from django.utils import timezone

from albunmania_app.models import MerchantProfile, MerchantSubscriptionPayment
from albunmania_app.services.merchant_subscription import register_payment


User = get_user_model()


@pytest.fixture
def setup(db):
    merchant_user = User.objects.create_user(email='m@x.com', password='pw')
    merchant_user.assign_role(User.Role.MERCHANT)
    merchant = MerchantProfile.objects.get(user=merchant_user)
    web_manager = User.objects.create_user(email='wm@x.com', password='pw')
    web_manager.assign_role(User.Role.WEB_MANAGER)
    return {'merchant': merchant, 'wm': web_manager}


@pytest.mark.django_db
def test_first_payment_activates_subscription(setup):
    payment = register_payment(
        merchant=setup['merchant'], registered_by=setup['wm'],
        amount_cop='200000', period_months=1, method='nequi',
    )
    setup['merchant'].refresh_from_db()
    assert setup['merchant'].subscription_status == 'active'
    assert setup['merchant'].subscription_expires_at > timezone.now()
    assert payment.amount_cop == Decimal('200000.00')


@pytest.mark.django_db
def test_consecutive_payment_extends_from_existing_expiry(setup):
    register_payment(
        merchant=setup['merchant'], registered_by=setup['wm'],
        amount_cop='200000', period_months=1, method='nequi',
    )
    setup['merchant'].refresh_from_db()
    first_expiry = setup['merchant'].subscription_expires_at

    register_payment(
        merchant=setup['merchant'], registered_by=setup['wm'],
        amount_cop='200000', period_months=2, method='nequi',
    )
    setup['merchant'].refresh_from_db()
    expected = first_expiry + timedelta(days=60)
    assert abs((setup['merchant'].subscription_expires_at - expected).total_seconds()) < 5


@pytest.mark.django_db
def test_payment_rejects_zero_period(setup):
    with pytest.raises(ValueError):
        register_payment(
            merchant=setup['merchant'], registered_by=setup['wm'],
            amount_cop='100', period_months=0, method='nequi',
        )
