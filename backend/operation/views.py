from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
import datetime
from .models import Scrum
from .models import (
    Project,
    ProjectCategory,
    ProjectStatus,
    ProjectStage,
    Client,
    Currency,
    Task,
    Scrum
)
from .serializers import (
    ProjectSerializer,
    ProjectCategorySerializer,
    ProjectStatusSerializer,
    ProjectStageSerializer,
    ClientSerializer,
    CurrencySerializer,
    TaskSerializer,
    ScrumSerializer
)



class ProjectCategoryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Project Category CRUD operations
    """

    queryset = ProjectCategory.objects.all()
    serializer_class = ProjectCategorySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    search_fields = ["name", "description"]
    filterset_fields = ["name"]
    ordering_fields = ["name", "created_at"]
    ordering = ["name"]

    def get_queryset(self):
        return ProjectCategory.objects.all()


class ProjectStatusViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Project Status CRUD operations
    """

    queryset = ProjectStatus.objects.all()
    serializer_class = ProjectStatusSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ["name", "description"]
    filterset_fields = ["name"]

    def get_queryset(self):
        return ProjectStatus.objects.all()


class ProjectStageViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Project Stage CRUD operations
    """

    queryset = ProjectStage.objects.all()
    serializer_class = ProjectStageSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ["name", "description"]
    filterset_fields = ["name"]

    def get_queryset(self):
        return ProjectStage.objects.all()


class ClientViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Client CRUD operations
    """

    queryset = Client.objects.all()
    serializer_class = ClientSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    search_fields = ["name", "email", "phone", "address"]
    filterset_fields = ["name", "email"]
    ordering_fields = ["name", "created_at"]
    ordering = ["name"]

    def get_queryset(self):
        return Client.objects.all()


class CurrencyViewSet(viewsets.ReadOnlyModelViewSet):
    """
    List all active currencies (used in project creation)
    """

    queryset = Currency.objects.filter(is_active=True).order_by("code")
    serializer_class = CurrencySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ["code", "name"]


class ProjectViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Project CRUD operations with advanced filtering
    """
   
    serializer_class = ProjectSerializer
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    search_fields = [
        "name",
        "summary",
        "notes",
        "category__name",
        "department__name",
        "status__name",
        "stage__name",
        "client__name",
    ]
    filterset_fields = {
        "category": ["exact"],
        "department": ["exact"],
        "status": ["exact"],
        "stage": ["exact"],
        "client": ["exact"],
        "is_active": ["exact"],
        "currency__code": ["exact"], 
        "no_deadline": ["exact"],
        "allow_manual_timelogs": ["exact"],
    }
    ordering_fields = [
        "name",
        "start_date",
        "deadline",
        "created_at",
        "updated_at",
        "budget",
    ]
    ordering = ["-created_at"]

    def get_queryset(self):
        """
        Filter projects based on user permissions and query parameters
        """
        queryset = Project.objects.all()
        user = self.request.user

        if not user.is_superuser and not user.is_staff:
            query = Q(members=user)
            if user.department:
                query |= Q(department=user.department)

            queryset = queryset.filter(query).distinct()

        project_name = self.request.query_params.get("project_name", None)
        if project_name:
            queryset = queryset.filter(name__icontains=project_name)

        client_name = self.request.query_params.get("client_name", None)
        if client_name:
            queryset = queryset.filter(client__name__icontains=client_name)

        status_name = self.request.query_params.get("status_name", None)
        if status_name:
            queryset = queryset.filter(status__name__icontains=status_name)

        stage_name = self.request.query_params.get("stage_name", None)
        if stage_name:
            queryset = queryset.filter(stage__name__icontains=stage_name)

        start_date_from = self.request.query_params.get(
            "start_date_from", None)
        start_date_to = self.request.query_params.get("start_date_to", None)
        if start_date_from:
            queryset = queryset.filter(start_date__gte=start_date_from)
        if start_date_to:
            queryset = queryset.filter(start_date__lte=start_date_to)

        deadline_from = self.request.query_params.get("deadline_from", None)
        deadline_to = self.request.query_params.get("deadline_to", None)
        if deadline_from:
            queryset = queryset.filter(deadline__gte=deadline_from)
        if deadline_to:
            queryset = queryset.filter(deadline__lte=deadline_to)

        min_budget = self.request.query_params.get("min_budget", None)
        max_budget = self.request.query_params.get("max_budget", None)
        if min_budget:
            queryset = queryset.filter(budget__gte=min_budget)
        if max_budget:
            queryset = queryset.filter(budget__lte=max_budget)

        is_active_param = self.request.query_params.get("is_active", None)
        if is_active_param is not None:
            if is_active_param.lower() == "true":
                queryset = queryset.filter(is_active=True)
            elif is_active_param.lower() == "false":
                queryset = queryset.filter(is_active=False)

        return queryset

    def perform_create(self, serializer):

        serializer.save()

    def perform_update(self, serializer):
        """
        Handle project update with additional logic
        """
        serializer.save()

    def destroy(self, request, *args, **kwargs):
        """
        Soft delete or archive project instead of hard delete
        """
        instance = self.get_object()

        instance.is_active = False
        instance.save()

        return Response(
            {"message": "Project has been deactivated successfully."},
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["post"])
    def activate(self, request, pk=None):
        """
        Activate a deactivated project
        """
        project = self.get_object()
        project.is_active = True
        project.save()

        return Response(
            {
                "message": "Project has been activated successfully.",
                "is_active": project.is_active,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["get"])
    def active(self, request):
        """
        Get all active projects
        """
        active_projects = self.get_queryset().filter(is_active=True)
        serializer = self.get_serializer(active_projects, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def inactive(self, request):
        """
        Get all inactive projects
        """
        inactive_projects = Project.objects.filter(is_active=False)
        serializer = self.get_serializer(inactive_projects, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def overdue(self, request):
        """
        Get projects with overdue deadlines
        """
        today = datetime.date.today()
        overdue_projects = self.get_queryset().filter(
            deadline__lt=today, is_active=True, no_deadline=False
        )
        serializer = self.get_serializer(overdue_projects, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def upcoming_deadlines(self, request):
        """
        Get projects with deadlines in the next 7 days
        """
        today = datetime.date.today()
        next_week = today + datetime.timedelta(days=7)
        upcoming_projects = self.get_queryset().filter(
            deadline__range=[today, next_week], is_active=True, no_deadline=False
        )
        serializer = self.get_serializer(upcoming_projects, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def add_member(self, request, pk=None):
        """
        Add a member to the project
        """
        project = self.get_object()
        member_id = request.data.get("member_id")

        if not member_id:
            return Response(
                {"error": "member_id is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            from authapp.models import CustomUser

            member = CustomUser.objects.get(id=member_id)
            project.members.add(member)

            return Response(
                {"message": f"Member {member.username} added to project successfully"},
                status=status.HTTP_200_OK,
            )
        except CustomUser.DoesNotExist:
            return Response(
                {"error": "User not found"}, status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=["post"])
    def remove_member(self, request, pk=None):
        """
        Remove a member from the project
        """
        project = self.get_object()
        member_id = request.data.get("member_id")

        if not member_id:
            return Response(
                {"error": "member_id is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            from authapp.models import CustomUser

            member = CustomUser.objects.get(id=member_id)
            project.members.remove(member)

            return Response(
                {
                    "message": f"Member {member.username} removed from project successfully"
                },
                status=status.HTTP_200_OK,
            )
        except CustomUser.DoesNotExist:
            return Response(
                {"error": "User not found"}, status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=["get"])
    def dashboard_stats(self, request):
        """
        Get dashboard statistics for projects
        """
        total_projects = self.get_queryset().count()
        active_projects = self.get_queryset().filter(is_active=True).count()
        inactive_projects = self.get_queryset().filter(is_active=False).count()

        today = datetime.date.today()
        overdue_projects = (
            self.get_queryset()
            .filter(deadline__lt=today, is_active=True, no_deadline=False)
            .count()
        )

        upcoming_deadlines = (
            self.get_queryset()
            .filter(
                deadline__range=[today, today + datetime.timedelta(days=7)],
                is_active=True,
                no_deadline=False,
            )
            .count()
        )

        from django.db.models import Count

        projects_by_status = (
            self.get_queryset()
            .filter(status__isnull=False)
            .values("status__name")
            .annotate(count=Count("id"))
        )

        projects_by_stage = (
            self.get_queryset()
            .filter(stage__isnull=False)
            .values("stage__name")
            .annotate(count=Count("id"))
        )

        return Response(
            {
                "total_projects": total_projects,
                "active_projects": active_projects,
                "inactive_projects": inactive_projects,
                "overdue_projects": overdue_projects,
                "upcoming_deadlines": upcoming_deadlines,
                "projects_by_status": list(projects_by_status),
                "projects_by_stage": list(projects_by_stage),
            }
        )

    @action(detail=False, methods=["get"])
    def my_projects(self, request):
        """
        Get projects where current user is a member
        """
        user = request.user
        my_projects = self.get_queryset().filter(members=user, is_active=True)

        status_name = request.query_params.get("status_name", None)
        if status_name:
            my_projects = my_projects.filter(
                status__name__icontains=status_name)

        stage_name = request.query_params.get("stage_name", None)
        if stage_name:
            my_projects = my_projects.filter(stage__name__icontains=stage_name)

        serializer = self.get_serializer(my_projects, many=True)
        return Response(serializer.data)


class TaskViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Task CRUD operations
    """
    queryset = Task.objects.all().select_related(
        'project').prefetch_related('assignees')
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend,
                       filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'project__name']
    filterset_fields = {
        'project': ['exact'],
        'status': ['exact', 'in'],
        'priority': ['exact', 'in'],
        'label': ['exact', 'isnull'],
        'assignees': ['exact'],
        'is_active': ['exact'],
        'due_date': ['exact', 'gte', 'lte'],
        'start_date': ['exact', 'gte', 'lte'],
    }
    ordering_fields = ['title', 'due_date',
                       'priority', 'created_at', 'start_date']
    ordering = ['due_date', 'priority']

    def destroy(self, request, *args, **kwargs):
        """
        Soft delete / archive task
        """
        instance = self.get_object()
        instance.is_active = False
        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        """
        Restore archived task
        """
        instance = self.get_object()
        instance.is_active = True
        instance.save()
        return Response({'status': 'restored'})


    def get_queryset(self):
        """
        Restrict tasks to projects the user is part of or assigned to
        """
        queryset = super().get_queryset()
        user = self.request.user

        if not user.is_superuser and not user.is_staff:
            queryset = queryset.filter(
                Q(project__members=user) |
                Q(project__department=user.department) |
                Q(assignees=user)
            ).distinct()

        project_id = self.request.query_params.get('project_id')
        if project_id:
            queryset = queryset.filter(project_id=project_id)

        return queryset
class ScrumViewSet(viewsets.ModelViewSet):
  
    queryset = Scrum.objects.select_related(
        'task', 'task__project', 'employee', 'created_by'
    ).prefetch_related('task__assignees')
    
    serializer_class = ScrumSerializer
    permission_classes = [IsAuthenticated]
    
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    
    search_fields = [
        'task__name',
        'task__project__name',
        'employee__first_name',
        'employee__last_name',
        'employee__username',
        'morning_memo',
        'evening_memo',
    ]
    
    filterset_fields = {
        'task': ['exact'],
        'task__project': ['exact'],
        'employee': ['exact'],
         'reported_status': ['exact', 'in'],
        'date': ['exact', 'gte', 'lte'],
        'morning_submitted': ['exact'],
        'evening_submitted': ['exact'],
    }
    
    ordering_fields = ['date', 'task__name',   'reported_status', 'created_at']
    ordering = ['-date', 'task__name']

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        if not user.is_superuser and not user.is_staff:
            queryset = queryset.filter(
                Q(task__project__members=user) |
                Q(task__project__department=user.department) |
                Q(task__assignees=user) |
                Q(employee=user) |
                Q(created_by=user)
            ).distinct()

        task_id = self.request.query_params.get('task')
        if task_id:
            queryset = queryset.filter(task_id=task_id)

        project_id = self.request.query_params.get('project')
        if project_id:
            queryset = queryset.filter(task__project_id=project_id)

        employee_id = self.request.query_params.get('employee')
        if employee_id:
            queryset = queryset.filter(employee_id=employee_id)

        return queryset

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=['get'], url_path='today')
    def today(self, request):
        today = timezone.now().date()
        todays_scrums = self.get_queryset().filter(date=today)
        serializer = self.get_serializer(todays_scrums, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='by-task')
    def by_task(self, request):
        task_id = request.query_params.get('task')
        if not task_id:
            return Response({"error": "task query param is required"}, status=400)

        scrums = self.get_queryset().filter(task_id=task_id).order_by('-date')
        serializer = self.get_serializer(scrums, many=True)
        return Response(serializer.data)

