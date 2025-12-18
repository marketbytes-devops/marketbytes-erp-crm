from django.db import models
from django.contrib.auth.hashers import make_password
from authapp.models import CustomUser, Department

class ProjectCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = "Project Categories"
        ordering = ['name']

class ProjectStatus(models.Model):
    name = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = "Project Statuses"

class ProjectStage(models.Model):
    name = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = "Project Stages"

class Currency(models.Model):
    code = models.CharField(max_length=3, unique=True, help_text="e.g., USD, INR, EUR")
    name = models.CharField(max_length=100, help_text="Full name, e.g., US Dollar")
    symbol = models.CharField(max_length=10, blank=True, null=True, help_text="e.g., $, €, ₹")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Currencies"
        ordering = ['code']

    def __str__(self):
        return f"{self.code} - {self.name}"
   

class Client(models.Model):
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=128)  
    phone = models.CharField(max_length=15, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def set_password(self, raw_password):
        self.password = make_password(raw_password)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['name']

class Project(models.Model):
    name = models.CharField(max_length=255)
    category = models.ForeignKey(ProjectCategory, on_delete=models.SET_NULL, null=True, blank=True)
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True)
    start_date = models.DateField(null=True, blank=True)
    deadline = models.DateField(null=True, blank=True)
    no_deadline = models.BooleanField(default=False)
    amc = models.BooleanField(default=False)  
    amc_date = models.DateField(null=True, blank=True)
    renewal_only = models.BooleanField(default=False)
    dm = models.BooleanField(default=False)
    allow_manual_timelogs = models.BooleanField(default=False)
    hours_allocated = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    members = models.ManyToManyField(CustomUser, blank=True, related_name='projects')
    summary = models.TextField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    client = models.ForeignKey(Client, on_delete=models.SET_NULL, null=True, blank=True)
    client_can_manage_tasks = models.BooleanField(default=False)
    send_task_notifications_to_client = models.BooleanField(default=False)
    budget = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    currency = models.ForeignKey(Currency,on_delete=models.SET_NULL,null=True,blank=True,related_name='projects',help_text="Select the currency for budget")
    status = models.ForeignKey(ProjectStatus, on_delete=models.SET_NULL, null=True, blank=True)
    stage = models.ForeignKey(ProjectStage, on_delete=models.SET_NULL, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['-created_at']

class ProjectFile(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='project_files')
    file = models.FileField(upload_to='project_files/%Y/%m/%d/')
    original_name = models.CharField(max_length=255)
    file_size = models.IntegerField()
    uploaded_at = models.DateTimeField(auto_now_add=True)
    uploaded_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True)
    
    def __str__(self):
        return f"{self.original_name} - {self.project.name}"

class TaskStatus(models.TextChoices):
    TODO = 'todo', 'To Do'
    IN_PROGRESS = 'in_progress', 'In Progress'
    REVIEW = 'review', 'Review'
    DONE = 'done', 'Done'
 
class TaskPriority(models.TextChoices):
    LOW = 'low', 'Low'
    MEDIUM = 'medium', 'Medium'
    HIGH = 'high', 'High'
    URGENT = 'urgent', 'Urgent'
 
class TaskLabel(models.TextChoices):
    BUG = 'bug', 'Bug'
    FEATURE = 'feature', 'Feature'
    IMPROVEMENT = 'improvement', 'Improvement'
    DOCUMENTATION = 'documentation', 'Documentation'
    DESIGN = 'design', 'Design'
    TESTING = 'testing', 'Testing'
 
class Task(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='tasks')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    status = models.CharField(
        max_length=20,
        choices=TaskStatus.choices,
        default=TaskStatus.TODO
    )
    priority = models.CharField(
        max_length=20,
        choices=TaskPriority.choices,
        default=TaskPriority.MEDIUM
    )
    start_date = models.DateField(null=True, blank=True)
    due_date = models.DateField(null=True, blank=True)
    allocated_hours = models.DecimalField(
        max_digits=6, decimal_places=2, null=True, blank=True,
        help_text="Estimated hours for this task"
    )
    label = models.CharField(
        max_length=20,
        choices=TaskLabel.choices,
        blank=True, null=True
    )
    assignees = models.ManyToManyField(CustomUser, blank=True, related_name='assigned_tasks')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
 
    class Meta:
        unique_together = ('project', 'name')
        ordering = ['-priority', 'due_date', 'name']
        verbose_name_plural = "Tasks"
 
    def __str__(self):
        return f"{self.project.name} - {self.name}"