from rest_framework import serializers
from .models import Attendance, Holiday, LeaveType, Leave, Overtime, Candidate, Performance, Project, Task, WorkSession, BreakSession
from authapp.serializers import UserSerializer, DepartmentSerializer
from authapp.models import CustomUser
from django.utils import timezone
from datetime import datetime, timezone as dt_timezone

class AttendanceSerializer(serializers.ModelSerializer):
    employee = UserSerializer(read_only=True)
    employee_id = serializers.PrimaryKeyRelatedField(queryset=CustomUser.objects.all(), source='employee', write_only=True)
    total_hours = serializers.SerializerMethodField()
    clock_in = serializers.SerializerMethodField()
    clock_out = serializers.SerializerMethodField()
    first_clock_in = serializers.SerializerMethodField()
    
    class Meta:
        model = Attendance
        fields = '__all__'
        read_only_fields = ['total_hours', 'productive_hours', 'break_hours', 'first_clock_in', 'last_clock_out', 'check_in_out_history', 'created_at', 'updated_at']

    def get_clock_in(self, obj):
        if obj.clock_in:
             if obj.date and obj.clock_in:
                 dt = datetime.combine(obj.date, obj.clock_in)
                 dt = dt.replace(tzinfo=dt_timezone.utc) 
                 return timezone.localtime(dt).strftime("%I:%M:%S %p")
        return None

    def get_clock_out(self, obj):
        if obj.date and obj.clock_out:
             dt = datetime.combine(obj.date, obj.clock_out)
             dt = dt.replace(tzinfo=dt_timezone.utc)
             return timezone.localtime(dt).strftime("%I:%M:%S %p")
        return None
    
    def _get_work_sessions_for_date(self, obj):
        """Get work sessions for the attendance date in local timezone"""
        # Robust logic ensuring awareness match
        local_tz = timezone.get_current_timezone()
        start_of_day_unaware = datetime.combine(obj.date, datetime.min.time())
        end_of_day_unaware = datetime.combine(obj.date, datetime.max.time())
        
        start_of_day = timezone.make_aware(start_of_day_unaware, local_tz)
        end_of_day = timezone.make_aware(end_of_day_unaware, local_tz)
        
        return WorkSession.objects.filter(
            employee=obj.employee,
            start_time__gte=start_of_day,
            start_time__lte=end_of_day
        ).order_by('start_time')
    
    def _get_break_sessions_for_date(self, obj):
        """Get break sessions for the attendance date in local timezone"""
        local_tz = timezone.get_current_timezone()
        start_of_day = datetime.combine(obj.date, datetime.min.time())
        end_of_day = datetime.combine(obj.date, datetime.max.time())
        
        start_of_day = timezone.make_aware(start_of_day, local_tz)
        end_of_day = timezone.make_aware(end_of_day, local_tz)
        
        return BreakSession.objects.filter(
            employee=obj.employee,
            start_time__gte=start_of_day,
            start_time__lte=end_of_day
        ).order_by('start_time')
    
    def get_first_clock_in(self, obj):
        """Get the very first check-in time of the day"""
        work_sessions = self._get_work_sessions_for_date(obj)
        first_session = work_sessions.first()
        
        if first_session:
            local_time = timezone.localtime(first_session.start_time)
            return local_time.strftime("%I:%M %p")
        
        # Fallback to obj.clock_in if no session found 
        if obj.clock_in:
             # Manually convert obj.clock_in (UTC) to local
             dt = datetime.combine(obj.date, obj.clock_in)
             dt = dt.replace(tzinfo=dt_timezone.utc)
             return timezone.localtime(dt).strftime("%I:%M %p")
        return None
    
    def get_last_clock_out(self, obj):
        """Get the very last check-out time - only if user has checked out"""
        if not obj.clock_out:
            return None
        
        work_sessions = self._get_work_sessions_for_date(obj)
        completed_sessions = work_sessions.filter(end_time__isnull=False)
        last_session = completed_sessions.last()
        
        if last_session and last_session.end_time:
            local_time = timezone.localtime(last_session.end_time)
            return local_time.strftime("%I:%M:%S %p")
        
        return obj.clock_out.strftime("%I:%M:%S %p") if obj.clock_out else None
    
    def get_check_in_out_history(self, obj):
        """Get all check-in/out times for the day"""
        work_sessions = self._get_work_sessions_for_date(obj)
        
        history = []
        for session in work_sessions:
            check_in_local = timezone.localtime(session.start_time)
            
            if session.end_time:
                check_out_local = timezone.localtime(session.end_time)
                check_out_str = check_out_local.strftime("%I:%M:%S %p")
            else:
                check_out_str = "Still Working"
            
            history.append({
                'check_in': check_in_local.strftime("%I:%M:%S %p"),
                'check_out': check_out_str,
                'project': session.project.name if session.project else None,
                'task': session.task.name if session.task else None,
                'memo': session.memo
            })
        
        return history
    
    def get_total_hours(self, obj):
        """Calculate total hours from first check-in to last check-out"""
        work_sessions = self._get_work_sessions_for_date(obj)
        first_session = work_sessions.first()
        
        completed_sessions = work_sessions.filter(end_time__isnull=False)
        last_session = completed_sessions.last()
        
        if first_session and last_session and last_session.end_time:
            total_seconds = (last_session.end_time - first_session.start_time).total_seconds()
            return round(total_seconds / 3600, 2)
        
        return obj.calculate_hours()
    
    def get_productive_hours(self, obj):
        """Calculate productive hours from work sessions (excluding breaks)"""
        work_sessions = self._get_work_sessions_for_date(obj)
        
        total_seconds = 0
        now = timezone.now()
        for session in work_sessions:
            if session.end_time:
                total_seconds += (session.end_time - session.start_time).total_seconds()
            elif obj.date == now.date():
                total_seconds += (now - session.start_time).total_seconds()
                
        hours = total_seconds / 3600
        return round(hours, 2)
    
    def get_break_hours(self, obj):
        """Calculate break hours from break sessions"""
        break_sessions = self._get_break_sessions_for_date(obj)
        
        total_seconds = 0
        now = timezone.now()
        for session in break_sessions:
            if session.end_time:
                total_seconds += (session.end_time - session.start_time).total_seconds()
            elif obj.date == now.date():
                total_seconds += (now - session.start_time).total_seconds()
                
        hours = total_seconds / 3600
        return round(hours, 2)

class AttendanceCheckInOutSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=['in', 'out'])
    working_from = serializers.CharField(max_length=100, required=False, default="Office")

class AttendanceStatusSerializer(serializers.Serializer):
    checked_in = serializers.BooleanField()
    clock_in = serializers.CharField(allow_null=True)
    clock_out = serializers.CharField(allow_null=True)
    productive_hours = serializers.CharField()
    status = serializers.CharField()
    message = serializers.CharField()

class HolidaySerializer(serializers.ModelSerializer):
    class Meta:
        model = Holiday
        fields = '__all__'

class LeaveTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveType
        fields = '__all__'

class LeaveSerializer(serializers.ModelSerializer):
    employee = UserSerializer(read_only=True)
    employee_id = serializers.PrimaryKeyRelatedField(
        queryset=CustomUser.objects.all(),
        source='employee',
        write_only=True,
        required=True,       
        allow_null=False
    )
    leave_type_name = serializers.CharField(source='leave_type.name', read_only=True)
    total_days = serializers.SerializerMethodField()

    class Meta:
        model = Leave
        fields = [
            'id', 'employee', 'employee_id', 'leave_type', 'leave_type_name',
            'start_date', 'end_date', 'duration', 'reason', 'status',
            'approved_by', 'rejection_reason', 'created_at', 'updated_at', 'total_days'
        ]
        read_only_fields = ['approved_by', 'created_at', 'updated_at', 'total_days', 'leave_type_name']

    def get_total_days(self, obj):
        return obj.total_days()
    
class OvertimeSerializer(serializers.ModelSerializer):
    employee = UserSerializer(read_only=True)
    employee_id = serializers.PrimaryKeyRelatedField(
        queryset=CustomUser.objects.all(), 
        source='employee', 
        write_only=True
    )
    
    class Meta:
        model = Overtime
        fields = '__all__'

class CandidateSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    
    class Meta:
        model = Candidate
        fields = '__all__'

class PerformanceSerializer(serializers.ModelSerializer):
    employee = UserSerializer(read_only=True)
    department = DepartmentSerializer(read_only=True)
    reviewed_by = UserSerializer(read_only=True)
    
    class Meta:
        model = Performance
        fields = '__all__'

class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = '__all__'

class TaskSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source='project.name', read_only=True)
    
    class Meta:
        model = Task
        fields = '__all__'

class WorkSessionSerializer(serializers.ModelSerializer):
    employee = UserSerializer(read_only=True)
    project_name = serializers.CharField(source='project.name', read_only=True)
    task_name = serializers.CharField(source='task.name', read_only=True)
    duration = serializers.SerializerMethodField()
    
    class Meta:
        model = WorkSession
        fields = '__all__'
    
    def get_duration(self, obj):
        if obj.end_time and obj.start_time:
            return str(obj.end_time - obj.start_time).split('.')[0]
        return "Running..."

class BreakSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = BreakSession
        fields = '__all__'

class ActiveWorkSessionSerializer(serializers.ModelSerializer):
    employee = UserSerializer(read_only=True)
    project = serializers.CharField(source='project.name', read_only=True)
    task = serializers.CharField(source='task.name', read_only=True)
    start_time = serializers.DateTimeField()  
    duration_seconds = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()

    class Meta:
        model = WorkSession
        fields = [
            'id',
            'employee',
            'project',
            'task',
            'start_time',
            'duration_seconds',
            'status'
        ]

    def get_duration_seconds(self, obj):
        now = timezone.now()
        return int((now - obj.start_time).total_seconds())

    def get_status(self, obj):
        return "Active"

