from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.forms import UserChangeForm, UserCreationForm
from .models import CustomUser, Role, Permission, Department, UserPermission, PermissionOverride

class CustomUserChangeForm(UserChangeForm):
    class Meta(UserChangeForm.Meta):
        model = CustomUser

class CustomUserCreationForm(UserCreationForm):
    class Meta(UserCreationForm.Meta):
        model = CustomUser
        fields = ('email',)

class UserPermissionInline(admin.TabularInline):
    """Inline for direct user permissions"""
    model = UserPermission
    extra = 1

class PermissionOverrideInline(admin.TabularInline):
    """Inline for permission overrides"""
    model = PermissionOverride
    extra = 1

class CustomUserAdmin(UserAdmin):
    form = CustomUserChangeForm
    add_form = CustomUserCreationForm
    list_display = ('email', 'username', 'name', 'role', 'is_staff')
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'role')
    search_fields = ('email', 'username', 'name')
    ordering = ('email',)
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('username', 'name', 'address', 'phone_number', 'image')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'role')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'username', 'name', 'password1', 'password2', 'role', 'is_staff', 'is_active')}
        ),
    )
    inlines = [UserPermissionInline, PermissionOverrideInline]

class PermissionInline(admin.TabularInline):
    model = Permission
    extra = 1

class RoleAdmin(admin.ModelAdmin):
    inlines = [PermissionInline]
    list_display = ('name', 'description')
    search_fields = ('name',)

class PermissionAdmin(admin.ModelAdmin):
    list_display = ('role', 'page', 'can_view', 'can_add', 'can_edit', 'can_delete')
    list_filter = ('role', 'page')
    search_fields = ('role__name', 'page')


class UserPermissionAdmin(admin.ModelAdmin):
    """Admin for direct user-level permissions"""
    list_display = ('user', 'page', 'can_view', 'can_add', 'can_edit', 'can_delete')
    list_filter = ('page', 'user')
    search_fields = ('user__email', 'page')


class PermissionOverrideAdmin(admin.ModelAdmin):
    """Admin for permission overrides (block/grant)"""
    list_display = ('user', 'page', 'action', 'override_status')
    list_filter = ('is_blocked', 'page', 'action')
    search_fields = ('user__email', 'page')
    
    def override_status(self, obj):
        status = "🚫 Blocked" if obj.is_blocked else "✅ Granted"
        return status
    override_status.short_description = "Override Status"


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('name', 'worksheet_url')
    search_fields = ('name',)

admin.site.register(CustomUser, CustomUserAdmin)
admin.site.register(Role, RoleAdmin)
admin.site.register(Permission, PermissionAdmin)
admin.site.register(UserPermission, UserPermissionAdmin)
admin.site.register(PermissionOverride, PermissionOverrideAdmin)
