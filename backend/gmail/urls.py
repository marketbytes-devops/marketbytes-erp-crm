from django.urls import path
from . import views

urlpatterns = [
    path('connect/', views.gmail_connect),
    path('callback/', views.gmail_callback),
    path('status/', views.gmail_status),
    path('sent-emails/', views.gmail_sent_emails),
    path('send/', views.gmail_send),
    path('disconnect/', views.gmail_disconnect),
]