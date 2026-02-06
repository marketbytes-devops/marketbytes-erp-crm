from django.contrib import admin
from .models import NotificationPreference, Notification, Reminder


@admin.register(NotificationPreference)
class NotificationPreferenceAdmin(admin.ModelAdmin):
    list_display = ['user', 'email_enabled', 'inapp_enabled', 'updated_at']
    list_filter = ['email_enabled', 'inapp_enabled']
    search_fields = ['user__email', 'user__name']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('User', {
            'fields': ('user',)
        }),
        ('Email Notifications', {
            'fields': (
                'email_enabled',
                'email_task_assigned',
                'email_task_due',
                'email_project_updates',
                'email_scrum_reminders',
                'email_leave_status',
            )
        }),
        ('In-App Notifications', {
            'fields': (
                'inapp_enabled',
                'inapp_task_assigned',
                'inapp_task_due',
                'inapp_project_updates',
                'inapp_scrum_reminders',
                'inapp_leave_status',
            )
        }),
        ('Reminder Settings', {
            'fields': (
                'task_reminder_before_hours',
                'scrum_reminder_time',
            )
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['user', 'notification_type', 'title', 'priority', 'is_read', 'created_at']
    list_filter = ['notification_type', 'priority', 'is_read', 'created_at']
    search_fields = ['user__email', 'title', 'message']
    readonly_fields = ['created_at', 'read_at']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('User & Type', {
            'fields': ('user', 'notification_type', 'priority')
        }),
        ('Content', {
            'fields': ('title', 'message', 'link_url', 'link_text')
        }),
        ('Related Objects', {
            'fields': ('related_task_id', 'related_project_id', 'related_scrum_id'),
            'classes': ('collapse',)
        }),
        ('Status', {
            'fields': ('is_read', 'read_at')
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['mark_as_read', 'mark_as_unread']
    
    def mark_as_read(self, request, queryset):
        from django.utils import timezone
        updated = queryset.update(is_read=True, read_at=timezone.now())
        self.message_user(request, f'{updated} notifications marked as read.')
    mark_as_read.short_description = "Mark selected as read"
    
    def mark_as_unread(self, request, queryset):
        updated = queryset.update(is_read=False, read_at=None)
        self.message_user(request, f'{updated} notifications marked as unread.')
    mark_as_unread.short_description = "Mark selected as unread"


@admin.register(Reminder)
class ReminderAdmin(admin.ModelAdmin):
    list_display = ['user', 'reminder_type', 'title', 'scheduled_time', 'is_active', 'is_sent']
    list_filter = ['reminder_type', 'frequency', 'is_active', 'is_sent', 'scheduled_time']
    search_fields = ['user__email', 'title', 'description']
    readonly_fields = ['last_sent', 'created_at', 'updated_at']
    date_hierarchy = 'scheduled_time'
    
    fieldsets = (
        ('User & Type', {
            'fields': ('user', 'reminder_type', 'frequency')
        }),
        ('Content', {
            'fields': ('title', 'description')
        }),
        ('Schedule', {
            'fields': ('scheduled_time', 'last_sent')
        }),
        ('Related Objects', {
            'fields': ('related_task_id', 'related_project_id'),
            'classes': ('collapse',)
        }),
        ('Status', {
            'fields': ('is_active', 'is_sent')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['activate_reminders', 'deactivate_reminders']
    
    def activate_reminders(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} reminders activated.')
    activate_reminders.short_description = "Activate selected reminders"
    
    def deactivate_reminders(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated} reminders deactivated.')
    deactivate_reminders.short_description = "Deactivate selected reminders"
