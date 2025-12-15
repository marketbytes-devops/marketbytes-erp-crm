from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProjectViewSet,
    ProjectCategoryViewSet,
    ProjectStatusViewSet,
    ProjectStageViewSet,
    ClientViewSet
)

router = DefaultRouter()
router.register(r'projects', ProjectViewSet, basename='project')
router.register(r'categories', ProjectCategoryViewSet, basename='category')
router.register(r'statuses', ProjectStatusViewSet, basename='status')
router.register(r'stages', ProjectStageViewSet, basename='stage')
router.register(r'clients', ClientViewSet, basename='client')

urlpatterns = [
    path('', include(router.urls)),
]
