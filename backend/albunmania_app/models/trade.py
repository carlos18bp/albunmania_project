from django.db import models
from django.utils.translation import gettext_lazy as _


class Trade(models.Model):
    """Concrete swap derived from a Match.

    A Trade is created the instant a Match goes mutual (swipe channel) or
    is confirmed face-to-face (qr_presencial channel). It snapshots the
    items each side will hand over so a later inventory change does not
    rewrite the agreement.

    `items` shape: `[{"from_user": <id>, "to_user": <id>, "sticker_id": <id>}, ...]`.
    """

    class Status(models.TextChoices):
        OPEN = 'open', _('Open')
        COMPLETED = 'completed', _('Completed')
        CANCELLED = 'cancelled', _('Cancelled')

    match = models.OneToOneField(
        'albunmania_app.Match',
        on_delete=models.CASCADE,
        related_name='trade',
    )

    items = models.JSONField(default=list)

    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.OPEN,
    )

    whatsapp_link_a = models.URLField(blank=True)
    whatsapp_link_b = models.URLField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('Trade')
        verbose_name_plural = _('Trades')

    def __str__(self) -> str:
        return f'Trade<match={self.match_id} status={self.status} items={len(self.items)}>'

    @property
    def participant_ids(self) -> tuple[int, int]:
        return (self.match.user_a_id, self.match.user_b_id)
