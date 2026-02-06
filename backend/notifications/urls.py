from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import NotificationPreferenceViewSet, NotificationViewSet, ReminderViewSet

router = DefaultRouter()
router.register(r'preferences', NotificationPreferenceViewSet, basename='notification-preference')
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'reminders', ReminderViewSet, basename='reminder')

urlpatterns = [
    path('', include(router.urls)),
]
