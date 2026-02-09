
import os
import django
import sys
from django.db.models import Exists, OuterRef
from django.utils import timezone

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from hr.models import Attendance, WorkSession, Project

def debug():
    print("Finding a recent WorkSession with a project...")
    # Get a recent work session with a project
    ws = WorkSession.objects.filter(project__isnull=False).order_by('-start_time').first()
    
    if not ws:
        print("No WorkSessions found with a project.")
        return

    print(f"WorkSession Found: ID={ws.id}, Employee={ws.employee.email}, Project={ws.project.name}")
    print(f"Start Time (UTC): {ws.start_time}")
    print(f"Start Time (Local): {timezone.localtime(ws.start_time)}")
    
    ws_date_utc = ws.start_time.date()
    ws_date_local = timezone.localtime(ws.start_time).date()
    print(f"Date (UTC): {ws_date_utc}, Date (Local): {ws_date_local}")

    # Find Attendance for this day (checking both UTC and Local dates to be sure)
    attendance = Attendance.objects.filter(employee=ws.employee, date=ws_date_local).first()
    
    if not attendance:
        print(f"No Attendance found for date {ws_date_local}. Checking {ws_date_utc}...")
        attendance = Attendance.objects.filter(employee=ws.employee, date=ws_date_utc).first()

    if not attendance:
        print("No Attendance record found for this work session's date.")
        return

    print(f"Attendance Found: ID={attendance.id}, Date={attendance.date}")

    # Test Granular Filter Query (Year/Month/Day)
    print("\nTesting Granular Exists Query (Year, Month, Day)...")
    qs = Attendance.objects.filter(pk=attendance.pk).filter(
        Exists(WorkSession.objects.filter(
            employee=OuterRef('employee'),
            project_id=ws.project.id,
            start_time__year=OuterRef('date__year'),
            start_time__month=OuterRef('date__month'),
            start_time__day=OuterRef('date__day'),
        ))
    )
    
    if qs.exists():
        print("SUCCESS: Granular Filter matched this attendance record.")
    else:
        print("FAILURE: Granular Filter DID NOT match.")
        
        # Debug individual lookups
        print("Checking individual components matching...")
        check_year = WorkSession.objects.filter(id=ws.id, start_time__year=attendance.date.year).exists()
        check_month = WorkSession.objects.filter(id=ws.id, start_time__month=attendance.date.month).exists()
        check_day = WorkSession.objects.filter(id=ws.id, start_time__day=attendance.date.day).exists()
        print(f"Year match? {check_year}")
        print(f"Month match? {check_month}")
        print(f"Day match? {check_day}")

if __name__ == "__main__":
    try:
        debug()
    except Exception as e:
        print(f"Error: {e}")
