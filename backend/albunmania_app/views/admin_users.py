"""Admin endpoints for user management (Epic 8).

These complement the per-domain admin endpoints already wired by Epics
5 (merchants), 6 (sponsor) and 7 (ads). The Web Manager + Admin can:
  - List/search users
  - Assign one of the 4 roles
  - Block or unblock an account (toggles `is_active`)
"""
from __future__ import annotations

import logging

from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from albunmania_app.models import User
from albunmania_app.utils.auth_utils import generate_auth_tokens

logger = logging.getLogger(__name__)


def _is_admin_or_wm(user) -> bool:
    role = getattr(user, 'role', None)
    return user.is_staff or role in ('admin', 'web_manager')


def _user_payload(u: User) -> dict:
    return {
        'id': u.id,
        'email': u.email,
        'first_name': u.first_name,
        'last_name': u.last_name,
        'role': u.role,
        'is_active': u.is_active,
        'is_staff': u.is_staff,
        'date_joined': u.date_joined.isoformat() if u.date_joined else None,
        'last_login': u.last_login.isoformat() if u.last_login else None,
    }


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_users_list(request):
    """Paginated user list with optional search and role filter.

    Query params:
      q — substring match on email/first/last name (icontains)
      role — exact match (collector|merchant|web_manager|admin)
      page=1, page_size=25 (max 100)
    """
    if not _is_admin_or_wm(request.user):
        return Response({'error': 'forbidden'}, status=status.HTTP_403_FORBIDDEN)

    qs = User.objects.all().order_by('-date_joined')
    q = (request.query_params.get('q') or '').strip()
    if q:
        qs = qs.filter(
            Q(email__icontains=q) | Q(first_name__icontains=q) | Q(last_name__icontains=q)
        )
    role = request.query_params.get('role')
    if role:
        qs = qs.filter(role=role)

    try:
        page = max(1, int(request.query_params.get('page', 1)))
        page_size = max(1, min(int(request.query_params.get('page_size', 25)), 100))
    except (TypeError, ValueError):
        return Response({'error': 'invalid_pagination'}, status=status.HTTP_400_BAD_REQUEST)

    total = qs.count()
    page_qs = qs[(page - 1) * page_size: page * page_size]
    return Response({
        'results': [_user_payload(u) for u in page_qs],
        'page': page, 'page_size': page_size, 'total': total,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_user_assign_role(request, user_id: int):
    """Assign one of the 4 roles to a user.

    Body: `{role: 'collector'|'merchant'|'web_manager'|'admin'}`.
    """
    if not _is_admin_or_wm(request.user):
        return Response({'error': 'forbidden'}, status=status.HTTP_403_FORBIDDEN)

    role = (request.data or {}).get('role')
    valid_roles = {choice.value: choice for choice in User.Role}
    if role not in valid_roles:
        return Response({'error': 'invalid_role'}, status=status.HTTP_400_BAD_REQUEST)

    target = get_object_or_404(User, pk=user_id)
    target.assign_role(valid_roles[role])
    return Response(_user_payload(target))


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_user_set_active(request, user_id: int):
    """Block or unblock a user account.

    Body: `{is_active: bool}`. Web Managers cannot block other admins.
    """
    if not _is_admin_or_wm(request.user):
        return Response({'error': 'forbidden'}, status=status.HTTP_403_FORBIDDEN)

    target = get_object_or_404(User, pk=user_id)
    if target.role == 'admin' and not request.user.is_staff and request.user.role != 'admin':
        return Response({'error': 'cannot_block_admin'}, status=status.HTTP_403_FORBIDDEN)
    if target.id == request.user.id:
        return Response({'error': 'cannot_block_self'}, status=status.HTTP_400_BAD_REQUEST)

    is_active = (request.data or {}).get('is_active')
    if not isinstance(is_active, bool):
        return Response({'error': 'is_active_must_be_bool'}, status=status.HTTP_400_BAD_REQUEST)

    target.is_active = is_active
    target.save(update_fields=['is_active'])
    return Response(_user_payload(target))


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_user_login_as(request, user_id: int):
    """Issue a fresh JWT pair for `user_id` so an admin/web_manager can
    impersonate that account from the panel UI.

    Safety:
      - request.user must be admin/web_manager (or `is_staff`).
      - Cannot impersonate self (no-op + protects audit clarity).
      - Cannot impersonate inactive users (matches /sign-in semantics).
      - Cannot impersonate superusers (no privilege escalation).
    Logging only — no DB audit trail in V1.
    """
    if not _is_admin_or_wm(request.user):
        return Response({'error': 'forbidden'}, status=status.HTTP_403_FORBIDDEN)

    target = get_object_or_404(User, pk=user_id)
    if target.id == request.user.id:
        return Response({'error': 'cannot_login_as_self'}, status=status.HTTP_400_BAD_REQUEST)
    if not target.is_active:
        return Response({'error': 'target_inactive'}, status=status.HTTP_400_BAD_REQUEST)
    if target.is_superuser:
        return Response({'error': 'target_is_superuser'}, status=status.HTTP_400_BAD_REQUEST)

    logger.info(
        'impersonation: %s (id=%s, role=%s) logged in as %s (id=%s, role=%s)',
        request.user.email, request.user.id, request.user.role,
        target.email, target.id, target.role,
    )
    return Response(generate_auth_tokens(target))
