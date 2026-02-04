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
            
        # Primary check
        if has_user_permission(request.user, page, action):
            return True
        
        # Alias 'users' and 'employees' for consistency between frontend/backend
        if page == 'users' and has_user_permission(request.user, 'employees', action):
            return True

        # Alias 'roles' and 'designations' (Roles represent designations in this ERP)
        if page == 'roles' and has_user_permission(request.user, 'designations', action):
            return True

        # Alias 'clients'/'client' and 'customer' (Clients are part of the 'customer' page in backend)
        if page in ['clients', 'client'] and has_user_permission(request.user, 'customer', action):
            return True

        # Allow view access to metadata (roles, departments) if user has employee access
        # This is needed for dropdowns and filters in the employee module.
        if action == 'view' and page in ['roles', 'departments'] and has_user_permission(request.user, 'employees', 'view'):
            return True

        # Allow view access to attendance status if user has dashboard or employee access
        # This is needed for the clock-in/out status in the header.
        if action == 'view' and page == 'attendance' and (
            has_user_permission(request.user, 'admin', 'view') or 
            has_user_permission(request.user, 'employees', 'view')
        ):
            return True
            
        return False

def has_permission(user, page, action):
    """Helper function for manual permission checks"""
    if user.is_superuser or (user.role and user.role.name == "Superadmin"):
        return True
    
    # Primary check
    if has_user_permission(user, page, action):
        return True
        
    # Alias 'users' and 'employees'
    if page == 'users' and has_user_permission(user, 'employees', action):
        return True

    # Alias 'roles' and 'designations'
    if page == 'roles' and has_user_permission(user, 'designations', action):
        return True

    # Alias 'clients'/'client' and 'customer'
    if page in ['clients', 'client'] and has_user_permission(user, 'customer', action):
        return True

    # Allow view access to metadata
    if action == 'view' and page in ['roles', 'departments'] and has_user_permission(user, 'employees', 'view'):
        return True

    # Allow view access to attendance status
    if action == 'view' and page == 'attendance' and (
        has_user_permission(user, 'admin', 'view') or 
        has_user_permission(user, 'employees', 'view')
    ):
        return True
        
    return False
