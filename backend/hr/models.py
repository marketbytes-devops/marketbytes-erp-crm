from django.db import models
from django.utils import timezone
from authapp.models import CustomUser, Department
from operation.models import Project
from operation.models import Task


class Attendance(models.Model):
    employee = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='attendances', null=True, blank=True)
    date = models.DateField(default=timezone.now, null=True, blank=True)
    clock_in = models.TimeField(null=True, blank=True)
    clock_in_ip = models.GenericIPAddressField(null=True, blank=True)
    clock_out = models.TimeField(null=True, blank=True)
    clock_out_ip = models.GenericIPAddressField(null=True, blank=True)
    is_late = models.BooleanField(default=False, null=True, blank=True)
    is_half_day = models.BooleanField(default=False, null=True, blank=True)
    working_from = models.CharField(max_length=100, default="Office", null=True, blank=True)
    status = models.CharField(max_length=20, choices=[('present', 'Present'),('absent', 'Absent'),('late', 'Late'),('half_day', 'Half Day'),('half_day_late', 'Half Day Late'),('leave', 'On Leave'),('holiday', 'Holiday')], default='absent', null=True, blank=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)

    class Meta:
        unique_together = ('employee', 'date')
        ordering = ['-date', 'employee']
        verbose_name_plural = "Attendances"

    def __str__(self):
        return f"{self.employee.name} - {self.date}"

    def calculate_hours(self):
        if self.clock_in and self.clock_out:
            from datetime import datetime, timedelta
            clock_in_dt = datetime.combine(self.date, self.clock_in)
            clock_out_dt = datetime.combine(self.date, self.clock_out)
            if clock_out_dt < clock_in_dt:
                clock_out_dt += timedelta(days=1)
            duration = clock_out_dt - clock_in_dt
            return duration.total_seconds() / 3600
        return 0

class Holiday(models.Model):
    date = models.DateField(unique=True, null=True, blank=True)
    occasion = models.CharField(max_length=200, null=True, blank=True)
    day = models.CharField(max_length=20, null=True, blank=True)
    is_default = models.BooleanField(default=False, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)

    class Meta:
        ordering = ['date']
        verbose_name_plural = "Holidays"

    def save(self, *args, **kwargs):
        if not self.day:
            self.day = self.date.strftime('%A')
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.occasion} - {self.date}"

class LeaveType(models.Model):
    name = models.CharField(max_length=100, unique=True, null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    days_allowed = models.IntegerField(default=0, null=True, blank=True)
    is_paid = models.BooleanField(default=True, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)

    def __str__(self):
        return self.name

class Leave(models.Model):
    employee = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='leaves', null=True, blank=True)
    leave_type = models.ForeignKey(LeaveType, on_delete=models.PROTECT, null=True, blank=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    duration = models.CharField(max_length=20, choices=[('full_day', 'Full Day'),('half_day', 'Half Day'),('multiple', 'Multiple Days')], default='full_day', null=True, blank=True)
    reason = models.TextField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=[('pending', 'Pending'),('approved', 'Approved'),('rejected', 'Rejected')], default='pending', null=True, blank=True)
    approved_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_leaves')
    rejection_reason = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = "Leaves"

    def __str__(self):
        employee_name = self.employee.name if self.employee else "No Employee"
        leave_type_name = self.leave_type.name if self.leave_type else "No Leave Type"
        date_str = self.start_date.strftime("%Y-%m-%d") if self.start_date else "No Date"
        return f"{employee_name} - {leave_type_name} ({date_str})"

    def total_days(self):
        if self.duration == 'half_day':
            return 0.5
        return (self.end_date - self.start_date).days + 1

class Overtime(models.Model):
    employee = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='overtimes', null=True, blank=True)
    project = models.CharField(max_length=200, null=True, blank=True)
    date = models.DateField(null=True, blank=True)
    hours = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    effort = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)

    class Meta:
        ordering = ['-date']
        verbose_name_plural = "Overtime Records"

    def __str__(self):
        return f"{self.employee.name} - {self.project} ({self.hours}h)"

class Candidate(models.Model):
    name = models.CharField(max_length=255, null=True, blank=True)
    email = models.EmailField(unique=True, null=True, blank=True)
    mobile = models.CharField(max_length=15, null=True, blank=True)
    gender = models.CharField(max_length=10, choices=[('male', 'Male'),('female', 'Female'),('other', 'Other')], null=True, blank=True)
    designation = models.CharField(max_length=100, null=True, blank=True)
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True)
    dob = models.DateField(null=True, blank=True)
    image = models.ImageField(upload_to="candidates/", null=True, blank=True)
    comments = models.TextField(blank=True, null=True)
    round = models.IntegerField(default=1, null=True, blank=True)
    status = models.CharField(max_length=20, choices=[('screening', 'Screening'),('interview', 'Interview'),('technical', 'Technical Round'),('hr_round', 'HR Round'),('selected', 'Selected'),('rejected', 'Rejected'),('on_hold', 'On Hold')], default='screening', null=True, blank=True)
    offered = models.BooleanField(default=False, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = "Candidates"

    def __str__(self):
        return f"{self.name} - {self.designation}"

class Performance(models.Model):
    employee = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='performances', null=True, blank=True)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='performances', null=True, blank=True)
    review_period = models.CharField(max_length=50, null=True, blank=True)
    rating = models.DecimalField(max_digits=3, decimal_places=2, null=True, blank=True)
    comments = models.TextField(blank=True, null=True)
    reviewed_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, related_name='conducted_reviews', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = "Performance Reviews"

    def __str__(self):
        return f"{self.employee.name} - {self.review_period} ({self.rating})"


class WorkSession(models.Model):
    employee = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='work_sessions', null=True, blank=True)
    project = models.ForeignKey(Project, on_delete=models.PROTECT, null=True, blank=True)
    task = models.ForeignKey(Task, on_delete=models.PROTECT, null=True, blank=True)
    memo = models.TextField(blank=True, null=True)
    start_time = models.DateTimeField(null=True, blank=True)
    end_time = models.DateTimeField(null=True, blank=True)
    duration_seconds = models.IntegerField(null=True, blank=True)

    def save(self, *args, **kwargs):
        if self.end_time and self.start_time:
            self.duration_seconds = int((self.end_time - self.start_time).total_seconds())
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.employee.name} - {self.task or 'No Task'} ({self.start_time.strftime('%H:%M')})"

class BreakSession(models.Model):
    BREAK_TYPE_CHOICES = [('break', 'Break'),('support', 'Support')]
    employee = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='break_sessions', null=True, blank=True)
    type = models.CharField(max_length=10, choices=BREAK_TYPE_CHOICES, null=True, blank=True)
    start_time = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    end_time = models.DateTimeField(null=True, blank=True)
    duration_seconds = models.IntegerField(null=True, blank=True)

    def save(self, *args, **kwargs):
        if self.end_time and self.start_time:
            self.duration_seconds = int((self.end_time - self.start_time).total_seconds())
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.employee.name} - {self.get_type_display()} ({self.duration_seconds or 0}s)"