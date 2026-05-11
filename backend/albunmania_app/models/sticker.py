from decimal import Decimal

from django.db import models
from django.utils.translation import gettext_lazy as _

from .album import Album


class Sticker(models.Model):
    """A single sticker inside an Album.

    Albunmanía-specific flags:
      - is_special_edition + special_tier — drives the gold-halo UI in Match
        and the dedicated filter on the catalogue.
      - market_value_estimate — surfaced on the special edition card; used
        as a tie-breaker when ranking QR-presencial trades by value.
    """

    class SpecialTier(models.TextChoices):
        NONE = '', '—'
        GOLD = 'gold', _('Oro')
        METALLIC = 'metallic', _('Metalizado')
        BRAND = 'brand', _('Marca patrocinadora')
        ZERO = 'zero', _('Lámina 00')

    album = models.ForeignKey(
        Album, on_delete=models.CASCADE, related_name='stickers',
    )
    number = models.CharField(
        _('number'), max_length=8,
        help_text=_('Sticker number as printed in the album. String to allow "00", "I-1", etc.'),
    )
    name = models.CharField(_('name'), max_length=160)
    team = models.CharField(_('team'), max_length=160, blank=True)
    image_url = models.URLField(_('image URL'), blank=True)

    is_special_edition = models.BooleanField(_('is special edition'), default=False)
    special_tier = models.CharField(
        _('special tier'),
        max_length=10, choices=SpecialTier.choices, default=SpecialTier.NONE, blank=True,
    )
    market_value_estimate = models.DecimalField(
        _('market value estimate (COP)'),
        max_digits=12, decimal_places=2, default=Decimal('0.00'),
        help_text=_('Indicative resale value in COP. 0 means unknown.'),
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('Sticker')
        verbose_name_plural = _('Stickers')
        constraints = [
            models.UniqueConstraint(fields=['album', 'number'], name='uniq_sticker_per_album_number'),
        ]
        indexes = [
            models.Index(fields=['album', 'is_special_edition']),
            models.Index(fields=['album', 'team']),
        ]
        ordering = ['album', 'number']

    def __str__(self) -> str:
        return f'#{self.number} {self.name}'
