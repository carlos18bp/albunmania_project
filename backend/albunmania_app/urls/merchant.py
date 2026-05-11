from django.urls import path

from albunmania_app.views.merchant import (
    merchant_admin_promote,
    merchant_admin_register_payment,
    merchant_dashboard,
    merchant_public_list,
)

urlpatterns = [
    path('merchants/', merchant_public_list, name='merchant-public-list'),
    path('merchants/me/', merchant_dashboard, name='merchant-dashboard'),
    path(
        'merchants/admin/<int:user_id>/promote/',
        merchant_admin_promote, name='merchant-admin-promote',
    ),
    path(
        'merchants/admin/<int:user_id>/payment/',
        merchant_admin_register_payment, name='merchant-admin-payment',
    ),
]
