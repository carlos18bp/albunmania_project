from django.urls import path

from albunmania_app.views.inventory import (
    inventory_bulk_sync,
    inventory_list,
    inventory_tap,
)

urlpatterns = [
    path('inventory/', inventory_list, name='inventory-list'),
    path('inventory/bulk/', inventory_bulk_sync, name='inventory-bulk-sync'),
    path('inventory/tap/', inventory_tap, name='inventory-tap'),
]
