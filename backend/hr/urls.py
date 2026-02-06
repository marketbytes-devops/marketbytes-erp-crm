from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import *

router = DefaultRouter()
router.register(r'attendance', AttendanceViewSet)
router.register(r'holidays', HolidayViewSet)
router.register(r'leave-types', LeaveTypeViewSet)
router.register(r'leaves', LeaveViewSet)
router.register(r'overtime', OvertimeViewSet)
router.register(r'candidates', CandidateViewSet)
router.register(r'performance', PerformanceViewSet)
router.register(r'timer', TimerViewSet, basename='timer')
router.register(r'work-sessions', WorkSessionViewSet)


urlpatterns = [
    path('', include(router.urls)),
]