from django.urls import path, include
from rest_framework.routers import DefaultRouter
from hr import views

router = DefaultRouter()
router.register(r'attendance', views.AttendanceViewSet)
router.register(r'holidays', views.HolidayViewSet)
router.register(r'leave-types', views.LeaveTypeViewSet)
router.register(r'leaves', views.LeaveViewSet)
router.register(r'overtime', views.OvertimeViewSet)
router.register(r'candidates', views.CandidateViewSet)
router.register(r'performance', views.PerformanceViewSet)
router.register(r'timer', views.TimerViewSet, basename='timer')
router.register(r'work-sessions', views.WorkSessionViewSet)


urlpatterns = [
    path('', include(router.urls)),
]