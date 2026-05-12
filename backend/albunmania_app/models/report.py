from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _


class Report(models.Model):
    """A moderation report against a user (profile) or a trade (no-show etc.).

    Distinct from `ReviewReport` (which only reports a *review*). Exactly
    one of `target_user` / `target_trade` is set, matching `target_kind`
    (enforced by a CheckConstraint). The admin resolves it as DISMISSED
    or ACTIONED with optional notes; sanctions (deactivating a user) are
    done separately from /admin/users — this row is the audit trail.
    """

    class TargetKind(models.TextChoices):
        USER = 'user', _('User')
        TRADE = 'trade', _('Trade')

    class Reason(models.TextChoices):
        NO_SHOW = 'no_show', _('No-show')
        HARASSMENT = 'harassment', _('Harassment / abuse')
        FAKE_PROFILE = 'fake_profile', _('Fake profile')
        INAPPROPRIATE = 'inappropriate', _('Inappropriate content')
        OTHER = 'other', _('Other')

    class Status(models.TextChoices):
        PENDING = 'pending', _('Pending')
        DISMISSED = 'dismissed', _('Dismissed')
        ACTIONED = 'actioned', _('Actioned')

    reporter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reports_filed',
    )
    target_kind = models.CharField(max_length=8, choices=TargetKind.choices)
    target_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL, null=True, blank=True,
        related_name='reports_received',
    )
    target_trade = models.ForeignKey(
        'albunmania_app.Trade',
        on_delete=models.SET_NULL, null=True, blank=True,
        related_name='reports',
    )

    reason = models.CharField(max_length=16, choices=Reason.choices)
    detail = models.CharField(_('detail'), max_length=500, blank=True)

    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL, null=True, blank=True,
        related_name='+',
    )
    resolved_at = models.DateTimeField(null=True, blank=True)
    resolution_notes = models.TextField(_('resolution notes'), blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('Report')
        verbose_name_plural = _('Reports')
        ordering = ['status', '-created_at']
        constraints = [
            models.CheckConstraint(
                condition=(
                    models.Q(target_kind='user', target_user__isnull=False, target_trade__isnull=True)
                    | models.Q(target_kind='trade', target_trade__isnull=False, target_user__isnull=True)
                ),
                name='report_target_matches_kind',
            ),
        ]
        indexes = [models.Index(fields=['status', '-created_at'])]

    def __str__(self) -> str:
        target = self.target_user_id if self.target_kind == self.TargetKind.USER else self.target_trade_id
        return f'Report<{self.target_kind}={target} {self.reason} {self.status}>'
