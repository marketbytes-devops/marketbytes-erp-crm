from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
import datetime

from .models import (
    Project,
    ProjectCategory,
    ProjectStatus,
    ProjectStage,
    Client
)
from .serializers import (
    ProjectSerializer,
    ProjectCategorySerializer,
    ProjectStatusSerializer,
    ProjectStageSerializer,
    ClientSerializer
)


class ProjectCategoryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Project Category CRUD operations
    """
    queryset = ProjectCategory.objects.all()
    serializer_class = ProjectCategorySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    filterset_fields = ['name']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

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
    search_fields = ['name', 'description']
    filterset_fields = ['name']

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
    search_fields = ['name', 'description']
    filterset_fields = ['name']

    def get_queryset(self):
        return ProjectStage.objects.all()


class ClientViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Client CRUD operations
    """
    queryset = Client.objects.all()
    serializer_class = ClientSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'email', 'phone', 'address']
    filterset_fields = ['name', 'email']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

    def get_queryset(self):
        return Client.objects.all()


class ProjectViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Project CRUD operations with advanced filtering
    """
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        'name', 
        'summary', 
        'notes',
        'category__name',
        'department__name',
        'status__name',
        'stage__name',
        'client__name'
    ]
    filterset_fields = [
        'category',
        'department',
        'status',
        'stage',
        'client',
        'is_active',
        'currency',
        'no_deadline',
        'allow_manual_timelogs'
    ]
    ordering_fields = [
        'name',
        'start_date',
        'deadline',
        'created_at',
        'updated_at',
        'budget'
    ]
    ordering = ['-created_at']

    def get_queryset(self):
        """
        Filter projects based on user permissions and query parameters
        """
        queryset = Project.objects.all()
        
        # Filter by current user if they are a member
        user = self.request.user
      
        if not user.is_superuser and not user.is_staff:
           query = Q(members=user)
           if user.department:
              query |= Q(department=user.department)

           queryset = queryset.filter(query).distinct()

        
        # Custom filters from query parameters
        project_name = self.request.query_params.get('project_name', None)
        if project_name:
            queryset = queryset.filter(name__icontains=project_name)
        
        client_name = self.request.query_params.get('client_name', None)
        if client_name:
            queryset = queryset.filter(client__name__icontains=client_name)
        
        status_name = self.request.query_params.get('status_name', None)
        if status_name:
            queryset = queryset.filter(status__name__icontains=status_name)
        
        stage_name = self.request.query_params.get('stage_name', None)
        if stage_name:
            queryset = queryset.filter(stage__name__icontains=stage_name)
        
        # Date range filters
        start_date_from = self.request.query_params.get('start_date_from', None)
        start_date_to = self.request.query_params.get('start_date_to', None)
        if start_date_from:
            queryset = queryset.filter(start_date__gte=start_date_from)
        if start_date_to:
            queryset = queryset.filter(start_date__lte=start_date_to)
        
        deadline_from = self.request.query_params.get('deadline_from', None)
        deadline_to = self.request.query_params.get('deadline_to', None)
        if deadline_from:
            queryset = queryset.filter(deadline__gte=deadline_from)
        if deadline_to:
            queryset = queryset.filter(deadline__lte=deadline_to)
        
        # Budget range filter
        min_budget = self.request.query_params.get('min_budget', None)
        max_budget = self.request.query_params.get('max_budget', None)
        if min_budget:
            queryset = queryset.filter(budget__gte=min_budget)
        if max_budget:
            queryset = queryset.filter(budget__lte=max_budget)
        
        # Active/Inactive filter
        is_active_param = self.request.query_params.get('is_active', None)
        if is_active_param is not None:
            if is_active_param.lower() == 'true':
                queryset = queryset.filter(is_active=True)
            elif is_active_param.lower() == 'false':
                queryset = queryset.filter(is_active=False)
        
        return queryset

    def perform_create(self, serializer):
           
        serializer.save()

        
        # Log project creation (you can add logging here)
        # Example: create_audit_log(self.request.user, 'created', project)
        
        
    def perform_update(self, serializer):
        """
        Handle project update with additional logic
        """
        serializer.save()
        
        # Log project update (you can add logging here)
        # Example: create_audit_log(self.request.user, 'updated', project)

    def destroy(self, request, *args, **kwargs):
        """
        Soft delete or archive project instead of hard delete
        """
        instance = self.get_object()
        
        # Instead of deleting, mark as inactive
        instance.is_active = False
        instance.save()
        
        # Log project deactivation
        # Example: create_audit_log(self.request.user, 'deactivated', instance)
        
        return Response(
            {"message": "Project has been deactivated successfully."},
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """
        Activate a deactivated project
        """
        project = self.get_object()
        project.is_active = True
        project.save()
        
        return Response(
            {"message": "Project has been activated successfully.", "is_active": project.is_active},
            status=status.HTTP_200_OK
        )

    @action(detail=False, methods=['get'])
    def active(self, request):
        """
        Get all active projects
        """
        active_projects = self.get_queryset().filter(is_active=True)
        serializer = self.get_serializer(active_projects, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def inactive(self, request):
        """
        Get all inactive projects
        """
        inactive_projects = self.get_queryset().filter(is_active=False)
        serializer = self.get_serializer(inactive_projects, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def overdue(self, request):
        """
        Get projects with overdue deadlines
        """
        today = datetime.date.today()
        overdue_projects = self.get_queryset().filter(
            deadline__lt=today,
            is_active=True,
            no_deadline=False
        )
        serializer = self.get_serializer(overdue_projects, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def upcoming_deadlines(self, request):
        """
        Get projects with deadlines in the next 7 days
        """
        today = datetime.date.today()
        next_week = today + datetime.timedelta(days=7)
        upcoming_projects = self.get_queryset().filter(
            deadline__range=[today, next_week],
            is_active=True,
            no_deadline=False
        )
        serializer = self.get_serializer(upcoming_projects, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def add_member(self, request, pk=None):
        """
        Add a member to the project
        """
        project = self.get_object()
        member_id = request.data.get('member_id')
        
        if not member_id:
            return Response(
                {"error": "member_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from authapp.models import CustomUser
            member = CustomUser.objects.get(id=member_id)
            project.members.add(member)
            
            return Response(
                {"message": f"Member {member.username} added to project successfully"},
                status=status.HTTP_200_OK
            )
        except CustomUser.DoesNotExist:
            return Response(
                {"error": "User not found"},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['post'])
    def remove_member(self, request, pk=None):
        """
        Remove a member from the project
        """
        project = self.get_object()
        member_id = request.data.get('member_id')
        
        if not member_id:
            return Response(
                {"error": "member_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from authapp.models import CustomUser
            member = CustomUser.objects.get(id=member_id)
            project.members.remove(member)
            
            return Response(
                {"message": f"Member {member.username} removed from project successfully"},
                status=status.HTTP_200_OK
            )
        except CustomUser.DoesNotExist:
            return Response(
                {"error": "User not found"},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        """
        Get dashboard statistics for projects
        """
        total_projects = self.get_queryset().count()
        active_projects = self.get_queryset().filter(is_active=True).count()
        inactive_projects = self.get_queryset().filter(is_active=False).count()
        
        today = datetime.date.today()
        overdue_projects = self.get_queryset().filter(
            deadline__lt=today,
            is_active=True,
            no_deadline=False
        ).count()
        
        upcoming_deadlines = self.get_queryset().filter(
            deadline__range=[today, today + datetime.timedelta(days=7)],
            is_active=True,
            no_deadline=False
        ).count()
        
        # Projects by status
        from django.db.models import Count
        projects_by_status = self.get_queryset().filter(
            status__isnull=False
        ).values('status__name').annotate(count=Count('id'))
        
        # Projects by stage
        projects_by_stage = self.get_queryset().filter(
            stage__isnull=False
        ).values('stage__name').annotate(count=Count('id'))
        
        return Response({
            'total_projects': total_projects,
            'active_projects': active_projects,
            'inactive_projects': inactive_projects,
            'overdue_projects': overdue_projects,
            'upcoming_deadlines': upcoming_deadlines,
            'projects_by_status': list(projects_by_status),
            'projects_by_stage': list(projects_by_stage)
        })

    @action(detail=False, methods=['get'])
    def my_projects(self, request):
        """
        Get projects where current user is a member
        """
        user = request.user
        my_projects = self.get_queryset().filter(members=user, is_active=True)
        
        # Apply additional filters if provided
        status_name = request.query_params.get('status_name', None)
        if status_name:
            my_projects = my_projects.filter(status__name__icontains=status_name)
        
        stage_name = request.query_params.get('stage_name', None)
        if stage_name:
            my_projects = my_projects.filter(stage__name__icontains=stage_name)
        
        serializer = self.get_serializer(my_projects, many=True)
        return Response(serializer.data)