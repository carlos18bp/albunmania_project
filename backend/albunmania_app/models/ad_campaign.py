from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _


class AdCampaign(models.Model):
    """A CPM banner campaign (Motor Inventario).

    The Web Manager configures it from the admin panel. Multiple
    creatives can hang off a campaign; rotation between them is
    controlled by `AdCreative.weight`. The campaign itself carries the
    overall budget and geographic targeting.
    """

    class Status(models.TextChoices):
        DRAFT = 'draft', _('Draft')
        ACTIVE = 'active', _('Active')
        PAUSED = 'paused', _('Paused')
        ENDED = 'ended', _('Ended')

    advertiser_name = models.CharField(_('advertiser name'), max_length=200)
    impressions_purchased = models.PositiveIntegerField(_('impressions purchased'))
    impressions_served = models.PositiveIntegerField(_('impressions served'), default=0)
    cpm_rate_cop = models.DecimalField(
        _('CPM rate (COP)'), max_digits=12, decimal_places=2, default=0,
        help_text=_('Price per 1.000 impressions in Colombian pesos.'),
    )

    # Comma-separated list of cities (case-insensitive). Empty = all cities.
    geo_targeting_cities = models.CharField(
        _('geo targeting cities (csv)'), max_length=500, blank=True,
    )

    weight = models.PositiveSmallIntegerField(
        _('rotation weight'), default=1,
        help_text=_('Higher weight = served more often vs. peers.'),
    )

    start_date = models.DateField(_('start date'))
    end_date = models.DateField(_('end date'))

    status = models.CharField(max_length=10, choices=Status.choices, default=Status.DRAFT)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='+',
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('Ad campaign')
        verbose_name_plural = _('Ad campaigns')
        indexes = [
            models.Index(fields=['status', 'start_date', 'end_date']),
        ]

    def __str__(self) -> str:
        return f'AdCampaign<{self.advertiser_name} {self.status}>'

    @property
    def remaining_impressions(self) -> int:
        return max(0, self.impressions_purchased - self.impressions_served)

    def cities(self) -> list[str]:
        return [c.strip().lower() for c in self.geo_targeting_cities.split(',') if c.strip()]
