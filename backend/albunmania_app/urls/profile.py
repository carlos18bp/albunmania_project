from django.urls import path

from albunmania_app.views.profile import profile_me, profile_onboarding, public_profile

urlpatterns = [
    path('profile/me/', profile_me, name='profile-me'),
    path('profile/me/onboarding/', profile_onboarding, name='profile-onboarding'),
    path('users/<int:user_id>/public-profile/', public_profile, name='user-public-profile'),
]
