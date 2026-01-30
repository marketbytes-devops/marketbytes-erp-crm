from django.urls import path
from . import views

app_name = 'gmail'

urlpatterns = [
    # Main connect endpoint - returns auth URL for frontend to redirect
    path('connect/', views.connect_gmail, name='connect_gmail'),
    
    # OAuth callback - Google redirects here after user approves
    path('callback/', views.gmail_callback, name='gmail_callback'),
    
    # Status check - tells frontend if user is connected
    path('status/', views.gmail_status, name='gmail_status'),

    # Fetch sent emails
    path('sent-emails/', views.get_sent_emails, name='get_sent_emails'),
    
    # Disconnect Gmail
    path('disconnect/', views.disconnect_gmail, name='disconnect_gmail'),
    
    # Send email endpoint
    path('send/', views.send_gmail_email, name='send_gmail_email'),
]