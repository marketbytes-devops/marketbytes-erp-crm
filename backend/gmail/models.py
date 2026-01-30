# gmail/models.py
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class EmailLog(models.Model):
    sender = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    to_email = models.EmailField()
    subject = models.CharField(max_length=255)
    body = models.TextField()
    sent_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=50, default="Sent")  # Sent, Failed, etc.
    error_message = models.TextField(blank=True, null=True)
    gmail_access_token = models.CharField(max_length=512, blank=True, null=True)
    gmail_refresh_token = models.CharField(max_length=512, blank=True, null=True)
    gmail_token_expiry = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ['-sent_at']

    def __str__(self):
        return f"{self.subject} to {self.to_email}"