from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CompanyViewSet, ClientViewSet, LeadViewSet,
    LeadSourceViewSet, LeadCategoryViewSet, LeadTeamViewSet,ProposalTemplateViewSet,RfpTemplateViewSet
)

router = DefaultRouter()
router.register(r'companies', CompanyViewSet)
router.register(r'clients', ClientViewSet)
router.register(r'leads', LeadViewSet)
router.register(r'lead-sources', LeadSourceViewSet)
router.register(r'lead-categories', LeadCategoryViewSet)
router.register(r'lead-teams', LeadTeamViewSet)
router.register(r'proposal-templates', ProposalTemplateViewSet)  # NEW
router.register(r'rfp-templates', RfpTemplateViewSet)

urlpatterns = [
    path('', include(router.urls)),
]