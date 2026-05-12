from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _


class Profile(models.Model):
    """Public collector profile attached 1:1 to User.

    Created automatically by a post_save signal on User. Holds the public
    surface (city, avatar, bio) plus opt-ins (geolocation, push, WhatsApp)
    and cached reputation aggregates that the Match Swipe card reads to
    avoid an N+1 query against Review.
    """

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='profile',
    )

    # ── Public profile ──
    city = models.CharField(_('city'), max_length=120, blank=True)
    avatar_url = models.URLField(_('avatar URL'), blank=True)
    bio_short = models.CharField(_('bio (short)'), max_length=280, blank=True)

    # ── Geolocation (approximate, for proximity match) ──
    lat_approx = models.DecimalField(
        _('approximate latitude'),
        max_digits=9, decimal_places=6, null=True, blank=True,
    )
    lng_approx = models.DecimalField(
        _('approximate longitude'),
        max_digits=9, decimal_places=6, null=True, blank=True,
    )

    # ── Active album (FK is added once Album model exists in Epic 2) ──
    active_album_id = models.IntegerField(
        _('active album id'), null=True, blank=True,
        help_text=_('FK to Album once Epic 2 lands.'),
    )

    # ── Opt-ins (per-user; per-trade WhatsApp opt-in lives on Match) ──
    whatsapp_optin = models.BooleanField(_('WhatsApp opt-in'), default=False)
    push_optin = models.BooleanField(_('push opt-in'), default=False)
    browser_geo_optin = models.BooleanField(_('browser geolocation opt-in'), default=False)
    whatsapp_e164 = models.CharField(_('WhatsApp number (E.164)'), max_length=20, blank=True)

    # ── Cached reputation aggregates (recomputed by Review post_save signal) ──
    rating_avg = models.DecimalField(
        _('rating average'),
        max_digits=3, decimal_places=2, default=0,
    )
    rating_count = models.PositiveIntegerField(_('rating count'), default=0)
    positive_pct = models.DecimalField(
        _('positive reviews %'),
        max_digits=5, decimal_places=2, default=0,
        help_text=_('Reviews with stars >= 4 / rating_count * 100.'),
    )

    # ── Presence ("en línea ahora" / Live Badge) ──
    last_seen = models.DateTimeField(
        _('last seen at'), null=True, blank=True, db_index=True,
        help_text=_('Updated (throttled) on authenticated activity; drives the Live Badge.'),
    )

    # ── Audit ──
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('Profile')
        verbose_name_plural = _('Profiles')

    def __str__(self) -> str:
        return f'Profile<{self.user.email}>'

    @property
    def is_onboarded(self) -> bool:
        """A profile is considered onboarded once an active album is set."""
        return self.active_album_id is not None

    @property
    def is_online(self) -> bool:
        """True if the collector has been active within the presence window."""
        from albunmania_app.services import presence
        return presence.is_online(self.last_seen)
