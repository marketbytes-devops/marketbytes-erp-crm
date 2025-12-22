from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from datetime import timedelta, datetime, time
from .models import Attendance, Holiday, LeaveType, Leave, Overtime, Candidate, Performance, Project, WorkSession, BreakSession
from .serializers import *
from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend

class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.all().select_related('employee')
    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        queryset = self.queryset
        
        month = self.request.query_params.get('month')
        year = self.request.query_params.get('year')
        
        if month and year:
            queryset = queryset.filter(date__month=month, date__year=year)
        
        if user.is_superuser or (getattr(user, 'role', None) and user.role.name == "Superadmin"):
            return queryset
        return queryset.filter(employee=user)
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get attendance summary for the current month"""
        month = request.query_params.get('month', timezone.now().month)
        year = request.query_params.get('year', timezone.now().year)
        
        attendances = Attendance.objects.filter(
            date__month=month,
            date__year=year
        )
        
        summary = {
            'present': 0,
            'late': 0,
            'absent': 0,
            'half_day': 0,
            'leave': 0,
            'holiday': 0
        }
        
        all_employees = CustomUser.objects.filter(status='active')
        
        from calendar import monthrange
        days_in_month = monthrange(int(year), int(month))[1]
        
        for day in range(1, days_in_month + 1):
            current_date = datetime(int(year), int(month), day).date()
            
            if current_date > timezone.now().date():
                continue
            
            for employee in all_employees:
                attendance = attendances.filter(employee=employee, date=current_date).first()
                
                if attendance:
                    if attendance.status == 'present':
                        summary['present'] += 1
                    elif attendance.status == 'late':
                        summary['late'] += 1
                    elif attendance.status == 'half_day':
                        summary['half_day'] += 1
                    elif attendance.status == 'leave':
                        summary['leave'] += 1
                    elif attendance.status == 'holiday':
                        summary['holiday'] += 1
                    elif attendance.status == 'absent':
                        summary['absent'] += 1
                else:
                    summary['absent'] += 1
        
        return Response(summary)
    
    @action(detail=False, methods=['post'])
    def check_in_out(self, request):
        serializer = AttendanceCheckInOutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        today = timezone.now().date()
        action = serializer.validated_data['action']
        ip = request.META.get('REMOTE_ADDR', '0.0.0.0')
        current_time = timezone.now().time()
        
        attendance, created = Attendance.objects.get_or_create(
            employee=request.user,
            date=today,
            defaults={
                'status': 'present',
                'working_from': serializer.validated_data.get('working_from', 'Office')
            }
        )
        
        if action == 'in':
            if attendance.clock_in and attendance.clock_out:
                attendance.clock_in = current_time
                attendance.clock_out = None
                attendance.clock_in_ip = ip
                attendance.status = self._calculate_status(current_time)
                attendance.save()
                return Response({
                    "message": "Re-checked in successfully!",
                    "time": attendance.clock_in.strftime("%H:%M"),
                    "status": attendance.status
                })
            
            elif attendance.clock_in:
                attendance.clock_in = current_time
                attendance.clock_in_ip = ip
                attendance.status = self._calculate_status(current_time)
                attendance.save()
                return Response({
                    "message": "Welcome back! Check-in time updated.",
                    "time": attendance.clock_in.strftime("%H:%M"),
                    "status": attendance.status
                })
                
            else:
                attendance.clock_in = current_time
                attendance.clock_in_ip = ip
                attendance.working_from = serializer.validated_data.get('working_from', 'Office')
                attendance.status = self._calculate_status(current_time)
                attendance.is_late = current_time > time(9, 30)
                attendance.is_half_day = current_time >= time(13, 0)
                attendance.save()
                return Response({
                    "message": "Checked in successfully",
                    "time": attendance.clock_in.strftime("%H:%M"),
                    "status": attendance.status
                })
        
        elif action == 'out':
            if not attendance.clock_in:
                return Response({"error": "You haven't checked in today"}, status=400)
            
            if attendance.clock_out:
                return Response({"error": "You have already checked out today"}, status=400)
            
            attendance.clock_out = current_time
            attendance.clock_out_ip = ip
            attendance.save()
            
            return Response({
                "message": "Checked out successfully",
                "time": attendance.clock_out.strftime("%H:%M")
            })
    
    def _calculate_status(self, check_in_time):
        """Calculate attendance status based on check-in time"""
        if check_in_time >= time(13, 0):
            return 'half_day'
        elif check_in_time > time(9, 30):
            return 'late'
        else:
            return 'present'
    
    @action(detail=False, methods=['get'])
    def status(self, request):
        today = timezone.now().date()
        att = Attendance.objects.filter(employee=request.user, date=today).first()
        
        work_sessions = WorkSession.objects.filter(
            employee=request.user,
            start_time__date=today,
            end_time__isnull=False
        )
        total_seconds = sum(
            (session.end_time - session.start_time).total_seconds()
            for session in work_sessions
        )
        productive_hours = str(timedelta(seconds=int(total_seconds)))
        
        if att and att.clock_in and not att.clock_out:
            return Response({
                "checked_in": True,
                "clock_in": att.clock_in.strftime("%H:%M"),
                "clock_out": None,
                "productive_hours": productive_hours,
                "status": att.status,
                "message": "You are checked in"
            })
        
        message = "Checked out today" if att and att.clock_out else "Not checked in today"
        return Response({
            "checked_in": False,
            "clock_in": att.clock_in.strftime("%H:%M") if att and att.clock_in else None,
            "clock_out": att.clock_out.strftime("%H:%M") if att and att.clock_out else None,
            "productive_hours": productive_hours,
            "status": att.status if att else "absent",
            "message": message
        })

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
    
    def get_queryset(self):
        user = self.request.user
        queryset = self.queryset
        
        month = self.request.query_params.get('month')
        year = self.request.query_params.get('year')
        
        if month and year:
            queryset = queryset.filter(date__month=month, date__year=year)
        
        if user.is_superuser or (getattr(user, 'role', None) and user.role.name == "Superadmin"):
            return queryset
        return queryset.filter(employee=user)
    
    @action(detail=False, methods=['post'])
    def calculate_from_sessions(self, request):
        """Calculate overtime based on productive hours > 8 hours"""
        date_str = request.data.get('date')
        employee_id = request.data.get('employee_id')
        
        if not date_str:
            return Response({"error": "Date is required"}, status=400)
        
        target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        
        if employee_id and (request.user.is_superuser or 
                           (getattr(request.user, 'role', None) and request.user.role.name == "Superadmin")):
            employee = CustomUser.objects.get(id=employee_id)
        else:
            employee = request.user
        
        work_sessions = WorkSession.objects.filter(
            employee=employee,
            start_time__date=target_date,
            end_time__isnull=False
        )
        
        total_seconds = sum(
            (session.end_time - session.start_time).total_seconds()
            for session in work_sessions
        )
        
        productive_hours = total_seconds / 3600
        
        if productive_hours > 8:
            overtime_hours = productive_hours - 8
            
            projects = list(set([ws.project.name for ws in work_sessions if ws.project]))
            tasks = list(set([ws.task.name for ws in work_sessions if ws.task]))
            
            effort = f"Projects: {', '.join(projects) if projects else 'N/A'}\n"
            effort += f"Tasks: {', '.join(tasks) if tasks else 'N/A'}"
            
            overtime, created = Overtime.objects.update_or_create(
                employee=employee,
                date=target_date,
                defaults={
                    'hours': round(overtime_hours, 2),
                    'project': projects[0] if projects else 'Multiple Projects',
                    'effort': effort
                }
            )
            
            return Response({
                "message": "Overtime calculated successfully",
                "data": OvertimeSerializer(overtime).data
            })
        else:
            return Response({
                "message": "No overtime. Productive hours less than 8 hours.",
                "productive_hours": round(productive_hours, 2)
            })


from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Candidate
from .serializers import CandidateSerializer

class CandidateViewSet(viewsets.ModelViewSet):
    queryset = Candidate.objects.all().select_related('department')
    serializer_class = CandidateSerializer
    permission_classes = [IsAuthenticated]

    # Add search and filter capabilities
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    # Search by name, email, mobile
    search_fields = ['name', 'email', 'mobile', 'designation']

    # Filter by exact fields
    filterset_fields = {
        'status': ['exact'],
        'round': ['exact', 'gte', 'lte'],
        'department': ['exact'],
        'offered': ['exact'],
        'gender': ['exact'],
        'created_at': ['gte', 'lte', 'date'],
    }

    # Default ordering
    ordering_fields = ['created_at', 'name', 'round']
    ordering = ['-created_at']
class PerformanceViewSet(viewsets.ModelViewSet):
    queryset = Performance.objects.all().select_related('employee', 'department', 'reviewed_by')
    serializer_class = PerformanceSerializer
    permission_classes = [IsAuthenticated]

class TimerViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def status(self, request):
        user = request.user
        active_work = WorkSession.objects.filter(employee=user, end_time__isnull=True).first()
        active_break = BreakSession.objects.filter(employee=user, end_time__isnull=True).first()
        
        today = timezone.now().date()
        sessions = WorkSession.objects.filter(employee=user, start_time__date=today, end_time__isnull=False)
        total_seconds = sum((s.end_time - s.start_time).total_seconds() for s in sessions if s.end_time)
        total_work = str(timedelta(seconds=int(total_seconds))) if total_seconds > 0 else "00:00:00"
        
        break_sessions = BreakSession.objects.filter(employee=user, start_time__date=today, end_time__isnull=False)
        break_seconds = sum((b.end_time - b.start_time).total_seconds() for b in break_sessions if b.end_time)
        total_break = str(timedelta(seconds=int(break_seconds))) if break_seconds > 0 else "00:00:00"
        
        return Response({
            "is_working": bool(active_work),
            "is_on_break": bool(active_break),
            "current_work_session": WorkSessionSerializer(active_work).data if active_work else None,
            "current_break_session": BreakSessionSerializer(active_break).data if active_break else None,
            "today_total_work": total_work,
            "today_total_break": total_break,
            "target_hours": "08:00:00",
            "remaining_hours": str(timedelta(seconds=max(0, 28800 - int(total_seconds))))
        })
    
    @action(detail=False, methods=['post'])
    def start_work(self, request):
        project_id = request.data.get('project')
        task_id = request.data.get('task')
        memo = request.data.get('memo', '')
        
        WorkSession.objects.filter(employee=request.user, end_time__isnull=True).update(end_time=timezone.now())
        
        BreakSession.objects.filter(employee=request.user, end_time__isnull=True).update(end_time=timezone.now())
        
        session = WorkSession.objects.create(
            employee=request.user,
            project_id=project_id,
            task_id=task_id,
            memo=memo,
            start_time=timezone.now()
        )
        return Response(WorkSessionSerializer(session).data, status=201)
    
    @action(detail=False, methods=['post'])
    def stop_work(self, request):
        session = WorkSession.objects.filter(employee=request.user, end_time__isnull=True).first()
        if not session:
            return Response({"error": "No active work session"}, status=400)
        
        session.end_time = timezone.now()
        session.save()
        return Response(WorkSessionSerializer(session).data)
    
    @action(detail=False, methods=['post'])
    def start_break(self, request):
        break_type = request.data.get('type')
        if break_type not in ['break', 'support']:
            return Response({"error": "Invalid break type"}, status=400)
        
        BreakSession.objects.filter(employee=request.user, end_time__isnull=True).update(end_time=timezone.now())
        
        WorkSession.objects.filter(employee=request.user, end_time__isnull=True).update(end_time=timezone.now())
        
        break_session = BreakSession.objects.create(employee=request.user, type=break_type)
        return Response(BreakSessionSerializer(break_session).data)
    
    @action(detail=False, methods=['post'])
    def stop_break(self, request):
        break_session = BreakSession.objects.filter(employee=request.user, end_time__isnull=True).first()
        if not break_session:
            return Response({"error": "No active break"}, status=400)
        
        break_session.end_time = timezone.now()
        break_session.save()
        return Response(BreakSessionSerializer(break_session).data)
    
    @action(detail=False, methods=['get'])
    def projects_tasks(self, request):
        projects = Project.objects.filter(is_active=True)
        data = [
            {
                "id": p.id,
                "name": p.name,
                "tasks": [{"id": t.id, "name": t.name} for t in p.tasks.filter(is_active=True)]
            }
            for p in projects
        ]
        return Response(data)