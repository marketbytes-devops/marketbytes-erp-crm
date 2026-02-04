from rest_framework.permissions import BasePermission
from .models import has_user_permission

class HasPermission(BasePermission):
    """Updated permission checker using new permission system"""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.user.is_superuser or (request.user.role and request.user.role.name == "Superadmin"):
            return True
        
        # Determine the page name from the view
        page = getattr(view, 'page_name', view.__class__.__name__.lower().replace('view', '').replace('set', ''))
        
        # Map HTTP methods to actions
        action = ('view' if request.method == 'GET' else
                  'add' if request.method == 'POST' else
                  'edit' if request.method in ['PUT', 'PATCH'] else
                  'delete' if request.method == 'DELETE' else None)
        
        if not action:
            return False
            
        return has_user_permission(request.user, page, action)

def has_permission(user, page, action):
    """Helper function for manual permission checks"""
    if user.is_superuser or (user.role and user.role.name == "Superadmin"):
        return True
    return has_user_permission(user, page, action)
