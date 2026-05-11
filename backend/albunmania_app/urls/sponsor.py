from django.urls import path

from albunmania_app.views.sponsor import (
    sponsor_active,
    sponsor_admin_collection,
    sponsor_admin_detail,
)

urlpatterns = [
    path('sponsor/active/', sponsor_active, name='sponsor-active'),
    path('sponsor/admin/', sponsor_admin_collection, name='sponsor-admin-collection'),
    path('sponsor/admin/<int:sponsor_id>/', sponsor_admin_detail, name='sponsor-admin-detail'),
]
