from django.urls import path

from albunmania_app.views.report import admin_report_list, admin_report_resolve, report_create

urlpatterns = [
    path('reports/', report_create, name='report-create'),
    path('admin/reports/', admin_report_list, name='admin-report-list'),
    path('admin/reports/<int:report_id>/', admin_report_resolve, name='admin-report-resolve'),
]
