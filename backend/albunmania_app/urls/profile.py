from django.urls import path

from albunmania_app.views.profile import profile_me, profile_onboarding

urlpatterns = [
    path('profile/me/', profile_me, name='profile-me'),
    path('profile/me/onboarding/', profile_onboarding, name='profile-onboarding'),
]
