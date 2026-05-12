from django.urls import path

from albunmania_app.views.presence import presence_active_count, presence_ping

urlpatterns = [
    path('presence/ping/', presence_ping, name='presence-ping'),
    path('presence/active-count/', presence_active_count, name='presence-active-count'),
]
