from django.urls import path

from albunmania_app.views.geo import geo_ip_locate

urlpatterns = [
    path('geo/ip-locate/', geo_ip_locate, name='geo-ip-locate'),
]
