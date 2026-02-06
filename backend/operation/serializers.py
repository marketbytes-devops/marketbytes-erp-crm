from rest_framework import serializers
from django.utils import timezone
from .models import (
    Project,
    ProjectCategory,
    ProjectStatus,
    ProjectStage,
    Client,
    ProjectFile,
    Currency,
    Task,
    Scrum,
)
from authapp.serializers import ProfileSerializer, DepartmentSerializer
from authapp.models import CustomUser, Department
from .models import Scrum
from django.utils import timezone
class ProjectCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectCategory
        fields = ["id", "name", "description", "created_at"]
        read_only_fields = ["created_at"]


class ProjectStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectStatus
        fields = ["id", "name", "description"]


class ProjectStageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectStage
        fields = ["id", "name", "description"]


class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = ["id", "name", "email", "phone",
                  "address", "created_at", "password"]
        read_only_fields = ["created_at"]
        extra_kwargs = {"password": {"write_only": True}}

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        instance = super().create(validated_data)
        if password:
            instance.set_password(password)
            instance.save()
        return instance

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        instance = super().update(instance, validated_data)
        if password:
            instance.set_password(password)
            instance.save()
        return instance


class ProjectFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectFile
        fields = [
            "id",
            "file",
            "original_name",
            "file_size",
            "uploaded_at",
            "uploaded_by",
        ]
        read_only_fields = ["original_name",
                            "file_size", "uploaded_at", "uploaded_by"]


class CurrencySerializer(serializers.ModelSerializer):
    class Meta:
        model = Currency
        fields = ["id", "code", "name", "symbol"]


class ProjectSerializer(serializers.ModelSerializer):
    category = ProjectCategorySerializer(read_only=True)
    department = DepartmentSerializer(read_only=True)
    status = ProjectStatusSerializer(read_only=True)
    stage = ProjectStageSerializer(read_only=True)
    client = ClientSerializer(read_only=True)
    members = ProfileSerializer(many=True, read_only=True)
    project_files = ProjectFileSerializer(many=True, read_only=True)
    currency = CurrencySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=ProjectCategory.objects.all(),
        source="category",
        required=False,
        allow_null=True,
    )

    department_id = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(),
        source="department",
        required=False,
        allow_null=True,
    )

    status_id = serializers.PrimaryKeyRelatedField(
        queryset=ProjectStatus.objects.all(),
        source="status",
        required=False,
        allow_null=True,
    )

    stage_id = serializers.PrimaryKeyRelatedField(
        queryset=ProjectStage.objects.all(),
        source="stage",
        required=False,
        allow_null=True,
    )

    client_id = serializers.PrimaryKeyRelatedField(
        queryset=Client.objects.all(),
        source="client",
        required=False,
        allow_null=True,
    )

    members_ids = serializers.PrimaryKeyRelatedField(
        queryset=CustomUser.objects.all(),
        source="members",
        many=True,
        write_only=True,
        required=False,
        allow_empty=True,
    )

    currency_id = serializers.PrimaryKeyRelatedField(
        queryset=Currency.objects.all(),
        source="currency",
        required=False,
        allow_null=True,
    )

    files = serializers.ListField(
        child=serializers.FileField(max_length=100000, allow_empty_file=False),
        write_only=True,
        required=False,
    )

    category_name = serializers.CharField(
        write_only=True, required=False, allow_blank=True
    )
    status_name = serializers.CharField(
        write_only=True, required=False, allow_blank=True
    )
    stage_name = serializers.CharField(
        write_only=True, required=False, allow_blank=True
    )
    client_name = serializers.CharField(
        write_only=True, required=False, allow_blank=True
    )

    class Meta:
        model = Project
        fields = [
            "id",
            "name",
            "client_name",
            "category",
            "category_name",
            "category_id",
            "department",
            "department_id",
            "start_date",
            "deadline",
            "no_deadline",
            "amc",
            "amc_date",
            "renewal_only",
            "dm",
            "allow_manual_timelogs",
            "hours_allocated",
            "members",
            "members_ids",
            "summary",
            "notes",
            "client",
            "client_id",
            "client_can_manage_tasks",
            "send_task_notifications_to_client",
            "budget",
            "currency",
            "currency_id",
            "status",
            "status_id",
            "status_name",
            "stage",
            "stage_id",
            "stage_name",
            "files",
            "project_files",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "project_files"]

    def create(self, validated_data):
        files = validated_data.pop("files", [])
        category_name = validated_data.pop("category_name", None)
        status_name = validated_data.pop("status_name", None)
        stage_name = validated_data.pop("stage_name", None)
        client_name = validated_data.pop("client_name", None)

        if category_name:
            category, created = ProjectCategory.objects.get_or_create(
                name=category_name,
                defaults={"description": f"Category: {category_name}"},
            )
            validated_data["category"] = category

        if status_name:
            status, created = ProjectStatus.objects.get_or_create(
                name=status_name, defaults={
                    "description": f"Status: {status_name}"}
            )
            validated_data["status"] = status

        if stage_name:
            stage, created = ProjectStage.objects.get_or_create(
                name=stage_name, defaults={
                    "description": f"Stage: {stage_name}"}
            )
            validated_data["stage"] = stage

        if client_name:
            client, created = Client.objects.get_or_create(
                name=client_name,
                defaults={
                    "email": f'{client_name.lower().replace(" ", "")}@client.com'
                },
            )
            validated_data["client"] = client

        members_ids = validated_data.pop("members_ids", [])
        project = super().create(validated_data)

        if self.context.get("request"):
            user = self.context["request"].user
            if user not in members_ids:
                members_ids.append(user)

        if members_ids:
            project.members.set(members_ids)

        if files and self.context.get("request"):
            user = self.context["request"].user
            for file in files:
                ProjectFile.objects.create(
                    project=project,
                    file=file,
                    original_name=file.name,
                    file_size=file.size,
                    uploaded_by=user,
                )

        return project

    def update(self, instance, validated_data):
        files = validated_data.pop("files", [])
        category_name = validated_data.pop("category_name", None)
        status_name = validated_data.pop("status_name", None)
        stage_name = validated_data.pop("stage_name", None)
        client_name = validated_data.pop("client_name", None)

        if category_name:
            category, created = ProjectCategory.objects.get_or_create(
                name=category_name,
                defaults={"description": f"Category: {category_name}"},
            )
            validated_data["category"] = category

        if status_name:
            status, created = ProjectStatus.objects.get_or_create(
                name=status_name, defaults={
                    "description": f"Status: {status_name}"}
            )
            validated_data["status"] = status

        if stage_name:
            stage, created = ProjectStage.objects.get_or_create(
                name=stage_name, defaults={
                    "description": f"Stage: {stage_name}"}
            )
            validated_data["stage"] = stage

        if client_name:
            client, created = Client.objects.get_or_create(
                name=client_name,
                defaults={
                    "email": f'{client_name.lower().replace(" ", "")}@client.com'
                },
            )
            validated_data["client"] = client

        members_ids = validated_data.pop("members_ids", None)
        project = super().update(instance, validated_data)

        if members_ids is not None:
            project.members.set(members_ids)

        if files and self.context.get("request"):
            user = self.context["request"].user
            for file in files:
                ProjectFile.objects.create(
                    project=project,
                    file=file,
                    original_name=file.name,
                    file_size=file.size,
                    uploaded_by=user,
                )

        return project


class TaskSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source='project.name', read_only=True)
    assignees = ProfileSerializer(many=True, read_only=True)
    assignee_ids = serializers.PrimaryKeyRelatedField(
        queryset=CustomUser.objects.all(),
        many=True,
        write_only=True,
        required=False
    )

    class Meta:
        model = Task
        fields = [
            'id',
            'project', 'project_name',
            'name', 'description',
            'status', 'priority', 'label',
            'start_date', 'due_date',
            'allocated_hours',
            'assignees', 'assignee_ids',
            'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def create(self, validated_data):
        assignee_ids = validated_data.pop('assignee_ids', [])
        task = Task.objects.create(**validated_data)
        
        if self.context.get("request"):
            user = self.context["request"].user
            if user not in assignee_ids:
                assignee_ids.append(user)

        if assignee_ids:
            task.assignees.set(assignee_ids)
        return task

    def update(self, instance, validated_data):
        assignee_ids = validated_data.pop('assignee_ids', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if assignee_ids is not None:
            instance.assignees.set(assignee_ids)

        return instance
class ScrumSerializer(serializers.ModelSerializer):
    task_name = serializers.CharField(source='task.name', read_only=True)
    project_name = serializers.CharField(source='task.project.name', read_only=True, allow_null=True)
    
    employee = ProfileSerializer(read_only=True, allow_null=True)
    employee_name = serializers.CharField(
        source='employee.get_full_name', 
        read_only=True, 
        default="Unassigned"
    )
    
    created_by = ProfileSerializer(read_only=True, allow_null=True)
    
    # Do NOT redefine morning_display / evening_display as fields
    # They are already @property in model → just list them in fields
    
    status_display = serializers.CharField(source='get_reported_status_display', read_only=True, allow_null=True)

    date = serializers.DateField(
    format="%Y-%m-%d",
    input_formats=["%Y-%m-%d"],
    required=False,
    default=timezone.now().date,  # ← now works after import
)

    class Meta:
        model = Scrum
        fields = [
            'id',
            'task',
            'task_name',
            'project_name',
            'date',
            'employee',
            'employee_name',
            'reported_status',
            'status_display',
            'morning_memo',
            'evening_memo',
            'morning_display',       # ← model @property — auto-included
            'evening_display',       # ← model @property — auto-included
            'created_by',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'created_at',
            'updated_at',
            'created_by',
            'morning_display',
            'evening_display',
            'status_display',
            'task_name',
            'project_name',
            'employee_name',
        ]

    def create(self, validated_data):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['created_by'] = request.user

        # Make sure date is always a date object
        if 'date' in validated_data:
            if isinstance(validated_data['date'], timezone.datetime):
                validated_data['date'] = validated_data['date'].date()
        else:
            validated_data['date'] = timezone.now().date()

        return super().create(validated_data)

    def update(self, instance, validated_data):
        # Optional: if you allow updating date
        if 'date' in validated_data:
            if isinstance(validated_data['date'], timezone.datetime):
                validated_data['date'] = validated_data['date'].date()

        return super().update(instance, validated_data)