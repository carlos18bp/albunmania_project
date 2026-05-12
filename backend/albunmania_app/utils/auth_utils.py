"""Authentication utility functions."""
from rest_framework_simplejwt.tokens import RefreshToken


def generate_auth_tokens(user):
    """
    Generate JWT tokens for a user.

    :param user: User instance
    :return: Dictionary with refresh, access tokens and user data
    """
    refresh = RefreshToken.for_user(user)

    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
        'user': {
            'id': user.id,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': user.role,
            'is_staff': user.is_staff,
        }
    }
