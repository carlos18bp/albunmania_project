"""MerchantProfile model tests — role-gated autoprovision + listing visibility."""
from datetime import timedelta

import pytest
from django.contrib.auth import get_user_model
from django.utils import timezone

from albunmania_app.models import MerchantProfile


@pytest.mark.django_db
def test_merchant_profile_not_created_for_collector():
    User = get_user_model()
    user = User.objects.create_user(email='c@example.com', password='pass1234')

    assert MerchantProfile.objects.filter(user=user).count() == 0


@pytest.mark.django_db
def test_merchant_profile_created_when_user_created_with_merchant_role():
    User = get_user_model()
    user = User.objects.create_user(
        email='m@example.com', password='pass1234', role=User.Role.MERCHANT,
    )

    assert MerchantProfile.objects.filter(user=user).count() == 1


@pytest.mark.django_db
def test_merchant_profile_provisioned_on_role_transition_via_assign_role():
    User = get_user_model()
    user = User.objects.create_user(email='c@example.com', password='pass1234')
    assert MerchantProfile.objects.filter(user=user).count() == 0

    user.assign_role(User.Role.MERCHANT)

    assert MerchantProfile.objects.filter(user=user).count() == 1


@pytest.mark.django_db
def test_listing_invisible_when_subscription_inactive():
    User = get_user_model()
    user = User.objects.create_user(
        email='m@example.com', password='pass1234', role=User.Role.MERCHANT,
    )
    merchant = user.merchant_profile

    assert merchant.is_listing_visible is False


@pytest.mark.django_db
def test_listing_invisible_when_subscription_expired():
    User = get_user_model()
    user = User.objects.create_user(
        email='m@example.com', password='pass1234', role=User.Role.MERCHANT,
    )
    merchant = user.merchant_profile
    merchant.subscription_status = 'active'
    merchant.subscription_expires_at = timezone.now() - timedelta(days=1)
    merchant.save()

    assert merchant.is_listing_visible is False


@pytest.mark.django_db
def test_listing_visible_when_subscription_active_and_not_expired():
    User = get_user_model()
    user = User.objects.create_user(
        email='m@example.com', password='pass1234', role=User.Role.MERCHANT,
    )
    merchant = user.merchant_profile
    merchant.subscription_status = 'active'
    merchant.subscription_expires_at = timezone.now() + timedelta(days=10)
    merchant.save()

    assert merchant.is_listing_visible is True
