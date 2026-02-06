from django.db.models.signals import post_save
from django.dispatch import receiver
from authapp.models import CustomUser
from operation.models import Task
from .models import NotificationPreference, Notification, Reminder
from django.utils import timezone


@receiver(post_save, sender=CustomUser)
def create_notification_preference(sender, instance, created, **kwargs):
    """
    Automatically create notification preferences when a new user is created
    """
    if created:
        NotificationPreference.objects.get_or_create(user=instance)


@receiver(post_save, sender=Task)
def create_task_notifications(sender, instance, created, **kwargs):
    """
    Create notifications and reminders when tasks are created or updated
    """
    if created:
        # Notify assignees about new task
        for assignee in instance.assignees.all():
            # Check user preferences
            try:
                pref = assignee.notification_preference
                if pref.inapp_task_assigned:
                    Notification.objects.create(
                        user=assignee,
                        notification_type='task_assigned',
                        priority='medium',
                        title=f'New Task Assigned: {instance.name}',
                        message=f'You have been assigned to task "{instance.name}" in project {instance.project.name if instance.project else "N/A"}',
                        link_url=f'/operations/tasks/edit/{instance.id}',
                        link_text='View Task',
                        related_task_id=instance.id,
                        related_project_id=instance.project.id if instance.project else None
                    )
                
                # Create reminder for task due date
                if instance.due_date and pref.task_reminder_before_hours > 0:
                    reminder_time = timezone.make_aware(
                        timezone.datetime.combine(
                            instance.due_date,
                            timezone.datetime.min.time()
                        )
                    ) - timezone.timedelta(hours=pref.task_reminder_before_hours)
                    
                    if reminder_time > timezone.now():
                        Reminder.objects.create(
                            user=assignee,
                            reminder_type='task_due',
                            frequency='once',
                            title=f'Task Due: {instance.name}',
                            description=f'Task "{instance.name}" is due on {instance.due_date}',
                            scheduled_time=reminder_time,
                            related_task_id=instance.id,
                            related_project_id=instance.project.id if instance.project else None
                        )
            except NotificationPreference.DoesNotExist:
                # Create default preference if it doesn't exist
                NotificationPreference.objects.create(user=assignee)
    
    else:
        # Task updated - check for overdue status
        if instance.due_date and instance.due_date < timezone.now().date() and instance.status != 'done':
            for assignee in instance.assignees.all():
                try:
                    pref = assignee.notification_preference
                    if pref.inapp_task_due:
                        # Check if we haven't already sent an overdue notification today
                        today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
                        existing = Notification.objects.filter(
                            user=assignee,
                            notification_type='task_overdue',
                            related_task_id=instance.id,
                            created_at__gte=today_start
                        ).exists()
                        
                        if not existing:
                            Notification.objects.create(
                                user=assignee,
                                notification_type='task_overdue',
                                priority='urgent',
                                title=f'Task Overdue: {instance.name}',
                                message=f'Task "{instance.name}" was due on {instance.due_date}',
                                link_url=f'/operations/tasks/edit/{instance.id}',
                                link_text='View Task',
                                related_task_id=instance.id,
                                related_project_id=instance.project.id if instance.project else None
                            )
                except NotificationPreference.DoesNotExist:
                    pass
