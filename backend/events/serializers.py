from rest_framework import serializers
from .models import CalendarEvent
from authapp.models import CustomUser

class UserMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'name', 'email', 'image']

class CalendarEventSerializer(serializers.ModelSerializer):
    created_by_detail = UserMinimalSerializer(source='created_by', read_only=True)
    participants_detail = UserMinimalSerializer(source='participants', many=True, read_only=True)
    
    class Meta:
        model = CalendarEvent
        fields = [
            'id', 'title', 'description', 'start_datetime', 'end_datetime', 
            'event_type', 'created_by', 'created_by_detail', 'participants', 
            'participants_detail', 'location', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at']

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)
