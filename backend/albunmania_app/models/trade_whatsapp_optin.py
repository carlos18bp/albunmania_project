from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _


class TradeWhatsAppOptIn(models.Model):
    """Per-trade WhatsApp opt-in.

    The collector sets this opt-in *for one specific trade* — sharing
    their phone number is intentional and reversible per case, never a
    blanket consent. The wa.me deep link only renders once both
    participants have flipped their opt-in for the same trade.
    """

    trade = models.ForeignKey(
        'albunmania_app.Trade',
        on_delete=models.CASCADE,
        related_name='whatsapp_optins',
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='trade_whatsapp_optins',
    )
    opted_in = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('Trade WhatsApp opt-in')
        verbose_name_plural = _('Trade WhatsApp opt-ins')
        constraints = [
            models.UniqueConstraint(
                fields=['trade', 'user'],
                name='uniq_trade_whatsapp_optin',
            ),
        ]

    def __str__(self) -> str:
        return f'TradeWhatsAppOptIn<trade={self.trade_id} user={self.user_id} opted={self.opted_in}>'
