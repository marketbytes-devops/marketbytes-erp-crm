from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils import timezone
from .models import (
    Attendance, Holiday, LeaveType, Leave, Overtime,
    Candidate, Performance, Project, Task, WorkSession, BreakSession
)

class YearFilter(admin.SimpleListFilter):
    title = 'Year'
    parameter_name = 'year'

    def lookups(self, request, model_admin):
        years = set()
        for obj in model_admin.model.objects.all():
            if hasattr(obj, 'date') and obj.date:
                years.add(obj.date.year)
            elif hasattr(obj, 'start_time') and obj.start_time:
                years.add(obj.start_time.year)
            elif hasattr(obj, 'start_date') and obj.start_date:  
                years.add(obj.start_date.year)
        return sorted([(y, y) for y in years], reverse=True)

    def queryset(self, request, queryset):
        if self.value():
            year = self.value()
            if hasattr(queryset.model, 'date'):
                return queryset.filter(date__year=year)
            elif hasattr(queryset.model, 'start_time'):
                return queryset.filter(start_time__year=year)
            elif hasattr(queryset.model, 'start_date'): 
                return queryset.filter(start_date__year=year)
        return queryset


def mark_as_approved(modeladmin, request, queryset):
    queryset.update(status='approved')
mark_as_approved.short_description = "Mark selected leaves as Approved"

def mark_as_rejected(modeladmin, request, queryset):
    queryset.update(status='rejected')
mark_as_rejected.short_description = "Mark selected leaves as Rejected"


class TaskInline(admin.TabularInline):
    model = Task
    extra = 1
    fields = ('name', 'is_active')


class WorkSessionInline(admin.TabularInline):
    model = WorkSession
    extra = 0
    fields = ('project', 'task', 'memo', 'start_time', 'end_time', 'duration_seconds')
    readonly_fields = ('duration_seconds',)


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_active', 'task_count', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('name',)
    inlines = [TaskInline]

    def task_count(self, obj):
        return obj.tasks.count()
    task_count.short_description = "Tasks"


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('name', 'project', 'is_active')
    list_filter = ('project__name', 'is_active')
    search_fields = ('name', 'project__name')
    list_select_related = ('project',)


@admin.register(WorkSession)
class WorkSessionAdmin(admin.ModelAdmin):
    list_display = ('employee', 'project', 'task', 'date', 'duration', 'memo_preview')
    list_filter = ('project__name', 'task__name', YearFilter, 'start_time')
    search_fields = ('employee__name', 'employee__username', 'project__name', 'task__name', 'memo')
    readonly_fields = ('duration_seconds',)
    list_select_related = ('employee', 'project', 'task')
    date_hierarchy = 'start_time'

    def date(self, obj):
        return obj.start_time.date() if obj.start_time else '-'
    date.short_description = "Date"

    def duration(self, obj):
        if obj.duration_seconds:
            hrs = obj.duration_seconds // 3600
            mins = (obj.duration_seconds % 3600) // 60
            return f"{hrs}h {mins}m"
        return "-"
    duration.short_description = "Duration"

    def memo_preview(self, obj):
        return (obj.memo[:50] + '...') if obj.memo and len(obj.memo) > 50 else (obj.memo or '-')
    memo_preview.short_description = "Memo"


@admin.register(BreakSession)
class BreakSessionAdmin(admin.ModelAdmin):
    list_display = ('employee', 'type', 'start_time', 'duration', 'end_time')
    list_filter = ('type', YearFilter)
    search_fields = ('employee__name', 'employee__username')
    list_select_related = ('employee',)
    readonly_fields = ('duration_seconds',)

    def duration(self, obj):
        if obj.duration_seconds:
            mins = obj.duration_seconds // 60
            secs = obj.duration_seconds % 60
            return f"{mins}m {secs}s"
        return "-"
    duration.short_description = "Duration"


@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ('employee', 'date', 'clock_in', 'clock_out', 'total_hours', 'status', 'working_from')
    list_filter = ('status', 'working_from', 'is_late', 'is_half_day', YearFilter)
    search_fields = ('employee__name', 'employee__username')
    readonly_fields = ('created_at', 'updated_at')
    list_select_related = ('employee',)
    date_hierarchy = 'date'

    def total_hours(self, obj):
        hours = obj.calculate_hours()
        return f"{hours:.2f}h" if hours > 0 else "-"
    total_hours.short_description = "Hours Worked"


@admin.register(Holiday)
class HolidayAdmin(admin.ModelAdmin):
    list_display = ('date', 'occasion', 'day', 'is_default')
    list_filter = ('is_default', YearFilter)
    search_fields = ('occasion',)
    ordering = ('-date',)


@admin.register(LeaveType)
class LeaveTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'days_allowed', 'is_paid')
    search_fields = ('name',)


@admin.register(Leave)
class LeaveAdmin(admin.ModelAdmin):
    list_display = ('employee', 'leave_type', 'start_date', 'end_date', 'duration', 'status', 'total_days')
    list_filter = ('status', 'leave_type', YearFilter)
    search_fields = ('employee__name', 'employee__username', 'reason')
    actions = [mark_as_approved, mark_as_rejected]
    readonly_fields = ('created_at', 'updated_at')
    list_select_related = ('employee', 'leave_type', 'approved_by')

    def total_days(self, obj):
        return obj.total_days()
    total_days.short_description = "Days"


@admin.register(Overtime)
class OvertimeAdmin(admin.ModelAdmin):
    list_display = ('employee', 'project', 'date', 'hours', 'effort_preview')
    list_filter = (YearFilter,)
    search_fields = ('employee__name', 'project')
    list_select_related = ('employee',)

    def effort_preview(self, obj):
        return (obj.effort[:50] + '...') if obj.effort and len(obj.effort) > 50 else (obj.effort or '-')
    effort_preview.short_description = "Effort"


@admin.register(Candidate)
class CandidateAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'mobile', 'designation', 'department', 'status', 'round')
    list_filter = ('status', 'department', 'round')
    search_fields = ('name', 'email', 'mobile', 'designation')


@admin.register(Performance)
class PerformanceAdmin(admin.ModelAdmin):
    list_display = ('employee', 'department', 'review_period', 'rating', 'reviewed_by')
    list_filter = ('department', 'review_period')
    search_fields = ('employee__name', 'review_period')
    list_select_related = ('employee', 'department', 'reviewed_by')