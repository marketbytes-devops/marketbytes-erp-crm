from django.contrib.auth.models import AbstractUser
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.base_user import BaseUserManager
from django.utils.translation import gettext_lazy as _

class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError(_("The Email field must be set"))
        email = self.normalize_email(email)
        extra_fields.setdefault("username", email.split("@")[0])
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)
        extra_fields.setdefault("username", email.split("@")[0])
        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")
        return self.create_user(email, password, **extra_fields)

class Department(models.Model):
    name = models.CharField(max_length=100, blank=True, null=True)
    worksheet_url = models.URLField(max_length=500, blank=True, null=True)
    services = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name or "No Name"

    class Meta:
        verbose_name_plural = "Departments"

class Role(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(null=True, blank=True)

    def __str__(self):
        return self.name

    def member_count(self):
        return self.users.count() 

    member_count.short_description = "Members"

    class Meta:
        verbose_name = "Role or Designation"
        verbose_name_plural = "Roles & Designations"
        ordering = ['name']

class Permission(models.Model):
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name="permissions")
    page = models.CharField(max_length=100)
    can_view = models.BooleanField(default=False)
    can_add = models.BooleanField(default=False)
    can_edit = models.BooleanField(default=False)
    can_delete = models.BooleanField(default=False)

    class Meta:
        unique_together = ("role", "page")

    def __str__(self):
        return f"{self.role.name} - {self.page}"

class CustomUser(AbstractUser):
    email = models.EmailField(unique=True)
    username = models.CharField(max_length=150, unique=True, blank=True, null=True)
    name = models.CharField(max_length=255, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    mobile = models.CharField(max_length=15, blank=True, null=True)
    image = models.ImageField(upload_to="profile_images/", null=True, blank=True)
    role = models.ForeignKey(Role, on_delete=models.SET_NULL, null=True, blank=True, related_name="users")
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True)
    reports_to = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='subordinates')
    employee_id = models.CharField(max_length=20, unique=True, blank=True, null=True)
    joining_date = models.DateField(blank=True, null=True)
    dob = models.DateField(null=True, blank=True)
    probation_period = models.IntegerField(help_text="In months", null=True, blank=True)
    exit_date = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=10, choices=[('male', 'Male'), ('female', 'Female'), ('other', 'Other')], blank=True, null=True)
    skills = models.TextField(blank=True, null=True)
    country_code = models.CharField(max_length=5, default="+91", blank=True, null=True)
    hourly_rate = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    status = models.CharField(max_length=20, choices=[('active', 'Active'), ('inactive', 'Inactive'), ('terminated', 'Terminated')], default='active')
    login_enabled = models.BooleanField(default=True)
    email_notifications = models.BooleanField(default=True)
    otp = models.CharField(max_length=6, blank=True, null=True)
    otp_created_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, blank=True, null=True)
    gmail_refresh_token = models.TextField(max_length=500, blank=True, null=True)  
    gmail_access_token = models.TextField(max_length=500, blank=True, null=True)   
    gmail_token_expiry = models.DateTimeField(blank=True, null=True)
    
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = CustomUserManager()

    def __str__(self):
        return self.email or "No Email"

    def save(self, *args, **kwargs):
        if not self.employee_id and self.email:
            last = CustomUser.objects.exclude(employee_id__isnull=True).count() + 1
            self.employee_id = f"EMP{str(last).zfill(4)}"
        if not self.username and self.email:
            self.username = self.email.split("@")[0]
        super().save(*args, **kwargs)

class UserPermission(models.Model):
    """
    Direct user-level permissions (PRIMARY control)
    User can have permissions WITHOUT a role
    """
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="direct_permissions")
    page = models.CharField(max_length=100)
    can_view = models.BooleanField(default=False)
    can_add = models.BooleanField(default=False)
    can_edit = models.BooleanField(default=False)
    can_delete = models.BooleanField(default=False)

    class Meta:
        unique_together = ("user", "page")
        verbose_name_plural = "User Permissions"

    def __str__(self):
        return f"{self.user.email} - {self.page}"


class PermissionOverride(models.Model):
    """
    Override permissions for specific user
    Can BLOCK permissions from role or GRANT additional permissions
    """
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="permission_overrides")
    page = models.CharField(max_length=100)
    action = models.CharField(max_length=20, choices=[
        ('can_view', 'View'),
        ('can_add', 'Add'),
        ('can_edit', 'Edit'),
        ('can_delete', 'Delete'),
    ])
    is_blocked = models.BooleanField(default=False)  # True = blocked, False = granted

    class Meta:
        unique_together = ("user", "page", "action")
        verbose_name_plural = "Permission Overrides"

    def __str__(self):
        status = "Blocked" if self.is_blocked else "Granted"
        return f"{self.user.email} - {self.page}.{self.action} - {status}"


def get_user_effective_permissions(user):
    """
    Calculate effective permissions for a user:
    1. Direct UserPermissions (primary)
    2. + Role Permissions (if role assigned)
    3. - PermissionOverrides that block
    
    Returns dict: {page: {can_view, can_add, can_edit, can_delete}}
    """
    effective = {}

    # Step 1: Merge role permissions (Baseline)
    if user.role:
        role_perms = Permission.objects.filter(role=user.role)
        for perm in role_perms:
            effective[perm.page] = {
                'can_view': perm.can_view,
                'can_add': perm.can_add,
                'can_edit': perm.can_edit,
                'can_delete': perm.can_delete,
            }

    # Step 2: Overwrite with direct user permissions (Precedence)
    user_perms = UserPermission.objects.filter(user=user)
    for perm in user_perms:
        effective[perm.page] = {
            'can_view': perm.can_view,
            'can_add': perm.can_add,
            'can_edit': perm.can_edit,
            'can_delete': perm.can_delete,
        }

    # Step 3: Apply overrides (blocks take precedence)
    overrides = PermissionOverride.objects.filter(user=user, is_blocked=True)
    for override in overrides:
        if override.page in effective:
            effective[override.page][override.action] = False

    return effective


def has_user_permission(user, page, action):
    """
    Quick permission check for a specific user action
    """
    if user.role and user.role.name == "Superadmin":
        return True

    effective = get_user_effective_permissions(user)
    return effective.get(page, {}).get(f'can_{action}', False)


@receiver(post_save, sender=Role)
def set_default_permissions(sender, instance, created, **kwargs):
    if created:
        default_pages = [
            {"page": "admin", "can_view": True, "can_add": False, "can_edit": False, "can_delete": False},
            {"page": "profile", "can_view": True, "can_add": False, "can_edit": False, "can_delete": False},
        ]
        for page in default_pages:
            Permission.objects.get_or_create(
                role=instance,
                page=page["page"],
                defaults={
                    "can_view": page["can_view"],
                    "can_add": page["can_add"],
                    "can_edit": page["can_edit"],
                    "can_delete": page["can_delete"]
                }
            )

@receiver(post_save, sender=CustomUser)
def set_default_user_permissions(sender, instance, created, **kwargs):
    if created:
        default_pages = ["admin", "profile"]
        for page in default_pages:
            UserPermission.objects.get_or_create(
                user=instance,
                page=page,
                defaults={"can_view": True}
            )