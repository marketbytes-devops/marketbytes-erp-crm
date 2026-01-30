from rest_framework import serializers
from .models import EmailLog

class EmailLogSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.get_full_name', read_only=True)
    sender_email = serializers.CharField(source='sender.email', read_only=True)

    class Meta:
        model = EmailLog
        fields = [
            'id', 'sender', 'sender_name', 'sender_email',
            'to_email', 'subject', 'body', 'sent_at', 'status', 'error_message'
        ]
        read_only_fields = ['id', 'sent_at', 'status', 'error_message', 'sender']