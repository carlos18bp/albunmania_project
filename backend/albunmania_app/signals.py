"""Albunmanía model signals.

Wired in `apps.py` ready() so they load once at app start.
"""
from django.conf import settings
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from .models import Match, MerchantProfile, Profile, Review, User
from .services.push_notify import build_match_mutual_payload, send_to as push_send_to
from .services.review_aggregates import recompute_for


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


@receiver(post_save, sender=Review)
def recompute_aggregates_on_save(sender, instance: Review, **kwargs):
    """Refresh Profile reputation aggregates after any Review change.

    This catches both creation and edits (incl. moderator hides via
    `is_visible=False`). The recompute reads from `Review` so it always
    reflects the current visibility state.
    """
    recompute_for(instance.reviewee_id)


@receiver(post_delete, sender=Review)
def recompute_aggregates_on_delete(sender, instance: Review, **kwargs):
    recompute_for(instance.reviewee_id)


@receiver(post_save, sender=Match)
def push_on_mutual_match(sender, instance: Match, created: bool, **kwargs):
    """Notify both participants when a Match flips into mutual.

    Best-effort — push errors are logged inside push_notify.send_to and
    swallowed. We only fire on create + status==mutual to avoid sending
    on every Match save (status updates happen often).
    """
    if not created or instance.status != Match.Status.MUTUAL:
        return

    User = type(instance.user_a)
    pair = [instance.user_a, instance.user_b]
    for me in pair:
        peer = pair[1] if me is pair[0] else pair[0]
        payload = build_match_mutual_payload(
            match_id=instance.id,
            other_user_email=peer.email,
        )
        push_send_to(me, payload)
