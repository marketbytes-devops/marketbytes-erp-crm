from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from authapp.permissions import HasPermission
from django.utils import timezone
from datetime import timedelta, datetime, time, timezone as dt_timezone
from django.db.models import Q
from .models import Attendance, Holiday, LeaveType, Leave, Overtime, Candidate, Performance, Project, Task, WorkSession, BreakSession
from .serializers import *

class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.all().select_related('employee')
    serializer_class = AttendanceSerializer
    permission_classes = [HasPermission]
    page_name = 'attendance'
    
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
        
        now = timezone.now()
        current_time_utc = now.time()
        current_time_local = timezone.localtime(now).time()
        
        current_time = current_time_local 
        
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
                attendance.clock_in = current_time_utc # Store UTC
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
                attendance.clock_in = current_time_utc 
                attendance.clock_in_ip = ip
                attendance.status = self._calculate_status(current_time)
                attendance.save()
                return Response({
                    "message": "Welcome back! Check-in time updated.",
                    "time": attendance.clock_in.strftime("%H:%M"),
                    "status": attendance.status
                })
                
            else:
                check_in_limit = time(9, 30)
                half_day_start = time(14, 0)
                
                attendance.clock_in = current_time_utc 
                attendance.clock_in_ip = ip
                attendance.working_from = serializer.validated_data.get('working_from', 'Office')
                
                if current_time <= check_in_limit:
                    attendance.status = 'present'
                    attendance.is_late = False
                    attendance.is_half_day = False
                elif current_time < half_day_start:
                    attendance.status = 'late'
                    attendance.is_late = True
                    attendance.is_half_day = False
                else:
                    attendance.is_half_day = True
                    
                    if current_time > half_day_start:
                         attendance.status = 'half_day_late'
                         attendance.is_late = True
                    else:
                         attendance.status = 'half_day'
                         attendance.is_late = False

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
            
            attendance.clock_out = current_time_utc 
            attendance.clock_out_ip = ip
            attendance.save()

            now = timezone.now()
            WorkSession.objects.filter(employee=request.user, end_time__isnull=True).update(end_time=now)
            BreakSession.objects.filter(employee=request.user, end_time__isnull=True).update(end_time=now)
            
            return Response({
                "message": "Checked out successfully",
                "time": attendance.clock_out.strftime("%H:%M")
            })
    
    
    def _calculate_status(self, check_in_time):
        """Calculate attendance status based on check-in time"""
        if check_in_time > time(14, 0):
             return 'half_day_late'
        elif check_in_time >= time(14, 0):
             return 'half_day'
        elif check_in_time > time(9, 30):
            return 'late'
        else:
            return 'present'
    
    @action(detail=False, methods=['get'])
    def status(self, request):
        now = timezone.now()
        local_now = timezone.localtime(now)
        start_of_day = local_now.replace(hour=0, minute=0, second=0, microsecond=0)
        
        att = Attendance.objects.filter(employee=request.user, date=local_now.date()).first()
        
        work_sessions = WorkSession.objects.filter(
            employee=request.user,
            start_time__gte=start_of_day,
        )
        total_seconds = 0
        for session in work_sessions:
            if session.end_time:
                total_seconds += (session.end_time - session.start_time).total_seconds()
            else:
                total_seconds += (now - session.start_time).total_seconds()
        
        productive_hours = str(timedelta(seconds=int(total_seconds)))
        
        first_session_time = None
        if att:
             start_of_day_unaware = datetime.combine(local_now.date(), datetime.min.time())
             end_of_day_unaware = datetime.combine(local_now.date(), datetime.max.time())
                  
             current_tz = timezone.get_current_timezone()
             start_of_day_aware = timezone.make_aware(start_of_day_unaware, current_tz)
             end_of_day_aware = timezone.make_aware(end_of_day_unaware, current_tz)
                  
             first_session = WorkSession.objects.filter(
                      employee=request.user, 
                      start_time__gte=start_of_day_aware,
                      start_time__lte=end_of_day_aware
                  ).order_by('start_time').first()
                  
             if first_session:
                 first_session_time = timezone.localtime(first_session.start_time).strftime("%I:%M %p")

        if not first_session_time and att and att.clock_in:
             dt = datetime.combine(local_now.date(), att.clock_in)
             dt = dt.replace(tzinfo=dt_timezone.utc)
             first_session_time = timezone.localtime(dt).strftime("%I:%M %p")

        if att and att.clock_in and not att.clock_out:
            return Response({
                "checked_in": True,
                "clock_in": first_session_time,
                "clock_out": None,
                "productive_hours": productive_hours,
                "status": att.status,
                "message": "You are checked in"
            })
        
        message = "Checked out today" if att and att.clock_out else "Not checked in today"
        return Response({
            "checked_in": False,
            "clock_in": first_session_time,
            "clock_out": att.clock_out.strftime("%I:%M %p") if att and att.clock_out else None,
            "productive_hours": productive_hours,
            "status": att.status if att else "absent",
            "message": message
        })

class HolidayViewSet(viewsets.ModelViewSet):
    queryset = Holiday.objects.all()
    serializer_class = HolidaySerializer
    permission_classes = [HasPermission]
    page_name = 'holidays'

class LeaveTypeViewSet(viewsets.ModelViewSet):
    queryset = LeaveType.objects.all()
    serializer_class = LeaveTypeSerializer
    permission_classes = [HasPermission]
    page_name = 'leaves'

class LeaveViewSet(viewsets.ModelViewSet):
    queryset = Leave.objects.all().select_related('employee', 'leave_type', 'approved_by')
    serializer_class = LeaveSerializer
    permission_classes = [HasPermission]
    page_name = 'leaves'

class OvertimeViewSet(viewsets.ModelViewSet):
    queryset = Overtime.objects.all().select_related('employee')
    serializer_class = OvertimeSerializer
    permission_classes = [HasPermission]
    page_name = 'overtime'
    
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

class CandidateViewSet(viewsets.ModelViewSet):
    queryset = Candidate.objects.all().select_related('department')
    serializer_class = CandidateSerializer
    permission_classes = [HasPermission]
    page_name = 'recruitment'

class PerformanceViewSet(viewsets.ModelViewSet):
    queryset = Performance.objects.all().select_related('employee', 'department', 'reviewed_by')
    serializer_class = PerformanceSerializer
    permission_classes = [HasPermission]
    page_name = 'performance'

    def get_queryset(self):
        user = self.request.user
        queryset = self.queryset
        
        employee_id = self.request.query_params.get('employee_id')
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')

        if user.is_superuser or (getattr(user, 'role', None) and user.role.name == "Superadmin"):
            if employee_id:
                queryset = queryset.filter(employee_id=employee_id)
        else:
            queryset = queryset.filter(employee=user)

        if start_date:
            queryset = queryset.filter(created_at__date__gte=start_date)
        if end_date:
            queryset = queryset.filter(created_at__date__lte=end_date)
            
        return queryset

class TimerViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def status(self, request):
        user = request.user
        active_work = WorkSession.objects.filter(employee=user, end_time__isnull=True).first()
        active_break = BreakSession.objects.filter(employee=user, end_time__isnull=True).first()
        
        now = timezone.now()
        local_now = timezone.localtime(now)
        
        if active_work:
            start_local = active_work.start_time.astimezone(timezone.get_current_timezone())
            if start_local.date() < local_now.date():
                end_of_day_local = start_local.replace(hour=23, minute=59, second=59)
                active_work.end_time = end_of_day_local
                active_work.save()
                active_work = None
            
        if active_break:
            start_local = active_break.start_time.astimezone(timezone.get_current_timezone())
            if start_local.date() < local_now.date():
                end_of_day_local = start_local.replace(hour=23, minute=59, second=59)
                active_break.end_time = end_of_day_local
                active_break.save()
                active_break = None
        start_of_day = local_now.replace(hour=0, minute=0, second=0, microsecond=0)
        
        # Calculate total work
        work_sessions = WorkSession.objects.filter(employee=user, start_time__gte=start_of_day)
        total_work_seconds = 0
        for s in work_sessions:
            if s.end_time:
                total_work_seconds += (s.end_time - s.start_time).total_seconds()
            else:
                total_work_seconds += (now - s.start_time).total_seconds()
        
        # Calculate total break & support
        break_sessions = BreakSession.objects.filter(employee=user, start_time__gte=start_of_day)
        total_break_seconds = 0
        total_support_seconds = 0
        for b in break_sessions:
            duration = (b.end_time - b.start_time).total_seconds() if b.end_time else (now - b.start_time).total_seconds()
            if b.type == 'break':
                total_break_seconds += duration
            elif b.type == 'support':
                total_support_seconds += duration
        
        def format_seconds(s):
            return str(timedelta(seconds=int(s)))

        return Response({
            "is_working": bool(active_work),
            "is_on_break": bool(active_break),
            "active_type": "work" if active_work else (active_break.type if active_break else None),
            "current_work_session": WorkSessionSerializer(active_work).data if active_work else None,
            "current_break_session": BreakSessionSerializer(active_break).data if active_break else None,
            "today_total_work": format_seconds(total_work_seconds),
            "today_total_break": format_seconds(total_break_seconds),
            "today_total_support": format_seconds(total_support_seconds),
            "today_total_work_seconds": int(total_work_seconds),
            "today_total_break_seconds": int(total_break_seconds),
            "today_total_support_seconds": int(total_support_seconds),
            "target_hours": "08:00:00",
            "remaining_hours": format_seconds(max(0, 28800 - int(total_work_seconds)))
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
        user = request.user
        role = getattr(user, 'role', None)
        is_admin = user.is_superuser or user.is_staff or (role and role.name == "Superadmin")
        
        if is_admin:
            projects = Project.objects.all()
        else:
            query = Q(members=user) | Q(tasks__assignees=user)
            if user.department_id:
                query |= Q(department_id=user.department_id)
            projects = Project.objects.filter(query).distinct()

        data = []
        for p in projects:
            tasks_qs = p.tasks.exclude(status='done')
            
            if not is_admin:
                tasks_qs = tasks_qs.filter(assignees=user)

            task_list = []
            for t in tasks_qs.distinct():
                due_info = f" (Due: {t.due_date.strftime('%d-%m-%Y')})" if t.due_date else ""
                task_list.append({
                    "id": t.id,
                    "name": f"{t.name}{due_info}"
                })

            is_member = is_admin or p.members.filter(id=user.id).exists()
            
            if is_admin or is_member or len(task_list) > 0:
                data.append({
                    "id": p.id,
                    "name": p.name,
                    "tasks": task_list
                })
        
        return Response(data)
