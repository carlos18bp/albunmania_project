from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _


class Notification(models.Model):
    """In-app notification for a user.

    Distinct from Web Push (PushSubscription): this is the record behind
    the "Notificaciones" center. A notification carries its already-rendered
    title/body/url (so the center doesn't need to re-derive them) plus a
    `kind` discriminator and optional links to the originating actor /
    match / review (all SET_NULL so deleting those doesn't drop history).
    `read_at` is null until the user opens it.
    """

    class Kind(models.TextChoices):
        MATCH_MUTUAL = 'match_mutual', _('Mutual match')
        REVIEW_RECEIVED = 'review_received', _('Review received')
        REVIEW_REPLY = 'review_reply', _('Review reply')

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
    )
    kind = models.CharField(_('kind'), max_length=24, choices=Kind.choices)
    title = models.CharField(_('title'), max_length=200)
    body = models.CharField(_('body'), max_length=400, blank=True)
    url = models.CharField(_('deep link'), max_length=300, blank=True)

    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL, null=True, blank=True,
        related_name='+',
        help_text=_('The other user this notification is about, if any.'),
    )
    match = models.ForeignKey(
        'albunmania_app.Match',
        on_delete=models.SET_NULL, null=True, blank=True,
        related_name='+',
    )
    review = models.ForeignKey(
        'albunmania_app.Review',
        on_delete=models.SET_NULL, null=True, blank=True,
        related_name='+',
    )

    read_at = models.DateTimeField(_('read at'), null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('Notification')
        verbose_name_plural = _('Notifications')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'read_at']),
            models.Index(fields=['user', '-created_at']),
        ]

    def __str__(self) -> str:
        return f'Notification<user={self.user_id} {self.kind} read={bool(self.read_at)}>'

    @property
    def is_read(self) -> bool:
        return self.read_at is not None
