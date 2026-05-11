from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _


class UserSticker(models.Model):
    """User inventory entry per (user, sticker).

    Semantic of `count`:
      - 0 = missing (the user does not own this sticker)
      - 1 = pasted (one in the album)
      - 2+ = repeated (extras available to trade away)

    The 0/1/2+ tap UX from the spec maps to:
      - tap → cycle 0 → 1 → 2 → 3 → ... (atomic single increment)
      - long press → reset to 0

    Composite index (user_id, sticker_id) is critical: this is the single
    most queried table when rendering the catalogue or computing a match.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='inventory',
    )
    sticker = models.ForeignKey(
        'albunmania_app.Sticker',
        on_delete=models.CASCADE,
        related_name='owners',
    )
    count = models.PositiveIntegerField(_('count'), default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('User sticker')
        verbose_name_plural = _('User stickers')
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'sticker'],
                name='uniq_user_sticker',
            ),
        ]
        indexes = [
            models.Index(fields=['user', 'sticker']),
            models.Index(fields=['sticker', 'count']),
        ]

    def __str__(self) -> str:
        return f'{self.user.email} · #{self.sticker.number}={self.count}'

    @property
    def is_pasted(self) -> bool:
        return self.count >= 1

    @property
    def is_repeated(self) -> bool:
        return self.count >= 2
