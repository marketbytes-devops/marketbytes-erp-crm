from rest_framework import serializers
from .models import (
    Project,
    ProjectCategory,
    ProjectStatus,
    ProjectStage,
    Client
)
from authapp.serializers import ProfileSerializer
from authapp.models import CustomUser, Department



class ProjectCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectCategory
        fields = ['id', 'name', 'description', 'created_at']
        read_only_fields = ['created_at']


class ProjectStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectStatus
        fields = ['id', 'name', 'description']


class ProjectStageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectStage
        fields = ['id', 'name', 'description']


class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = ['id', 'name', 'email', 'phone', 'address', 'created_at', 'password']
        read_only_fields = ['created_at']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        instance = super().create(validated_data)
        if password:
            instance.set_password(password)
            instance.save()
        return instance

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        instance = super().update(instance, validated_data)
        if password:
            instance.set_password(password)
            instance.save()
        return instance


class ProjectSerializer(serializers.ModelSerializer):
    # Readable nested outputs
    category = ProjectCategorySerializer(read_only=True)
    department = serializers.StringRelatedField(read_only=True)
    status = ProjectStatusSerializer(read_only=True)
    stage = ProjectStageSerializer(read_only=True)
    client = ClientSerializer(read_only=True)
    members = ProfileSerializer(many=True, read_only=True)

    # Write-only ID fields
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=ProjectCategory.objects.all(),
        source='category',
        write_only=True,
        required=False,
        allow_null=True
    )

    department_id = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(),
        source='department',
        write_only=True,
        required=False,
        allow_null=True
    )

    status_id = serializers.PrimaryKeyRelatedField(
        queryset=ProjectStatus.objects.all(),
        source='status',
        write_only=True,
        required=False,
        allow_null=True
    )

    stage_id = serializers.PrimaryKeyRelatedField(
        queryset=ProjectStage.objects.all(),
        source='stage',
        write_only=True,
        required=False,
        allow_null=True
    )

    client_id = serializers.PrimaryKeyRelatedField(
        queryset=Client.objects.all(),
        source='client',
        write_only=True,
        required=False,
        allow_null=True
    )

    members_ids = serializers.PrimaryKeyRelatedField(
        queryset=CustomUser.objects.all(),
        many=True,
        write_only=True,
        required=False
    )

    class Meta:
        model = Project
        fields = [
            'id',
            'name',

            'category', 'category_id',
            'department', 'department_id',

            'start_date', 'deadline', 'no_deadline', 'amc_date',
            'allow_manual_timelogs', 'allocated_hours',

            'members', 'members_ids',
            'summary', 'notes',

            'client', 'client_id',
            'client_can_manage_tasks', 'send_task_notifications_to_client',

            'budget', 'currency',

            'status', 'status_id',
            'stage', 'stage_id',

            'files',

            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def create(self, validated_data):
        members_ids = validated_data.pop('members_ids', [])
        project = super().create(validated_data)
        if members_ids:
            project.members.set(members_ids)
        return project

    def update(self, instance, validated_data):
        members_ids = validated_data.pop('members_ids', None)
        project = super().update(instance, validated_data)
        if members_ids is not None:
            project.members.set(members_ids)
        return project
