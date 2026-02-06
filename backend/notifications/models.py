from django.db import models
from django.utils import timezone
from authapp.models import CustomUser


class NotificationPreference(models.Model):
    """
    User-specific notification preferences
    """
    user = models.OneToOneField(
        CustomUser, 
        on_delete=models.CASCADE, 
        related_name='notification_preference'
    )
    
    # Email Notifications
    email_enabled = models.BooleanField(default=True)
    email_task_assigned = models.BooleanField(default=True)
    email_task_due = models.BooleanField(default=True)
    email_project_updates = models.BooleanField(default=True)
    email_scrum_reminders = models.BooleanField(default=True)
    email_leave_status = models.BooleanField(default=True)
    
    # In-App Notifications
    inapp_enabled = models.BooleanField(default=True)
    inapp_task_assigned = models.BooleanField(default=True)
    inapp_task_due = models.BooleanField(default=True)
    inapp_project_updates = models.BooleanField(default=True)
    inapp_scrum_reminders = models.BooleanField(default=True)
    inapp_leave_status = models.BooleanField(default=True)
    
    # Reminder Settings
    task_reminder_before_hours = models.IntegerField(default=24, help_text="Hours before due date")
    scrum_reminder_time = models.TimeField(default="09:00:00", help_text="Daily scrum reminder time")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Notification Preference"
        verbose_name_plural = "Notification Preferences"
    
    def __str__(self):
        return f"Notification Preferences - {self.user.email}"


class Notification(models.Model):
    """
    Individual notification records
    """
    NOTIFICATION_TYPES = [
        ('task_assigned', 'Task Assigned'),
        ('task_due', 'Task Due Soon'),
        ('task_overdue', 'Task Overdue'),
        ('project_update', 'Project Update'),
        ('scrum_reminder', 'Scrum Reminder'),
        ('leave_approved', 'Leave Approved'),
        ('leave_rejected', 'Leave Rejected'),
        ('meeting_reminder', 'Meeting Reminder'),
        ('system', 'System Notification'),
    ]
    
    PRIORITY_LEVELS = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    
    user = models.ForeignKey(
        CustomUser, 
        on_delete=models.CASCADE, 
        related_name='notifications'
    )
    
    notification_type = models.CharField(max_length=50, choices=NOTIFICATION_TYPES)
    priority = models.CharField(max_length=20, choices=PRIORITY_LEVELS, default='medium')
    
    title = models.CharField(max_length=255)
    message = models.TextField()
    
    # Optional links
    link_url = models.CharField(max_length=500, blank=True, null=True)
    link_text = models.CharField(max_length=100, blank=True, null=True)
    
    # Related objects (generic)
    related_task_id = models.IntegerField(blank=True, null=True)
    related_project_id = models.IntegerField(blank=True, null=True)
    related_scrum_id = models.IntegerField(blank=True, null=True)
    
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = "Notification"
        verbose_name_plural = "Notifications"
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['user', 'is_read']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.title}"
    
    def mark_as_read(self):
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save()


class Reminder(models.Model):
    """
    Scheduled reminders for users
    """
    REMINDER_TYPES = [
        ('task_due', 'Task Due'),
        ('scrum_daily', 'Daily Scrum'),
        ('meeting', 'Meeting'),
        ('deadline', 'Deadline'),
        ('custom', 'Custom'),
    ]
    
    FREQUENCY_CHOICES = [
        ('once', 'Once'),
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
    ]
    
    user = models.ForeignKey(
        CustomUser, 
        on_delete=models.CASCADE, 
        related_name='reminders'
    )
    
    reminder_type = models.CharField(max_length=50, choices=REMINDER_TYPES)
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES, default='once')
    
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    
    scheduled_time = models.DateTimeField()
    last_sent = models.DateTimeField(blank=True, null=True)
    
    # Related objects
    related_task_id = models.IntegerField(blank=True, null=True)
    related_project_id = models.IntegerField(blank=True, null=True)
    
    is_active = models.BooleanField(default=True)
    is_sent = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['scheduled_time']
        verbose_name = "Reminder"
        verbose_name_plural = "Reminders"
        indexes = [
            models.Index(fields=['user', 'scheduled_time']),
            models.Index(fields=['is_active', 'is_sent']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.title} at {self.scheduled_time}"
