"""Review endpoints — create/edit/reply + public listing + report + admin moderation."""
from __future__ import annotations

from collections import Counter

from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from albunmania_app.models import (
    Profile, Review, ReviewReport, Trade, User,
)
from albunmania_app.serializers.review import (
    RatingSummarySerializer,
    ReviewCreateSerializer,
    ReviewEditSerializer,
    ReviewReplySerializer,
    ReviewReportCreateSerializer,
    ReviewReportSerializer,
    ReviewSerializer,
    ReviewVisibilityToggleSerializer,
)


def _is_admin(user) -> bool:
    role = getattr(user, 'role', None)
    return user.is_staff or role == 'admin'


def _trade_for_reviewer(trade_id: int, reviewer) -> Trade:
    trade = get_object_or_404(Trade.objects.select_related('match'), pk=trade_id)
    if reviewer.id not in trade.participant_ids:
        from rest_framework.exceptions import PermissionDenied
        raise PermissionDenied()
    return trade


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def trade_review_create(request, trade_id: int):
    """Reviewer creates their post-trade review."""
    trade = _trade_for_reviewer(trade_id, request.user)
    other_id = trade.match.user_b_id if trade.match.user_a_id == request.user.id else trade.match.user_a_id

    serializer = ReviewCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    if Review.objects.filter(trade=trade, reviewer=request.user).exists():
        return Response({'error': 'already_reviewed'}, status=status.HTTP_409_CONFLICT)

    review = Review.objects.create(
        trade=trade,
        reviewer=request.user,
        reviewee_id=other_id,
        stars=serializer.validated_data['stars'],
        comment=serializer.validated_data.get('comment', ''),
        tags=serializer.validated_data.get('tags', []),
    )
    return Response(ReviewSerializer(review).data, status=status.HTTP_201_CREATED)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def review_edit(request, review_id: int):
    """Reviewer edits within the 24h window."""
    review = get_object_or_404(Review, pk=review_id)
    if review.reviewer_id != request.user.id:
        return Response({'error': 'not_reviewer'}, status=status.HTTP_403_FORBIDDEN)
    if not review.is_editable:
        return Response({'error': 'edit_window_closed'}, status=status.HTTP_403_FORBIDDEN)

    serializer = ReviewEditSerializer(data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    for field in ('stars', 'comment', 'tags'):
        if field in serializer.validated_data:
            setattr(review, field, serializer.validated_data[field])
    review.save()
    return Response(ReviewSerializer(review).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def review_reply(request, review_id: int):
    """Reviewee posts a single public reply."""
    review = get_object_or_404(Review, pk=review_id)
    if review.reviewee_id != request.user.id:
        return Response({'error': 'not_reviewee'}, status=status.HTTP_403_FORBIDDEN)
    if review.reply:
        return Response({'error': 'already_replied'}, status=status.HTTP_409_CONFLICT)

    serializer = ReviewReplySerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    review.reply = serializer.validated_data['reply']
    review.replied_at = timezone.now()
    review.save(update_fields=['reply', 'replied_at', 'updated_at'])
    return Response(ReviewSerializer(review).data)


@api_view(['GET'])
@permission_classes([AllowAny])
def user_reviews_list(request, user_id: int):
    """Public list of visible reviews received by `user_id`.

    Query params:
      stars=4 (optional, filter exact)
      page=1 (default), page_size=20 (max 100)
    """
    qs = Review.objects.filter(reviewee_id=user_id, is_visible=True).order_by('-created_at')
    stars = request.query_params.get('stars')
    if stars and stars.isdigit():
        qs = qs.filter(stars=int(stars))

    try:
        page = max(1, int(request.query_params.get('page', 1)))
        page_size = max(1, min(int(request.query_params.get('page_size', 20)), 100))
    except (TypeError, ValueError):
        return Response({'error': 'invalid_pagination'}, status=status.HTTP_400_BAD_REQUEST)

    total = qs.count()
    items = qs[(page - 1) * page_size: page * page_size]
    return Response({
        'results': ReviewSerializer(items, many=True).data,
        'page': page, 'page_size': page_size, 'total': total,
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def user_rating_summary(request, user_id: int):
    """Aggregated reputation block for the Profile reviews tab."""
    profile = Profile.objects.filter(user_id=user_id).first()
    if not profile:
        return Response({'error': 'user_not_found'}, status=status.HTTP_404_NOT_FOUND)

    qs = Review.objects.filter(reviewee_id=user_id, is_visible=True)
    distribution = {str(i): 0 for i in range(1, 6)}
    for row in qs.values('stars').annotate(c=Count('id')):
        distribution[str(row['stars'])] = row['c']

    tag_counter: Counter[str] = Counter()
    for r in qs.values_list('tags', flat=True):
        for tag in (r or []):
            tag_counter[tag] += 1
    top_tags = [{'tag': t, 'count': c} for t, c in tag_counter.most_common(5)]

    return Response(RatingSummarySerializer({
        'user_id': user_id,
        'rating_avg': profile.rating_avg,
        'rating_count': profile.rating_count,
        'positive_pct': profile.positive_pct,
        'distribution': distribution,
        'top_tags': top_tags,
    }).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def review_report(request, review_id: int):
    """Anyone authenticated can flag a review for moderation."""
    review = get_object_or_404(Review, pk=review_id)
    serializer = ReviewReportCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    report, created = ReviewReport.objects.get_or_create(
        review=review, reporter=request.user,
        defaults={'reason': serializer.validated_data['reason']},
    )
    return Response(
        ReviewReportSerializer(report).data,
        status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_review_reports(request):
    """Moderation queue: pending reports first."""
    if not _is_admin(request.user):
        return Response({'error': 'forbidden'}, status=status.HTTP_403_FORBIDDEN)
    qs = ReviewReport.objects.select_related('review', 'reporter').order_by(
        '-created_at',
    )
    status_filter = request.query_params.get('status')
    if status_filter:
        qs = qs.filter(status=status_filter)
    return Response({'results': ReviewReportSerializer(qs[:200], many=True).data})


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def admin_review_visibility(request, review_id: int):
    """Toggle a review's visibility and (optionally) resolve any pending reports.

    Body: `{is_visible: bool, resolution_notes?: str}`.
    """
    if not _is_admin(request.user):
        return Response({'error': 'forbidden'}, status=status.HTTP_403_FORBIDDEN)

    review = get_object_or_404(Review, pk=review_id)
    serializer = ReviewVisibilityToggleSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    review.is_visible = serializer.validated_data['is_visible']
    review.save(update_fields=['is_visible', 'updated_at'])

    notes = serializer.validated_data.get('resolution_notes', '')
    ReviewReport.objects.filter(review=review, status=ReviewReport.Status.PENDING).update(
        status=ReviewReport.Status.ACTIONED,
        resolved_by=request.user,
        resolved_at=timezone.now(),
        resolution_notes=notes,
    )
    return Response(ReviewSerializer(review).data)
