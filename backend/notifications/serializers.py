from rest_framework import serializers
from .models import NotificationPreference, Notification, Reminder


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.name', read_only=True)
    
    class Meta:
        model = NotificationPreference
        fields = [
            'id',
            'user',
            'user_email',
            'user_name',
            'email_enabled',
            'email_task_assigned',
            'email_task_due',
            'email_project_updates',
            'email_scrum_reminders',
            'email_leave_status',
            'inapp_enabled',
            'inapp_task_assigned',
            'inapp_task_due',
            'inapp_project_updates',
            'inapp_scrum_reminders',
            'inapp_leave_status',
            'task_reminder_before_hours',
            'scrum_reminder_time',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']


class NotificationSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    time_ago = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = [
            'id',
            'user',
            'user_email',
            'notification_type',
            'priority',
            'title',
            'message',
            'link_url',
            'link_text',
            'related_task_id',
            'related_project_id',
            'related_scrum_id',
            'is_read',
            'read_at',
            'created_at',
            'time_ago',
        ]
        read_only_fields = ['id', 'user', 'created_at', 'read_at']
    
    def get_time_ago(self, obj):
        from django.utils import timezone
        delta = timezone.now() - obj.created_at
        
        if delta.days > 0:
            return f"{delta.days}d ago"
        elif delta.seconds >= 3600:
            return f"{delta.seconds // 3600}h ago"
        elif delta.seconds >= 60:
            return f"{delta.seconds // 60}m ago"
        else:
            return "Just now"


class ReminderSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.name', read_only=True)
    
    class Meta:
        model = Reminder
        fields = [
            'id',
            'user',
            'user_email',
            'user_name',
            'reminder_type',
            'frequency',
            'title',
            'description',
            'scheduled_time',
            'last_sent',
            'related_task_id',
            'related_project_id',
            'is_active',
            'is_sent',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'user', 'last_sent', 'is_sent', 'created_at', 'updated_at']
