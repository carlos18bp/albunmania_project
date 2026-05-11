from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _


class MerchantSubscriptionPayment(models.Model):
    """A manual subscription payment registered by the Web Manager.

    V1 of Epic 5 supports manual entry only (transferencia / Nequi). Each
    payment row extends `MerchantProfile.subscription_expires_at` by
    `period_months` and bumps `subscription_status` to 'active'. The
    audit trail (when, by whom, how much) lives here so the admin can
    reconstruct the merchant's billing history.
    """

    merchant = models.ForeignKey(
        'albunmania_app.MerchantProfile',
        on_delete=models.CASCADE,
        related_name='subscription_payments',
    )
    registered_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='+',
        help_text=_('Web Manager who registered the payment.'),
    )

    amount_cop = models.DecimalField(_('amount (COP)'), max_digits=12, decimal_places=2)
    period_months = models.PositiveSmallIntegerField(
        _('period (months)'), default=1,
        help_text=_('Number of months added to subscription_expires_at.'),
    )
    method = models.CharField(
        _('payment method'), max_length=40,
        help_text=_("e.g. 'nequi', 'transferencia', 'efectivo'."),
    )
    reference = models.CharField(
        _('reference'), max_length=120, blank=True,
        help_text=_('Optional bank/Nequi reference id for reconciliation.'),
    )
    notes = models.TextField(_('notes'), blank=True)

    paid_at = models.DateTimeField(_('paid at'))
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('Merchant subscription payment')
        verbose_name_plural = _('Merchant subscription payments')
        ordering = ['-paid_at']
        indexes = [models.Index(fields=['merchant', '-paid_at'])]

    def __str__(self) -> str:
        return f'Payment<merchant={self.merchant_id} {self.amount_cop} COP>'
