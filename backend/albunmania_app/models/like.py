from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _


class Like(models.Model):
    """A directional like from one collector to another, scoped to a swap.

    `from_user` offers `sticker_offered` and wants `sticker_wanted` from
    `to_user`. A mutual is detected when the mirror Like row exists with
    the offered/wanted stickers swapped.
    """

    from_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='likes_sent',
    )
    to_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='likes_received',
    )
    sticker_offered = models.ForeignKey(
        'albunmania_app.Sticker',
        on_delete=models.CASCADE,
        related_name='offered_in_likes',
    )
    sticker_wanted = models.ForeignKey(
        'albunmania_app.Sticker',
        on_delete=models.CASCADE,
        related_name='wanted_in_likes',
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('Like')
        verbose_name_plural = _('Likes')
        constraints = [
            models.UniqueConstraint(
                fields=['from_user', 'to_user', 'sticker_offered', 'sticker_wanted'],
                name='uniq_like_quad',
            ),
        ]
        indexes = [
            models.Index(fields=['to_user', 'from_user']),
        ]

    def __str__(self) -> str:
        return (
            f'Like<{self.from_user_id}→{self.to_user_id} '
            f'offer #{self.sticker_offered_id} want #{self.sticker_wanted_id}>'
        )

    def find_mirror(self) -> 'Like | None':
        """Return the inverse Like if the other side already liked back.

        Mirror means: `(from_user=to_user, to_user=from_user,
        sticker_offered=sticker_wanted, sticker_wanted=sticker_offered)`.
        """
        return Like.objects.filter(
            from_user=self.to_user,
            to_user=self.from_user,
            sticker_offered=self.sticker_wanted,
            sticker_wanted=self.sticker_offered,
        ).first()
