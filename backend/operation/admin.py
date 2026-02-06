from django.contrib import admin
from .models import Project, ProjectCategory, ProjectStatus, ProjectStage, Client, Currency, Task,Scrum

admin.site.register(ProjectCategory)
admin.site.register(Project)
admin.site.register(ProjectStatus)
admin.site.register(ProjectStage)
admin.site.register(Client)
admin.site.register(Currency)
admin.site.register(Task)
admin.site.register(Scrum)
