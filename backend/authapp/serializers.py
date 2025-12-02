from rest_framework import serializers
from .models import CustomUser, Role, Permission, Department
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.conf import settings
from django.core.mail import send_mail
import random
import string

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

class RoleSerializer(serializers.ModelSerializer):
    member_count = serializers.IntegerField(read_only=True)

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
    role_id = serializers.PrimaryKeyRelatedField(queryset=Role.objects.all(), source='role', write_only=True, required=False)
    department_id = serializers.PrimaryKeyRelatedField(queryset=Department.objects.all(), source='department', write_only=True, required=False, allow_null=True)

    class Meta:
        model = CustomUser
        fields = ['id', 'email', 'username', 'name', 'employee_id', 'status', 'role', 'role_id', 'department', 'department_id']

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
            'updated_at'
        ]
        read_only_fields = ['id', 'email', 'employee_id', 'created_at', 'updated_at', 'image_url']

class UserCreateSerializer(serializers.ModelSerializer):
    role_id = serializers.PrimaryKeyRelatedField(
        queryset=Role.objects.all(), 
        source='role', 
        required=True
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
            'id', 'email', 'name', 'username', 'employee_id', 'address', 
            'phone_number', 'mobile', 'country_code', 'image', 'role_id',
            'department_id', 'reports_to_id', 'joining_date', 'dob',
            'probation_period', 'exit_date', 'gender', 'skills', 'hourly_rate',
            'status', 'login_enabled', 'email_notifications', 'password',
            'send_password_email'
        ]
        read_only_fields = ['id', 'employee_id']
    
    def validate_email(self, value):
        if CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value
    
    def create(self, validated_data):
        password = validated_data.pop('password', None)
        send_password_email = validated_data.pop('send_password_email', False)
        
        if not password:
            password_length = 12
            characters = string.ascii_letters + string.digits + string.punctuation
            password = ''.join(random.choice(characters) for _ in range(password_length))
            send_password_email = True
        
        user = CustomUser(**validated_data)
        user.set_password(password)
        user.save()
        
        if send_password_email:
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
                    settings.EMAIL_HOST_USER, 
                    [user.email],
                    fail_silently=False
                )
            except Exception as e:
                print(f"Failed to send email: {e}")
        
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
            'send_password_email'
        ]
    
    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        send_password_email = validated_data.pop('send_password_email', False)
        
        if password:
            instance.set_password(password)
            if send_password_email:
                pass
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        return instance

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role.name if user.role else None
        token['department'] = user.department.name if user.department else None
        return token