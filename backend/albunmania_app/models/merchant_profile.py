from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _


class MerchantProfile(models.Model):
    """Business profile for users with the Merchant role.

    Created automatically when User.role transitions to MERCHANT (via the
    post_save signal on User). Populated by the Web Manager from the admin
    panel or by the merchant from their dashboard.

    Listing visibility on the public map (Epic 5) requires:
      subscription_status == 'active' AND subscription_expires_at > now()
    """

    SUBSCRIPTION_STATUS_CHOICES = (
        ('inactive', _('Inactive')),
        ('active', _('Active')),
        ('expired', _('Expired')),
        ('suspended', _('Suspended')),
    )

    BUSINESS_TYPE_CHOICES = (
        ('papeleria', _('Papelería')),
        ('kiosco', _('Kiosco')),
        ('libreria', _('Librería')),
        ('distribuidor', _('Distribuidor oficial')),
        ('otro', _('Otro')),
    )

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='merchant_profile',
    )

    # ── Business info (visible on the merchant listing map) ──
    business_name = models.CharField(_('business name'), max_length=200, blank=True)
    business_type = models.CharField(
        _('business type'),
        max_length=20, choices=BUSINESS_TYPE_CHOICES, blank=True,
    )
    address = models.CharField(_('address'), max_length=300, blank=True)
    lat = models.DecimalField(_('latitude'), max_digits=9, decimal_places=6, null=True, blank=True)
    lng = models.DecimalField(_('longitude'), max_digits=9, decimal_places=6, null=True, blank=True)
    opening_hours = models.JSONField(
        _('opening hours'),
        default=dict, blank=True,
        help_text=_('Per-weekday opening hours map.'),
    )
    declared_stock = models.TextField(_('declared stock'), blank=True)

    # ── Subscription state (Epic 5 manages billing) ──
    subscription_status = models.CharField(
        _('subscription status'),
        max_length=12, choices=SUBSCRIPTION_STATUS_CHOICES, default='inactive',
    )
    subscription_expires_at = models.DateTimeField(
        _('subscription expires at'), null=True, blank=True,
    )

    # ── Audit ──
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('Merchant Profile')
        verbose_name_plural = _('Merchant Profiles')
        indexes = [
            models.Index(fields=['subscription_status']),
            models.Index(fields=['lat', 'lng']),
        ]

    def __str__(self) -> str:
        return f'MerchantProfile<{self.user.email}>'

    @property
    def is_listing_visible(self) -> bool:
        """A merchant only appears on the public map while subscription is current."""
        from django.utils import timezone

        return (
            self.subscription_status == 'active'
            and self.subscription_expires_at is not None
            and self.subscription_expires_at > timezone.now()
        )
