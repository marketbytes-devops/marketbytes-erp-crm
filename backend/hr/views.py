from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Q
from .models import (
    Attendance, Holiday, LeaveType, Leave,
    Overtime, Candidate, Performance
)
from .serializers import *

class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.all().select_related('employee')
    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser or user.role.name == "Superadmin":
            return self.queryset
        return self.queryset.filter(employee=user)

    @action(detail=False, methods=['post'])
    def check_in_out(self, request):
        serializer = AttendanceCheckInOutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        today = timezone.now().date()
        attendance, created = Attendance.objects.get_or_create(
            employee=request.user, date=today,
            defaults={'status': 'present', 'working_from': 'Office'}
        )

        action = serializer.validated_data['action']
        ip = request.META.get('REMOTE_ADDR')

        if action == 'in':
            if attendance.clock_in:
                return Response({"error": "Already checked in"}, status=400)
            attendance.clock_in = timezone.now().time()
            attendance.clock_in_ip = ip
            attendance.working_from = serializer.validated_data.get('working_from', 'Office')
            attendance.status = 'present'
            attendance.save()
            return Response({"message": "Checked in successfully", "time": attendance.clock_in})

        if action == 'out':
            if not attendance.clock_in:
                return Response({"error": "Not checked in yet"}, status=400)
            if attendance.clock_out:
                return Response({"error": "Already checked out"}, status=400)
            attendance.clock_out = timezone.now().time()
            attendance.clock_out_ip = ip
            attendance.save()
            return Response({"message": "Checked out successfully", "time": attendance.clock_out})

    @action(detail=False, methods=['get'])
    def status(self, request):
        today = timezone.now().date()
        att = Attendance.objects.filter(employee=request.user, date=today).first()
        if att and att.clock_in and not att.clock_out:
            return Response({
                "checked_in": True,
                "clock_in": att.clock_in.strftime("%H:%M"),
                "message": "You are checked in"
            })
        return Response({"checked_in": False})

class HolidayViewSet(viewsets.ModelViewSet):
    queryset = Holiday.objects.all()
    serializer_class = HolidaySerializer
    permission_classes = [IsAuthenticated]

class LeaveTypeViewSet(viewsets.ModelViewSet):
    queryset = LeaveType.objects.all()
    serializer_class = LeaveTypeSerializer
    permission_classes = [IsAuthenticated]

class LeaveViewSet(viewsets.ModelViewSet):
    queryset = Leave.objects.all().select_related('employee', 'leave_type', 'approved_by')
    serializer_class = LeaveSerializer
    permission_classes = [IsAuthenticated]

class OvertimeViewSet(viewsets.ModelViewSet):
    queryset = Overtime.objects.all().select_related('employee')
    serializer_class = OvertimeSerializer
    permission_classes = [IsAuthenticated]

class CandidateViewSet(viewsets.ModelViewSet):
    queryset = Candidate.objects.all().select_related('department')
    serializer_class = CandidateSerializer
    permission_classes = [IsAuthenticated]

class PerformanceViewSet(viewsets.ModelViewSet):
    queryset = Performance.objects.all().select_related('employee', 'department', 'reviewed_by')
    serializer_class = PerformanceSerializer
    permission_classes = [IsAuthenticated]