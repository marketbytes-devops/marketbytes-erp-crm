from django.db import models
from authapp.models import CustomUser

class CalendarEvent(models.Model):
    EVENT_TYPE_CHOICES = [
        ('meeting', 'Meeting'),
        ('event', 'Event'),
        ('other', 'Other'),
    ]

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    start_datetime = models.DateTimeField()
    end_datetime = models.DateTimeField()
    event_type = models.CharField(max_length=20, choices=EVENT_TYPE_CHOICES, default='event')
    created_by = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='created_events')
    participants = models.ManyToManyField(CustomUser, blank=True, related_name='participating_events')
    location = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} ({self.get_event_type_display()})"

    class Meta:
        ordering = ['start_datetime']
