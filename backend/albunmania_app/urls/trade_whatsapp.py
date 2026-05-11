from django.urls import path

from albunmania_app.views.trade_whatsapp import (
    trade_whatsapp_link,
    trade_whatsapp_optin,
)

urlpatterns = [
    path(
        'trade/<int:trade_id>/whatsapp-optin/',
        trade_whatsapp_optin, name='trade-whatsapp-optin',
    ),
    path(
        'trade/<int:trade_id>/whatsapp-link/',
        trade_whatsapp_link, name='trade-whatsapp-link',
    ),
]
