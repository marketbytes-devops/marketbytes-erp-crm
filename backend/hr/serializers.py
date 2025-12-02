from rest_framework import serializers
from .models import (
    Attendance, Holiday, LeaveType, Leave,
    Overtime, Candidate, Performance
)
from authapp.serializers import UserSerializer
from authapp.models import CustomUser

class AttendanceSerializer(serializers.ModelSerializer):
    employee = UserSerializer(read_only=True)
    employee_id = serializers.PrimaryKeyRelatedField(
        queryset=CustomUser.objects.all(), source='employee', write_only=True
    )
    total_hours = serializers.SerializerMethodField()

    class Meta:
        model = Attendance
        fields = '__all__'
        read_only_fields = ['total_hours', 'created_at', 'updated_at']

    def get_total_hours(self, obj):
        return obj.calculate_hours()

class AttendanceCheckInOutSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=['in', 'out'])
    working_from = serializers.CharField(max_length=100, required=False, default="Office")

class AttendanceStatusSerializer(serializers.Serializer):
    checked_in = serializers.BooleanField()
    clock_in = serializers.CharField(allow_null=True)
    message = serializers.CharField()

class HolidaySerializer(serializers.ModelSerializer):
    class Meta:
        model = Holiday
        fields = '__all__'

class LeaveTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveType
        fields = '__all__'

class LeaveSerializer(serializers.ModelSerializer):
    employee = UserSerializer(read_only=True)
    leave_type_name = serializers.CharField(source='leave_type.name', read_only=True)
    total_days = serializers.SerializerMethodField()

    class Meta:
        model = Leave
        fields = '__all__'

    def get_total_days(self, obj):
        return obj.total_days()

class OvertimeSerializer(serializers.ModelSerializer):
    employee = UserSerializer(read_only=True)

    class Meta:
        model = Overtime
        fields = '__all__'

class CandidateSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)

    class Meta:
        model = Candidate
        fields = '__all__'

class PerformanceSerializer(serializers.ModelSerializer):
    employee = UserSerializer(read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)

    class Meta:
        model = Performance
        fields = '__all__'