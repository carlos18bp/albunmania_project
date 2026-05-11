from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _


class Match(models.Model):
    """A mutual interest record between two users.

    A Match is created at the moment two users have liked each other for
    a swap (channel='swipe') or have validated a face-to-face inventory
    cross at a trading event (channel='qr_presencial').

    The pair (user_a, user_b) is canonical: `user_a_id < user_b_id` is
    enforced at save time so the unique constraint catches duplicates
    regardless of who liked whom first.
    """

    class Channel(models.TextChoices):
        SWIPE = 'swipe', _('Swipe')
        QR_PRESENCIAL = 'qr_presencial', _('QR presencial')

    class Status(models.TextChoices):
        MUTUAL = 'mutual', _('Mutual')
        CONFIRMED = 'confirmed', _('Confirmed')
        CANCELLED = 'cancelled', _('Cancelled')
        EXPIRED = 'expired', _('Expired')

    user_a = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='matches_as_a',
    )
    user_b = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='matches_as_b',
    )

    channel = models.CharField(max_length=20, choices=Channel.choices)
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.MUTUAL,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    last_event_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('Match')
        verbose_name_plural = _('Matches')
        constraints = [
            models.UniqueConstraint(
                fields=['user_a', 'user_b', 'channel'],
                name='uniq_match_pair_channel',
            ),
            models.CheckConstraint(
                condition=models.Q(user_a__lt=models.F('user_b')),
                name='match_user_a_lt_user_b',
            ),
        ]
        indexes = [
            models.Index(fields=['user_a', 'status']),
            models.Index(fields=['user_b', 'status']),
        ]

    def __str__(self) -> str:
        return f'Match<{self.user_a_id}↔{self.user_b_id} {self.channel} {self.status}>'

    @classmethod
    def canonical_pair(cls, user_x_id: int, user_y_id: int) -> tuple[int, int]:
        """Order two user ids so user_a < user_b (canonical form)."""
        if user_x_id == user_y_id:
            raise ValueError('A match cannot involve the same user twice.')
        return (user_x_id, user_y_id) if user_x_id < user_y_id else (user_y_id, user_x_id)
