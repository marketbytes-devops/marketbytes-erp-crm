from rest_framework import serializers
from .models import CustomUser, Role, Permission, Department, UserPermission, PermissionOverride, get_user_effective_permissions, Designation
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.conf import settings
from django.core.mail import send_mail
import random
import string
import json
import logging
import threading

logger = logging.getLogger(__name__)

def _send_email_async(subject, message, recipient_list):
    def run():
        try:
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                recipient_list,
                fail_silently=False
            )
            print(f"DEBUG: Email sent successfully to {recipient_list}")
        except Exception as e:
            print(f"DEBUG: Failed to send email to {recipient_list}: {e}")
            logger.error(f"Failed to send email to {recipient_list}: {e}")
    
    thread = threading.Thread(target=run)
    thread.start()

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

class DesignationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Designation
        fields = ['id', 'name', 'description']

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
    designation = DesignationSerializer(read_only=True)
    role_id = serializers.PrimaryKeyRelatedField(queryset=Role.objects.all(), source='role', write_only=True, required=False, allow_null=True)
    department_id = serializers.PrimaryKeyRelatedField(queryset=Department.objects.all(), source='department', write_only=True, required=False, allow_null=True)
    designation_id = serializers.PrimaryKeyRelatedField(queryset=Designation.objects.all(), source='designation', write_only=True, required=False, allow_null=True)
    direct_permissions = UserPermissionSerializer(many=True, read_only=True)
    effective_permissions = serializers.SerializerMethodField()
    image = serializers.ImageField(required=False)
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = ['id', 'first_name','last_name', 'email', 'name', 'employee_id', 'status', 'role', 'role_id', 'department', 'department_id', 'designation', 'designation_id', 'exit_date', 'direct_permissions', 'effective_permissions', 'image', 'image_url']

    def get_effective_permissions(self, obj):
        """Returns computed effective permissions for the user"""
        effective = get_user_effective_permissions(obj)
        return effective

    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None

class ProfileSerializer(serializers.ModelSerializer):
    role = RoleSerializer(read_only=True)
    department = DepartmentSerializer(read_only=True)
    designation = DesignationSerializer(read_only=True)
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
    designation_id = serializers.PrimaryKeyRelatedField(
        queryset=Designation.objects.all(), 
        source='designation', 
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
            'id', 'email', 'name', 'employee_id', 'address',
            'phone_number', 'mobile', 'country_code', 'image', 'image_url',
            'role', 'role_id', 'department', 'department_id', 'designation', 'designation_id', 'reports_to',
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
    designation_id = serializers.PrimaryKeyRelatedField(
        queryset=Designation.objects.all(), 
        source='designation', 
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
            'id', 'email', 'name', 'employee_id', 'address', 
            'phone_number', 'mobile', 'country_code', 'image', 'role_id',
            'department_id', 'designation_id', 'reports_to_id', 'joining_date', 'dob',
            'probation_period', 'exit_date', 'gender', 'skills', 'hourly_rate',
            'status', 'login_enabled', 'email_notifications', 'password',
            'send_password_email'
        ]
        read_only_fields = ['id', 'employee_id']
    
    def validate_dob(self, value):
        if value:
            from datetime import date
            today = date.today()
            age = today.year - value.year - ((today.month, today.day) < (value.month, value.day))
            if age < 18:
                raise serializers.ValidationError("Employee must be at least 18 years old.")
        return value
    
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
            

        
        if not password:
            password_length = 12
            characters = string.ascii_letters + string.digits + string.punctuation
            password = ''.join(random.choice(characters) for _ in range(password_length))
            send_password_email = True
        
        user = CustomUser(**validated_data)
        user.set_password(password)
        user.save()
        

        
        if send_password_email:
            print(f"DEBUG: Attempting to send email to {user.email} in background")
            subject = 'Your Account Credentials'
            message = f"""Hello {user.name},

Your account has been created successfully.

Login Details:
Email: {user.email}
Password: {password}

Please change your password after your first login.

Best regards,
HR Team"""
            _send_email_async(subject, message, [user.email])
        
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
    designation_id = serializers.PrimaryKeyRelatedField(
        queryset=Designation.objects.all(), 
        source='designation', 
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
    generate_password = serializers.BooleanField(write_only=True, default=False)
    
    class Meta:
        model = CustomUser
        fields = [
            'name', 'address', 'phone_number', 'mobile', 
            'country_code', 'image', 'role_id', 'department_id', 'designation_id',
            'reports_to_id', 'joining_date', 'dob', 'probation_period',
            'exit_date', 'gender', 'skills', 'hourly_rate', 'status',
            'login_enabled', 'email_notifications', 'password',
            'send_password_email', 'generate_password', 'user_permissions'
        ]

    user_permissions = serializers.JSONField(write_only=True, required=False)
    
    def validate_dob(self, value):
        if value:
            from datetime import date
            today = date.today()
            age = today.year - value.year - ((today.month, today.day) < (value.month, value.day))
            if age < 18:
                raise serializers.ValidationError("Employee must be at least 18 years old.")
        return value
    

    
    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        send_password_email = validated_data.pop('send_password_email', False)
        generate_password = validated_data.pop('generate_password', False)
        user_permissions = validated_data.pop('user_permissions', None)
        
        # Robustly handle string 'true' from FormData
        if isinstance(send_password_email, str):
            send_password_email = send_password_email.lower() == 'true'
        
        if isinstance(generate_password, str):
            generate_password = generate_password.lower() == 'true'
            
        
        if generate_password:
            password_length = 12
            characters = string.ascii_letters + string.digits + string.punctuation
            password = ''.join(random.choice(characters) for _ in range(password_length))
            send_password_email = True

        
        if password:
            instance.set_password(password)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()

        # Handle user permissions saving
        if user_permissions is not None:
            # Clear existing direct permissions
            UserPermission.objects.filter(user=instance).delete()
            
            # Create new permissions
            new_perms = []
            for perm_data in user_permissions:
                new_perms.append(UserPermission(
                    user=instance,
                    page=perm_data.get('page'),
                    can_view=perm_data.get('can_view', False),
                    can_add=perm_data.get('can_add', False),
                    can_edit=perm_data.get('can_edit', False),
                    can_delete=perm_data.get('can_delete', False),
                ))
            
            if new_perms:
                UserPermission.objects.bulk_create(new_perms)

        if send_password_email and password:
            print(f"DEBUG: Attempting to send update email to {instance.email} in background")
            subject = 'Your Account Credentials Updated'
            message = f"""Hello {instance.name},

Your account details have been updated.

Login Details:
Email: {instance.email}
Password: {password}

Please change your password after logging in.

Best regards,
HR Team"""
            _send_email_async(subject, message, [instance.email])
        
        return instance

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role.name if user.role else None
        token['department'] = user.department.name if user.department else None
        return token