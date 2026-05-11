from django.urls import path

from albunmania_app.views.trade import trade_share_lists

urlpatterns = [
    path('trade/share/<str:token>/', trade_share_lists, name='trade-share'),
]
