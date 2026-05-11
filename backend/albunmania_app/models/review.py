from django.conf import settings
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


REVIEW_TAGS = [
    'puntual', 'cromos_buen_estado', 'buena_comunicacion',
    'amable', 'rapido', 'ubicacion_facil',
    'no_show', 'cromos_mal_estado', 'mala_comunicacion',
]

EDIT_WINDOW_HOURS = 24


class Review(models.Model):
    """Post-trade review between two collectors.

    A confirmed Trade enables one Review per direction (unique by
    (trade, reviewer)). The 24h edit window is enforced in the view
    layer via `is_editable`. The reviewee can post a single public
    `reply`. Moderation flips `is_visible` without deleting the record:
    hidden reviews stay in DB for audit but stop counting in
    `Profile.rating_avg/rating_count/positive_pct`.
    """

    trade = models.ForeignKey(
        'albunmania_app.Trade',
        on_delete=models.CASCADE,
        related_name='reviews',
    )
    reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reviews_written',
    )
    reviewee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reviews_received',
    )

    stars = models.PositiveSmallIntegerField(_('stars'))
    comment = models.CharField(_('comment'), max_length=500, blank=True)
    tags = models.JSONField(_('tags'), default=list, blank=True)

    reply = models.CharField(_('public reply'), max_length=500, blank=True)
    replied_at = models.DateTimeField(null=True, blank=True)

    is_visible = models.BooleanField(_('visible publicly'), default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('Review')
        verbose_name_plural = _('Reviews')
        constraints = [
            models.UniqueConstraint(
                fields=['trade', 'reviewer'],
                name='uniq_review_trade_reviewer',
            ),
            models.CheckConstraint(
                condition=models.Q(stars__gte=1, stars__lte=5),
                name='review_stars_1_to_5',
            ),
        ]
        indexes = [
            models.Index(fields=['reviewee', '-created_at']),
            models.Index(fields=['is_visible']),
        ]

    def __str__(self) -> str:
        return f'Review<trade={self.trade_id} {self.reviewer_id}→{self.reviewee_id} {self.stars}★>'

    @property
    def is_editable(self) -> bool:
        """True while the 24h edit window is open."""
        from datetime import timedelta
        return timezone.now() <= self.created_at + timedelta(hours=EDIT_WINDOW_HOURS)


class ReviewReport(models.Model):
    """Anyone can report a Review for moderation review."""

    class Status(models.TextChoices):
        PENDING = 'pending', _('Pending')
        DISMISSED = 'dismissed', _('Dismissed')
        ACTIONED = 'actioned', _('Actioned')

    review = models.ForeignKey(
        'albunmania_app.Review',
        on_delete=models.CASCADE,
        related_name='reports',
    )
    reporter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='+',
    )
    reason = models.CharField(_('reason'), max_length=500)

    status = models.CharField(max_length=12, choices=Status.choices, default=Status.PENDING)
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL, null=True, blank=True,
        related_name='+',
    )
    resolved_at = models.DateTimeField(null=True, blank=True)
    resolution_notes = models.TextField(_('resolution notes'), blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('Review report')
        verbose_name_plural = _('Review reports')
        ordering = ['status', '-created_at']
        constraints = [
            models.UniqueConstraint(
                fields=['review', 'reporter'],
                name='uniq_review_report_per_reporter',
            ),
        ]
        indexes = [models.Index(fields=['status', '-created_at'])]

    def __str__(self) -> str:
        return f'ReviewReport<review={self.review_id} {self.status}>'
