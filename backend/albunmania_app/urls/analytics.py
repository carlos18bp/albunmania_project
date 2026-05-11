from django.urls import path

from albunmania_app.views.analytics import analytics_export_csv, analytics_overview

urlpatterns = [
    path('admin/analytics/overview/', analytics_overview, name='admin-analytics-overview'),
    path('admin/analytics/export.csv', analytics_export_csv, name='admin-analytics-export-csv'),
]
