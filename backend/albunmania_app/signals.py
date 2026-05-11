"""Albunmanía model signals.

Wired in `apps.py` ready() so they load once at app start.
"""
from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import MerchantProfile, Profile, User


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def ensure_profile(sender, instance: User, created: bool, **kwargs):
    """Create the Profile row whenever a User is created.

    Idempotent: get_or_create handles the case where the profile already
    exists (e.g. in tests that bypass managers).
    """
    if created:
        Profile.objects.get_or_create(user=instance)


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def ensure_merchant_profile(sender, instance: User, created: bool, **kwargs):
    """Create MerchantProfile when role is MERCHANT.

    Runs on every User save (not only created) so a role transition into
    MERCHANT also provisions the profile. Removing it when the role changes
    away from MERCHANT is intentionally not done here — historical data is
    preserved and the listing visibility is gated by `is_listing_visible`.
    """
    if instance.role == User.Role.MERCHANT.value:
        MerchantProfile.objects.get_or_create(user=instance)
