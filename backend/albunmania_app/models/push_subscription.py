from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _


class PushSubscription(models.Model):
    """A Web Push subscription tied to a user + browser/device.

    The browser's `PushManager.subscribe()` returns a `PushSubscription`
    object with three fields we persist verbatim: `endpoint` (the push
    service URL), `p256dh` (ECDH public key) and `auth` (the auth
    secret). Send a notification by POST-ing to the endpoint with a
    payload encrypted to (p256dh, auth) — pywebpush handles that.

    A user can have multiple subscriptions (one per browser/device).
    `endpoint` is unique globally because the push service guarantees
    its uniqueness, so the same browser re-subscribing returns the same
    endpoint and we update_or_create on it.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='push_subscriptions',
    )

    endpoint = models.URLField(_('endpoint'), max_length=600, unique=True)
    p256dh = models.CharField(_('p256dh key'), max_length=200)
    auth = models.CharField(_('auth secret'), max_length=64)

    user_agent = models.CharField(_('user-agent'), max_length=500, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    last_used_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('Push subscription')
        verbose_name_plural = _('Push subscriptions')
        indexes = [models.Index(fields=['user', '-last_used_at'])]

    def __str__(self) -> str:
        return f'PushSubscription<user={self.user_id} endpoint={self.endpoint[:60]}…>'
