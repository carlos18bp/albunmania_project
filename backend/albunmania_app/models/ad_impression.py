from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _


class AdImpression(models.Model):
    """One row per banner served to a user.

    Powers reporting (impressions/CTR/geographic reach) and gates the
    click endpoint: a click must reference a known impression. Indexed
    by (creative, served_at) so per-campaign aggregates are O(rows).
    """

    class Slot(models.TextChoices):
        HOME = 'home', _('Home')
        FEED = 'feed', _('Feed')

    creative = models.ForeignKey(
        'albunmania_app.AdCreative',
        on_delete=models.PROTECT,
        related_name='impressions',
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='ad_impressions',
    )
    slot = models.CharField(max_length=10, choices=Slot.choices)
    city = models.CharField(_('city'), max_length=120, blank=True)

    served_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('Ad impression')
        verbose_name_plural = _('Ad impressions')
        indexes = [
            models.Index(fields=['creative', '-served_at']),
            models.Index(fields=['slot', 'city']),
        ]

    def __str__(self) -> str:
        return f'AdImpression<creative={self.creative_id} slot={self.slot}>'


class AdClick(models.Model):
    """A click on a previously-served impression.

    The click endpoint redirects (302) and persists this row in the same
    request. CTR is just `count(AdClick) / count(AdImpression)` per
    creative.
    """

    impression = models.ForeignKey(
        'albunmania_app.AdImpression',
        on_delete=models.CASCADE,
        related_name='clicks',
    )
    clicked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('Ad click')
        verbose_name_plural = _('Ad clicks')
        indexes = [models.Index(fields=['impression', '-clicked_at'])]

    def __str__(self) -> str:
        return f'AdClick<impression={self.impression_id}>'
