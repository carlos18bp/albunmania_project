from django.db import models
from django.utils.translation import gettext_lazy as _


class AdCreative(models.Model):
    """An individual banner image inside a campaign.

    A campaign can have multiple creatives that rotate via `weight`.
    Each creative carries its own click destination so A/B testing of
    landing pages is trivial.
    """

    campaign = models.ForeignKey(
        'albunmania_app.AdCampaign',
        on_delete=models.CASCADE,
        related_name='creatives',
    )

    image_url = models.URLField(_('image URL'))
    headline = models.CharField(_('headline'), max_length=120, blank=True)
    body = models.CharField(_('body'), max_length=240, blank=True)
    click_url = models.URLField(_('click URL'))

    weight = models.PositiveSmallIntegerField(_('rotation weight'), default=1)
    is_active = models.BooleanField(_('active'), default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('Ad creative')
        verbose_name_plural = _('Ad creatives')
        indexes = [models.Index(fields=['campaign', 'is_active'])]

    def __str__(self) -> str:
        return f'AdCreative<campaign={self.campaign_id} headline="{self.headline[:30]}">'
