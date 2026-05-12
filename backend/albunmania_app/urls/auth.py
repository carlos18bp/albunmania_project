from django.urls import path

from albunmania_app.views import auth

urlpatterns = [
    path('google_login/', auth.google_login, name='google_login'),
    path('validate_token/', auth.validate_token, name='validate_token'),
]
