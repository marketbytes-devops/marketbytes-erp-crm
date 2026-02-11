from rest_framework import serializers
from .models import CustomUser, Role, Permission, Department, UserPermission, PermissionOverride, get_user_effective_permissions
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.conf import settings
from django.core.mail import send_mail
import random
import string
import json
import logging

logger = logging.getLogger(__name__)

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

class RequestOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()

class ResetPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6, min_length=6)
    new_password = serializers.CharField(write_only=True)

class ChangePasswordSerializer(serializers.Serializer):
    new_password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, data):
        if data["new_password"] != data["confirm_password"]:
            raise serializers.ValidationError("Passwords do not match")
        return data

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ['id', 'name', 'worksheet_url', 'services']

class PermissionSerializer(serializers.ModelSerializer):
    role = serializers.PrimaryKeyRelatedField(queryset=Role.objects.all())

    class Meta:
        model = Permission
        fields = ['id', 'role', 'page', 'can_view', 'can_add', 'can_edit', 'can_delete']


class UserPermissionSerializer(serializers.ModelSerializer):
    """Serializer for direct user-level permissions"""
    class Meta:
        model = UserPermission
        fields = ['id', 'page', 'can_view', 'can_add', 'can_edit', 'can_delete']


class PermissionOverrideSerializer(serializers.ModelSerializer):
    """Serializer for permission overrides"""
    class Meta:
        model = PermissionOverride
        fields = ['id', 'page', 'action', 'is_blocked']

class RoleSerializer(serializers.ModelSerializer):
    member_count = serializers.IntegerField(read_only=True)
    permissions = PermissionSerializer(many=True, read_only=True)

    class Meta:
        model = Role
        fields = ['id', 'name', 'description', 'member_count', 'permissions']

class RoleCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['id', 'name', 'description']
        read_only_fields = ['id']

class UserSerializer(serializers.ModelSerializer):
    role = RoleSerializer(read_only=True)
    department = DepartmentSerializer(read_only=True)
    role_id = serializers.PrimaryKeyRelatedField(queryset=Role.objects.all(), source='role', write_only=True, required=False, allow_null=True)
    department_id = serializers.PrimaryKeyRelatedField(queryset=Department.objects.all(), source='department', write_only=True, required=False, allow_null=True)
    direct_permissions = UserPermissionSerializer(many=True, read_only=True)
    effective_permissions = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = ['id', 'first_name','last_name', 'email', 'username', 'name', 'employee_id', 'status', 'role', 'role_id', 'department', 'department_id', 'direct_permissions', 'effective_permissions']

    def get_effective_permissions(self, obj):
        """Returns computed effective permissions for the user"""
        effective = get_user_effective_permissions(obj)
        return effective

class ProfileSerializer(serializers.ModelSerializer):
    role = RoleSerializer(read_only=True)
    department = DepartmentSerializer(read_only=True)
    reports_to = UserSerializer(read_only=True)
    
    image = serializers.ImageField(required=False)
    image_url = serializers.SerializerMethodField()
    
    role_id = serializers.PrimaryKeyRelatedField(
        queryset=Role.objects.all(), 
        source='role', 
        write_only=True, 
        required=False
    )
    department_id = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(), 
        source='department', 
        write_only=True, 
        required=False, 
        allow_null=True
    )
    reports_to_id = serializers.PrimaryKeyRelatedField(
        queryset=CustomUser.objects.all(), 
        source='reports_to', 
        write_only=True, 
        required=False, 
        allow_null=True
    )
    direct_permissions = UserPermissionSerializer(many=True, read_only=True)
    effective_permissions = serializers.SerializerMethodField()

    def get_effective_permissions(self, obj):
        return get_user_effective_permissions(obj)
    
    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None
    
    class Meta:
        model = CustomUser
        fields = [
            'id', 'email', 'name', 'username', 'employee_id', 'address',
            'phone_number', 'mobile', 'country_code', 'image', 'image_url',
            'role', 'role_id', 'department', 'department_id', 'reports_to',
            'reports_to_id', 'joining_date', 'dob', 'probation_period',
            'exit_date', 'gender', 'skills', 'hourly_rate', 'status',
            'login_enabled', 'email_notifications', 'created_at',
            'updated_at', 'direct_permissions', 'effective_permissions'
        ]
        read_only_fields = ['id', 'email', 'employee_id', 'created_at', 'updated_at', 'image_url']

class UserCreateSerializer(serializers.ModelSerializer):
    role_id = serializers.PrimaryKeyRelatedField(
        queryset=Role.objects.all(), 
        source='role', 
        required=False,  # NOW OPTIONAL
        allow_null=True
    )
    department_id = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(), 
        source='department', 
        required=False, 
        allow_null=True
    )
    reports_to_id = serializers.PrimaryKeyRelatedField(
        queryset=CustomUser.objects.all(), 
        source='reports_to', 
        required=False, 
        allow_null=True
    )
    password = serializers.CharField(write_only=True, required=False)
    send_password_email = serializers.BooleanField(write_only=True, default=False)
    user_permissions = serializers.JSONField(
        write_only=True,
        required=False,
        help_text="List of permissions: [{page: 'employees', can_view: True, can_add: False, ...}]"
    )
    permission_overrides = serializers.JSONField(
        write_only=True,
        required=False,
        help_text="List of overrides: [{page: 'employees', action: 'can_view', is_blocked: True}]"
    )
    
    class Meta:
        model = CustomUser
        fields = [
            'id', 'email', 'name', 'username', 'employee_id', 'address', 
            'phone_number', 'mobile', 'country_code', 'image', 'role_id',
            'department_id', 'reports_to_id', 'joining_date', 'dob',
            'probation_period', 'exit_date', 'gender', 'skills', 'hourly_rate',
            'status', 'login_enabled', 'email_notifications', 'password',
            'send_password_email', 'user_permissions', 'permission_overrides'
        ]
        read_only_fields = ['id', 'employee_id']
    
    def validate_email(self, value):
        if CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value
    
    def create(self, validated_data):
        password = validated_data.pop('password', None)
        send_password_email = validated_data.pop('send_password_email', False)
        
        # Robustly handle string 'true' from FormData
        if isinstance(send_password_email, str):
            send_password_email = send_password_email.lower() == 'true'
            
        user_permissions_data = validated_data.pop('user_permissions', [])
        permission_overrides_data = validated_data.pop('permission_overrides', [])

        # Handle stringified JSON from FormData
        if isinstance(user_permissions_data, str):
            try:
                user_permissions_data = json.loads(user_permissions_data)
            except (json.JSONDecodeError, TypeError):
                user_permissions_data = []

        if isinstance(permission_overrides_data, str):
            try:
                permission_overrides_data = json.loads(permission_overrides_data)
            except (json.JSONDecodeError, TypeError):
                permission_overrides_data = []
        
        if not password:
            password_length = 12
            characters = string.ascii_letters + string.digits + string.punctuation
            password = ''.join(random.choice(characters) for _ in range(password_length))
            send_password_email = True
        
        user = CustomUser(**validated_data)
        user.set_password(password)
        user.save()
        
        for perm_data in user_permissions_data:
            page = str(perm_data.get('page', '')).lower()
            UserPermission.objects.get_or_create(user=user, page=page, defaults={
                'can_view': perm_data.get('can_view', False),
                'can_add': perm_data.get('can_add', False),
                'can_edit': perm_data.get('can_edit', False),
                'can_delete': perm_data.get('can_delete', False),
            })
        
        # Create permission overrides
        for override_data in permission_overrides_data:
            PermissionOverride.objects.get_or_create(user=user, page=override_data.get('page'), action=override_data.get('action'), defaults={
                'is_blocked': override_data.get('is_blocked', False)
            })
        
        if send_password_email:
            print(f"DEBUG: Attempting to send email to {user.email}")
            subject = 'Your Account Credentials'
            message = f"""Hello {user.name},

Your account has been created successfully.

Login Details:
Email: {user.email}
Password: {password}

Please change your password after your first login.

Best regards,
HR Team"""
            
            try:
                send_mail(
                    subject, 
                    message, 
                    settings.DEFAULT_FROM_EMAIL, 
                    [user.email],
                    fail_silently=False
                )
                print(f"DEBUG: Email sent successfully to {user.email}")
            except Exception as e:
                print(f"DEBUG: Failed to send email: {e}")
                logger.error(f"Failed to send registration email to {user.email}: {e}")
        
        return user

class UserUpdateSerializer(serializers.ModelSerializer):
    role_id = serializers.PrimaryKeyRelatedField(
        queryset=Role.objects.all(), 
        source='role', 
        required=False
    )
    department_id = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(), 
        source='department', 
        required=False, 
        allow_null=True
    )
    reports_to_id = serializers.PrimaryKeyRelatedField(
        queryset=CustomUser.objects.all(), 
        source='reports_to', 
        required=False, 
        allow_null=True
    )
    password = serializers.CharField(write_only=True, required=False)
    send_password_email = serializers.BooleanField(write_only=True, default=False)
    
    class Meta:
        model = CustomUser
        fields = [
            'name', 'username', 'address', 'phone_number', 'mobile', 
            'country_code', 'image', 'role_id', 'department_id', 
            'reports_to_id', 'joining_date', 'dob', 'probation_period',
            'exit_date', 'gender', 'skills', 'hourly_rate', 'status',
            'login_enabled', 'email_notifications', 'password',
            'send_password_email', 'user_permissions', 'permission_overrides'
        ]
    
    user_permissions = serializers.JSONField(
        write_only=True,
        required=False
    )
    permission_overrides = serializers.JSONField(
        write_only=True,
        required=False
    )
    
    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        send_password_email = validated_data.pop('send_password_email', False)
        
        # Robustly handle string 'true' from FormData
        if isinstance(send_password_email, str):
            send_password_email = send_password_email.lower() == 'true'
            
        user_permissions_data = validated_data.pop('user_permissions', None)
        permission_overrides_data = validated_data.pop('permission_overrides', None)
        
        if password:
            instance.set_password(password)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()

        # Update direct user permissions if provided
        if user_permissions_data is not None:
            # Handle stringified JSON from FormData (for user_permissions)
            if isinstance(user_permissions_data, str):
                try:
                    user_permissions_data = json.loads(user_permissions_data)
                except (json.JSONDecodeError, TypeError):
                    user_permissions_data = []

            # Clear existing direct permissions for this user
            UserPermission.objects.filter(user=instance).delete()
            for perm_data in user_permissions_data:
                page = str(perm_data.get('page', '')).lower()
                UserPermission.objects.get_or_create(user=instance, page=page, defaults={
                    'can_view': perm_data.get('can_view', False),
                    'can_add': perm_data.get('can_add', False),
                    'can_edit': perm_data.get('can_edit', False),
                    'can_delete': perm_data.get('can_delete', False),
                })

        # Update permission overrides if provided
        if permission_overrides_data is not None:
            # Handle stringified JSON from FormData (for permission_overrides)
            if isinstance(permission_overrides_data, str):
                try:
                    permission_overrides_data = json.loads(permission_overrides_data)
                except (json.JSONDecodeError, TypeError):
                    permission_overrides_data = []

            # Clear existing overrides for this user
            PermissionOverride.objects.filter(user=instance).delete()
            for override_data in permission_overrides_data:
                page = str(override_data.get('page', '')).lower()
                PermissionOverride.objects.get_or_create(user=instance, page=page, action=override_data.get('action'), defaults={
                    'is_blocked': override_data.get('is_blocked', False)
                })

        if send_password_email and password:
            print(f"DEBUG: Attempting to send update email to {instance.email}")
            subject = 'Your Account Credentials Updated'
            message = f"""Hello {instance.name},

Your account details have been updated.

Login Details:
Email: {instance.email}
Password: {password}

Please change your password after logging in.

Best regards,
HR Team"""
            
            try:
                send_mail(
                    subject, 
                    message, 
                    settings.DEFAULT_FROM_EMAIL, 
                    [instance.email],
                    fail_silently=False
                )
                print(f"DEBUG: Update email sent successfully to {instance.email}")
            except Exception as e:
                print(f"DEBUG: Failed to send update email: {e}")
                logger.error(f"Failed to send update email to {instance.email}: {e}")
        
        return instance

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role.name if user.role else None
        token['department'] = user.department.name if user.department else None
        return token