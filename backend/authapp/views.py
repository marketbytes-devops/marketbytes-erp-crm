from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny, BasePermission
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.utils import timezone
from datetime import timedelta
import random
import string
from django.core.mail import send_mail
from django.conf import settings
from django.db.models import Count
from .models import CustomUser, Role, Permission, Department, UserPermission, PermissionOverride, has_user_permission, get_user_effective_permissions
from .serializers import (
    LoginSerializer, RequestOTPSerializer, ResetPasswordSerializer,
    ProfileSerializer, ChangePasswordSerializer, RoleSerializer,
    RoleCreateSerializer, PermissionSerializer, UserUpdateSerializer,
    UserCreateSerializer, CustomTokenObtainPairSerializer, DepartmentSerializer,
    UserPermissionSerializer, PermissionOverrideSerializer
)

from .permissions import HasPermission, has_permission

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class LoginView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = authenticate(request, email=serializer.validated_data['email'],
                                password=serializer.validated_data['password'])
            if user:
                refresh = RefreshToken.for_user(user)
                return Response({'access': str(refresh.access_token), 'refresh': str(refresh)})
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class RequestOTPView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        serializer = RequestOTPSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data["email"]
            try:
                user = CustomUser.objects.get(email=email)
                otp = "".join(random.choices(string.digits, k=6))
                user.otp = otp
                user.otp_created_at = timezone.now()
                user.save()
                send_mail("Your OTP", f"Your OTP is {otp}. Valid for 10 minutes.", settings.EMAIL_HOST_USER, [email])
                return Response({"message": "OTP sent"})
            except CustomUser.DoesNotExist:
                return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ResetPasswordView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data["email"]
            otp = serializer.validated_data["otp"]
            try:
                user = CustomUser.objects.get(email=email)
                if (timezone.now() - user.otp_created_at) > timedelta(minutes=10):
                    return Response({"error": "OTP expired"}, status=status.HTTP_400_BAD_REQUEST)
                if user.otp == otp:
                    user.set_password(serializer.validated_data["new_password"])
                    user.otp = user.otp_created_at = None
                    user.save()
                    return Response({"message": "Password reset successful"})
                return Response({"error": "Invalid OTP"}, status=status.HTTP_400_BAD_REQUEST)
            except CustomUser.DoesNotExist:
                return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ProfileView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        serializer = ProfileSerializer(request.user, context={'request': request})
        return Response(serializer.data)
    
    def put(self, request):
        serializer = UserUpdateSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(ProfileSerializer(request.user, context={'request': request}).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        if serializer.is_valid():
            request.user.set_password(serializer.validated_data["new_password"])
            request.user.save()
            return Response({"message": "Password changed"})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class RoleView(APIView):
    permission_classes = [HasPermission]
    page_name = 'roles'
    
    def get(self, request):
        roles = Role.objects.all().annotate(member_count=Count('users'))
        serializer = RoleSerializer(roles, many=True)
        return Response(serializer.data)
    
    def post(self, request):
        if request.user.role.name != "Superadmin":
            return Response({'error': 'Only Superadmin'}, status=status.HTTP_403_FORBIDDEN)
        serializer = RoleCreateSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class RoleDetailView(APIView):
    permission_classes = [IsAuthenticated]
    page_name = 'roles'
    def get(self, request, pk):
        try:
            role = Role.objects.get(pk=pk)
            if role != request.user.role and request.user.role.name != "Superadmin":
                return Response({'error': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
            return Response(RoleSerializer(role).data)
        except Role.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

    def put(self, request, pk):
        if not has_permission(request.user, 'roles', 'edit'):
            return Response({'error': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        try:
            role = Role.objects.get(pk=pk)
            serializer = RoleSerializer(role, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Role.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, pk):
        if not has_permission(request.user, 'roles', 'delete'):
            return Response({'error': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        try:
            role = Role.objects.get(pk=pk)
            role.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Role.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

class PermissionView(APIView):
    permission_classes = [HasPermission]
    page_name = 'permissions'
    def post(self, request):
        if request.user.role.name != "Superadmin":
            return Response({'error': 'Only Superadmin'}, status=status.HTTP_403_FORBIDDEN)
        serializer = PermissionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PermissionListView(APIView):
    permission_classes = [HasPermission]
    page_name = 'permissions'
    def get(self, request):
        permissions = Permission.objects.all()
        return Response(PermissionSerializer(permissions, many=True).data)

class PermissionDetailView(APIView):
    permission_classes = [HasPermission]
    page_name = 'permissions'
    def put(self, request, pk):
        if request.user.role.name != "Superadmin":
            return Response({'error': 'Only Superadmin'}, status=status.HTTP_403_FORBIDDEN)
        try:
            perm = Permission.objects.get(pk=pk)
            serializer = PermissionSerializer(perm, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Permission.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, pk):
        if request.user.role.name != "Superadmin":
            return Response({'error': 'Only Superadmin'}, status=status.HTTP_403_FORBIDDEN)
        try:
            perm = Permission.objects.get(pk=pk)
            perm.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Permission.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

class UserManagementView(APIView):
    permission_classes = [HasPermission]
    page_name = 'users'
    
    def get(self, request):
        users = CustomUser.objects.all().select_related('role', 'department', 'reports_to')
        serializer = ProfileSerializer(users, many=True, context={'request': request})
        return Response(serializer.data)
    
    def post(self, request):
        if not has_permission(request.user, 'users', 'add'):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = UserCreateSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(ProfileSerializer(user, context={'request': request}).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserDetailView(APIView):
    permission_classes = [IsAuthenticated]
    page_name = 'users'
    
    def get_object(self, pk, request_user):
        try:
            user = CustomUser.objects.get(pk=pk)
            if user.id != request_user.id and not has_permission(request_user, 'users', 'view'):
                return None
            return user
        except CustomUser.DoesNotExist:
            return None
    
    def get(self, request, pk):
        user = self.get_object(pk, request.user)
        if not user:
            return Response({'error': 'Not found or permission denied'}, 
                           status=status.HTTP_404_NOT_FOUND)
        
        serializer = ProfileSerializer(user, context={'request': request})
        return Response(serializer.data)
    
    def put(self, request, pk):
        user = self.get_object(pk, request.user)
        if not user:
            return Response({'error': 'Not found or permission denied'}, 
                           status=status.HTTP_404_NOT_FOUND)
            
        if user.id != request.user.id and not has_permission(request.user, 'users', 'edit'):
            return Response({'error': 'Permission denied'}, 
                           status=status.HTTP_403_FORBIDDEN)
        
        serializer = UserUpdateSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(ProfileSerializer(user, context={'request': request}).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, pk):
        if not has_permission(request.user, 'users', 'delete'):
            return Response({'error': 'Permission denied'}, 
                           status=status.HTTP_403_FORBIDDEN)
        
        try:
            user = CustomUser.objects.get(pk=pk)
            if user.id == request.user.id:
                return Response({'error': 'Cannot delete your own account'}, 
                               status=status.HTTP_400_BAD_REQUEST)
            user.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except CustomUser.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [HasPermission]
    page_name = 'departments'