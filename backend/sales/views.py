from rest_framework import viewsets, filters
from authapp.permissions import HasPermission
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import (
    Company,
    Client,
    Lead,
    LeadSource,
    LeadCategory,
    LeadTeam,
    RfpTemplate,
    ProposalTemplate,
)
from .serializers import (
    CompanySerializer,
    ClientSerializer,
    LeadSerializer,
    LeadSourceSerializer,
    LeadCategorySerializer,
    LeadTeamSerializer,
    RfpTemplateSerializer,
    ProposalTemplateSerializer,
)


class CompanyViewSet(viewsets.ModelViewSet):
    queryset = Company.objects.all()
    serializer_class = CompanySerializer
    permission_classes = [HasPermission]
    page_name = 'customer'
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ["name", "website", "mobile"]


class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.select_related("company").all()
    serializer_class = ClientSerializer
    permission_classes = [HasPermission]
    page_name = 'customer'
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ["name", "email", "company__name"]


class LeadViewSet(viewsets.ModelViewSet):
    queryset = Lead.objects.select_related(
        "company", "client", "lead_agent", "lead_source", "lead_category", "lead_team"
    ).all()
    serializer_class = LeadSerializer
    permission_classes = [HasPermission]
    page_name = 'leads'
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    search_fields = ["client__name", "client__email", "company__name", "notes"]
    filterset_fields = [
        "status",
        "lead_agent",
        "lead_source",
        "lead_category",
        "lead_team",
    ]
    ordering_fields = ["created_at", "lead_value", "follow_up_date"]
    ordering = ["-created_at"]

    @action(detail=False, methods=["get"])
    def dashboard_stats(self, request):
        from django.db.models import Count, Sum
        total_leads = self.get_queryset().count()
        leads_by_status = self.get_queryset().values('status').annotate(count=Count('id'))
        total_value = self.get_queryset().aggregate(total=Sum('lead_value'))['total'] or 0
        
        return Response({
            "total_leads": total_leads,
            "leads_by_status": list(leads_by_status),
            "total_value": total_value
        })


class LeadSourceViewSet(viewsets.ModelViewSet):
    queryset = LeadSource.objects.all()
    serializer_class = LeadSourceSerializer
    permission_classes = [HasPermission]
    page_name = 'leads'


class LeadCategoryViewSet(viewsets.ModelViewSet):
    queryset = LeadCategory.objects.all()
    serializer_class = LeadCategorySerializer
    permission_classes = [HasPermission]
    page_name = 'leads'


class LeadTeamViewSet(viewsets.ModelViewSet):
    queryset = LeadTeam.objects.all()
    serializer_class = LeadTeamSerializer
    permission_classes = [HasPermission]
    page_name = 'leads'


class ProposalTemplateViewSet(viewsets.ModelViewSet):
    queryset = ProposalTemplate.objects.all()
    serializer_class = ProposalTemplateSerializer
    permission_classes = [HasPermission]
    page_name = 'communication_tools'
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    search_fields = ["name", "template", "body"]
    ordering_fields = ["created_at", "name"]
    ordering = ["-created_at"]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(created_by=self.request.user)


class RfpTemplateViewSet(viewsets.ModelViewSet):
    queryset = RfpTemplate.objects.all()
    serializer_class = RfpTemplateSerializer
    permission_classes = [HasPermission]
    page_name = 'communication_tools'
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    search_fields = ["category", "body"]
    ordering_fields = ["category", "created_at"]
    ordering = ["category"]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(created_by=self.request.user)
