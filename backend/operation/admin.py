from django.contrib import admin
from .models import Project, ProjectCategory, ProjectStatus, ProjectStage, Client

admin.site.register(ProjectCategory)
admin.site.register(Project)
admin.site.register(ProjectStatus)
admin.site.register(ProjectStage)
admin.site.register(Client)