
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProjectViewSet,
    ProjectCategoryViewSet,
    ProjectStatusViewSet,
    ProjectStageViewSet,
    ClientViewSet,
    CurrencyViewSet,
    TaskViewSet,
    ScrumViewSet,
    ContractTypeViewSet,
    ContractViewSet,
)

router = DefaultRouter()
router.register(r'projects', ProjectViewSet, basename='project')
router.register(r'categories', ProjectCategoryViewSet, basename='category')
router.register(r'statuses', ProjectStatusViewSet, basename='status')
router.register(r'stages', ProjectStageViewSet, basename='stage')
router.register(r'clients', ClientViewSet, basename='client')
router.register(r'currencies', CurrencyViewSet, basename='currency')
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'scrum', ScrumViewSet, basename='scrum')
router.register(r'contract-types', ContractTypeViewSet, basename='contract-type')
router.register(r'contracts', ContractViewSet, basename='contract')
urlpatterns = [
    path('', include(router.urls)),
]

