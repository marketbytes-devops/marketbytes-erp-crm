import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from hr.models import Attendance, WorkSession
from operation.models import Project, Task
from authapp.models import CustomUser
from django.db.models import Exists, OuterRef
from django.utils import timezone

def verify():
    # Find user
    users = CustomUser.objects.filter(username__icontains='sreekut')
    if not users.exists():
        print("User 'sreekuttan' not found.")
        return
    user = users.first()
    print(f"User: {user.username} (ID: {user.id})")

    # Find Project
    projects = Project.objects.filter(name__icontains='cms')
    if not projects.exists():
        print("Project 'CMS' not found.")
        # List all projects
        print("Available Projects:", list(Project.objects.values_list('name', flat=True)))
        return
    project = projects.first()
    print(f"Project: {project.name} (ID: {project.id})")

    # Check WorkSessions
    sessions = WorkSession.objects.filter(employee=user, project=project).order_by('-start_time')
    print(f"Found {sessions.count()} work sessions for user in project.")
    
    if sessions.exists():
        latest_session = sessions.first()
        print(f"Latest Session: ID={latest_session.id}, Start={latest_session.start_time}, Date={latest_session.start_time.date()}")

        # Check Attendance for that date
        att_date = latest_session.start_time.date()
        date_q = Attendance.objects.filter(employee=user, date=att_date)
        print(f"Attendance for {att_date}: {date_q.exists()}")
        if date_q.exists():
            att = date_q.first()
            print(f"Attendance: {att.id}, Date={att.date}")
        
        # Test the Filter Query
        qs = Attendance.objects.filter(id=att.id).filter(
            Exists(WorkSession.objects.filter(
                employee=OuterRef('employee'),
                start_time__date=OuterRef('date'),
                project_id=project.id
            ))
        )
        print(f"Filter matches: {qs.exists()}")

        if not qs.exists():
            print("Filter FAILED to match.")
            # Debug why
            # Check implicit date conversion
            ws_date = WorkSession.objects.filter(
                employee=user, project=project, pk=latest_session.pk
            ).values('start_time__date').first()
            print(f"WorkSession DB Date extraction: {ws_date}")
            
    else:
        print("No work sessions found. Check if the active timer created one?")

if __name__ == '__main__':
    verify()
