from rest_framework.permissions import BasePermission
from .models import has_user_permission

class HasPermission(BasePermission):
    """Unified permission checker using model-based effective permissions"""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # Superadmin bypass
        if request.user.is_superuser or (request.user.role and request.user.role.name == "Superadmin"):
            return True
        
        # Determine the page names from the view
        page_names = getattr(view, 'page_names', [])
        if not page_names:
            page_name = getattr(view, 'page_name', view.__class__.__name__.lower().replace('view', '').replace('set', ''))
            page_names = [page_name]
        
        # Map HTTP methods to actions
        action = ('view' if request.method == 'GET' else
                  'add' if request.method == 'POST' else
                  'edit' if request.method in ['PUT', 'PATCH'] else
                  'delete' if request.method == 'DELETE' else None)
        
        if not action:
            return False
            
        # Check if user has permission for ANY of the page names
        for page in page_names:
            if has_user_permission(request.user, page, action):
                return True
        return False

def has_permission(user, page, action):
    """Helper function for manual permission checks using unified logic"""
    if user.is_superuser or (user.role and user.role.name == "Superadmin"):
        return True
    return has_user_permission(user, page, action)
