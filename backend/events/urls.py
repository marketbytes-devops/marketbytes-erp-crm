from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CalendarEventViewSet, CommonCalendarView

router = DefaultRouter()
router.register(r'events', CalendarEventViewSet)
router.register(r'common-calendar', CommonCalendarView, basename='common-calendar')

urlpatterns = [
    path('', include(router.urls)),
]
