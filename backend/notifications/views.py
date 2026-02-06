from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from django.utils import timezone
from django.db.models import Q

from .models import NotificationPreference, Notification, Reminder
from .serializers import (
    NotificationPreferenceSerializer,
    NotificationSerializer,
    ReminderSerializer
)


class NotificationPreferenceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing user notification preferences
    """
    queryset = NotificationPreference.objects.all()
    serializer_class = NotificationPreferenceSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_superuser or user.is_staff:
            return NotificationPreference.objects.all()
        return NotificationPreference.objects.filter(user=user)
    
    @action(detail=False, methods=['get'])
    def my_preferences(self, request):
        """Get current user's notification preferences"""
        preference, created = NotificationPreference.objects.get_or_create(
            user=request.user
        )
        serializer = self.get_serializer(preference)
        return Response(serializer.data)
    
    @action(detail=False, methods=['patch'])
    def update_my_preferences(self, request):
        """Update current user's notification preferences"""
        preference, created = NotificationPreference.objects.get_or_create(
            user=request.user
        )
        serializer = self.get_serializer(
            preference, 
            data=request.data, 
            partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class NotificationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing user notifications
    """
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['notification_type', 'priority', 'is_read']
    search_fields = ['title', 'message']
    ordering_fields = ['created_at', 'priority']
    ordering = ['-created_at']
    
    def get_queryset(self):
        user = self.request.user
        if user.is_superuser or user.is_staff:
            user_id = self.request.query_params.get('user_id')
            if user_id:
                return Notification.objects.filter(user_id=user_id)
            return Notification.objects.all()
        return Notification.objects.filter(user=user)
    
    @action(detail=False, methods=['get'])
    def my_notifications(self, request):
        """Get current user's notifications"""
        notifications = Notification.objects.filter(user=request.user)
        
        # Filter by read status if provided
        is_read = request.query_params.get('is_read')
        if is_read is not None:
            notifications = notifications.filter(is_read=is_read.lower() == 'true')
        
        serializer = self.get_serializer(notifications, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Get count of unread notifications"""
        count = Notification.objects.filter(
            user=request.user, 
            is_read=False
        ).count()
        return Response({'unread_count': count})
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark a notification as read"""
        notification = self.get_object()
        notification.mark_as_read()
        serializer = self.get_serializer(notification)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """Mark all notifications as read for current user"""
        updated = Notification.objects.filter(
            user=request.user, 
            is_read=False
        ).update(
            is_read=True, 
            read_at=timezone.now()
        )
        return Response({
            'message': f'{updated} notifications marked as read',
            'count': updated
        })
    
    @action(detail=False, methods=['delete'])
    def clear_all(self, request):
        """Delete all read notifications for current user"""
        deleted_count, _ = Notification.objects.filter(
            user=request.user, 
            is_read=True
        ).delete()
        return Response({
            'message': f'{deleted_count} notifications deleted',
            'count': deleted_count
        })


class ReminderViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing user reminders
    """
    queryset = Reminder.objects.all()
    serializer_class = ReminderSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['reminder_type', 'frequency', 'is_active', 'is_sent']
    search_fields = ['title', 'description']
    ordering_fields = ['scheduled_time', 'created_at']
    ordering = ['scheduled_time']
    
    def get_queryset(self):
        user = self.request.user
        if user.is_superuser or user.is_staff:
            user_id = self.request.query_params.get('user_id')
            if user_id:
                return Reminder.objects.filter(user_id=user_id)
            return Reminder.objects.all()
        return Reminder.objects.filter(user=user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def my_reminders(self, request):
        """Get current user's active reminders"""
        reminders = Reminder.objects.filter(
            user=request.user,
            is_active=True
        )
        serializer = self.get_serializer(reminders, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """Get upcoming reminders for current user"""
        now = timezone.now()
        upcoming_reminders = Reminder.objects.filter(
            user=request.user,
            is_active=True,
            scheduled_time__gte=now,
            scheduled_time__lte=now + timezone.timedelta(days=7)
        )
        serializer = self.get_serializer(upcoming_reminders, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def snooze(self, request, pk=None):
        """Snooze a reminder by specified minutes"""
        reminder = self.get_object()
        minutes = int(request.data.get('minutes', 30))
        
        reminder.scheduled_time = timezone.now() + timezone.timedelta(minutes=minutes)
        reminder.save()
        
        serializer = self.get_serializer(reminder)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """Deactivate a reminder"""
        reminder = self.get_object()
        reminder.is_active = False
        reminder.save()
        
        serializer = self.get_serializer(reminder)
        return Response(serializer.data)
