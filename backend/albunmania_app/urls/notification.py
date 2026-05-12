from django.urls import path

from albunmania_app.views.notification import (
    notification_list,
    notification_mark_all_read,
    notification_mark_read,
    notification_unread_count,
)

urlpatterns = [
    path('notifications/', notification_list, name='notification-list'),
    path('notifications/unread-count/', notification_unread_count, name='notification-unread-count'),
    path('notifications/read-all/', notification_mark_all_read, name='notification-read-all'),
    path('notifications/<int:notification_id>/read/', notification_mark_read, name='notification-mark-read'),
]
