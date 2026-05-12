from django.urls import path

from albunmania_app.views.push import push_public_key, push_subscribe, push_unsubscribe

urlpatterns = [
    path('push/public-key/', push_public_key, name='push-public-key'),
    path('push/subscribe/', push_subscribe, name='push-subscribe'),
    path('push/unsubscribe/', push_unsubscribe, name='push-unsubscribe'),
]
