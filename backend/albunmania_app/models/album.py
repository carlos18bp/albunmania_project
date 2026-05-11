from django.db import models
from django.utils.translation import gettext_lazy as _


class Album(models.Model):
    """Tenant-like root for a sticker collection.

    Multi-album by design — Mundial 26, Champions, Copa América, Pokémon,
    each lives in its own Album row with its own catalogue and community.
    Adding a new album is just one INSERT plus the Sticker rows.
    """

    name = models.CharField(_('name'), max_length=120)
    slug = models.SlugField(_('slug'), max_length=140, unique=True)
    edition_year = models.PositiveSmallIntegerField(_('edition year'))
    total_stickers = models.PositiveIntegerField(_('total stickers'), default=0)

    is_active = models.BooleanField(
        _('is active'), default=True,
        help_text=_('Active albums are exposed in the public catalogue endpoint.'),
    )
    launch_date = models.DateField(_('launch date'), null=True, blank=True)
    end_date = models.DateField(_('end date'), null=True, blank=True)

    cover_image_url = models.URLField(_('cover image URL'), blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('Album')
        verbose_name_plural = _('Albums')
        indexes = [models.Index(fields=['is_active', 'edition_year'])]
        ordering = ['-edition_year', 'name']

    def __str__(self) -> str:
        return f'{self.name} ({self.edition_year})'
