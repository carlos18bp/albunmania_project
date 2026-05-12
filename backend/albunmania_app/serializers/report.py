"""Report serializers — general moderation reports (user / trade)."""
from rest_framework import serializers

from albunmania_app.models import Report


class ReportSerializer(serializers.ModelSerializer):
    reporter_email = serializers.CharField(source='reporter.email', read_only=True)
    resolved_by_email = serializers.CharField(source='resolved_by.email', read_only=True, default=None)

    class Meta:
        model = Report
        fields = [
            'id', 'reporter', 'reporter_email',
            'target_kind', 'target_user', 'target_trade',
            'reason', 'detail', 'status',
            'resolved_by', 'resolved_by_email', 'resolved_at', 'resolution_notes',
            'created_at',
        ]
        read_only_fields = fields


class ReportCreateSerializer(serializers.Serializer):
    """Body for POST /reports/ — `{target_kind, target_id, reason, detail}`."""

    target_kind = serializers.ChoiceField(choices=Report.TargetKind.choices)
    target_id = serializers.IntegerField(min_value=1)
    reason = serializers.ChoiceField(choices=Report.Reason.choices)
    detail = serializers.CharField(max_length=500, required=False, allow_blank=True, default='')


class ReportResolveSerializer(serializers.Serializer):
    """Body for PATCH /admin/reports/<id>/ — `{status, resolution_notes}`."""

    status = serializers.ChoiceField(choices=[Report.Status.DISMISSED, Report.Status.ACTIONED])
    resolution_notes = serializers.CharField(max_length=2000, required=False, allow_blank=True, default='')
