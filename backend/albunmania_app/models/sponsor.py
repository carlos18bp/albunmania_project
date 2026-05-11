from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


class Sponsor(models.Model):
    """The Presenting Sponsor — single anchor brand active at any time.

    The model itself does NOT enforce "only one active sponsor" at the DB
    layer (multiple rows can have overlapping windows for historical
    auditing). The active row is computed by `Sponsor.active()` which the
    public endpoint and splash screen rely on.
    """

    brand_name = models.CharField(_('brand name'), max_length=120)
    logo_url = models.URLField(_('logo URL'))
    primary_color = models.CharField(
        _('primary color'),
        max_length=9,
        help_text=_('Hex value (e.g. #0b0b10) used for header band, splash background.'),
    )
    secondary_color = models.CharField(
        _('secondary color'),
        max_length=9,
        help_text=_('Accent hex used for splash text and call-to-action borders.'),
    )
    message_text = models.CharField(
        _('message text'),
        max_length=140, blank=True,
        help_text=_('Short slogan rendered next to the logo on splash and emails.'),
    )

    active_from = models.DateTimeField(_('active from'))
    active_until = models.DateTimeField(_('active until'))

    contract_amount = models.DecimalField(
        _('contract amount (COP)'),
        max_digits=14, decimal_places=2, default=0,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('Sponsor')
        verbose_name_plural = _('Sponsors')
        ordering = ['-active_from']
        indexes = [models.Index(fields=['active_from', 'active_until'])]

    def __str__(self) -> str:
        return f'{self.brand_name} ({self.active_from:%Y-%m-%d} → {self.active_until:%Y-%m-%d})'

    @property
    def is_currently_active(self) -> bool:
        now = timezone.now()
        return self.active_from <= now <= self.active_until

    @classmethod
    def active(cls) -> 'Sponsor | None':
        """Return the sponsor whose window contains `now()`, if any.

        If multiple windows overlap (operator misconfiguration), the most
        recently activated row wins by `active_from desc`.
        """
        now = timezone.now()
        return cls.objects.filter(active_from__lte=now, active_until__gte=now).first()
