import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from authapp.models import Role, Permission

def seed_permissions():
    roles_to_update = ['Superadmin', 'Team Lead', 'HR', 'COO']
    page_name = 'common_calendar'
    
    for role_name in roles_to_update:
        try:
            role = Role.objects.get(name=role_name)
            perm, created = Permission.objects.get_or_create(
                role=role,
                page=page_name,
                defaults={
                    'can_view': True,
                    'can_add': True,
                    'can_edit': True,
                    'can_delete': True
                }
            )
            if not created:
                perm.can_view = True
                perm.can_add = True
                perm.can_edit = True
                perm.can_delete = True
                perm.save()
            print(f"Updated permissions for {role_name} on {page_name}")
        except Role.DoesNotExist:
            print(f"Role {role_name} does not exist, skipping.")

    # All roles should at least be able to view?
    # Actually, the user said "can only add by team leads, hr, ceo, ... superadmin"
    # This implies others can VIEW but not ADD.
    
    # Let's give 'employee' view-only permission
    try:
        employee_role = Role.objects.get(name='employee')
        perm, created = Permission.objects.get_or_create(
            role=employee_role,
            page=page_name,
            defaults={
                'can_view': True,
                'can_add': False,
                'can_edit': False,
                'can_delete': False
            }
        )
        print(f"Updated permissions for employee on {page_name} (View only)")
    except Role.DoesNotExist:
        print("Employee role does not exist.")

if __name__ == "__main__":
    seed_permissions()
