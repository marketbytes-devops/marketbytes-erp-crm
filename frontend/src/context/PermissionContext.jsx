import { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../helpers/apiClient';

const PermissionContext = createContext();

export const PermissionProvider = ({ children, isAuthenticated }) => {
    const [permissions, setPermissions] = useState({});
    const [isSuperadmin, setIsSuperadmin] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const fetchPermissions = async () => {
            if (!isAuthenticated) {
                setPermissions({});
                setIsSuperadmin(false);
                setIsLoaded(true);
                setUser(null);
                return;
            }

            try {
                const response = await apiClient.get('/auth/profile/');
                const userData = response.data;
                setUser(userData);
                setIsSuperadmin(userData.is_superuser || userData.role?.name === 'Superadmin');
                setPermissions(userData.effective_permissions || {});
            } catch (error) {
                console.error('Failed to fetch permissions:', error);
                setPermissions({});
                setIsSuperadmin(false);
            } finally {
                setIsLoaded(true);
            }
        };

        fetchPermissions();
    }, [isAuthenticated]);

    const hasPermission = (page, action) => {
        if (isSuperadmin) return true;
        const pagePerms = permissions[page];
        return !!(pagePerms && pagePerms[`can_${action}`]);
    };

    const refreshPermissions = async () => {
        setIsLoaded(false);
        // Re-trigger the useEffect by toggling a minor state or manually calling logic
        // For simplicity, we just rely on dependency array or manual re-fetch
        try {
            const response = await apiClient.get('/auth/profile/');
            const userData = response.data;
            setUser(userData);
            setIsSuperadmin(userData.is_superuser || userData.role?.name === 'Superadmin');
            setPermissions(userData.effective_permissions || {});
        } catch (error) {
            console.error('Failed to refresh permissions:', error);
        } finally {
            setIsLoaded(true);
        }
    };

    return (
        <PermissionContext.Provider value={{
            permissions,
            isSuperadmin,
            isLoaded,
            hasPermission,
            user,
            refreshPermissions
        }}>
            {children}
        </PermissionContext.Provider>
    );
};

export const usePermission = () => {
    const context = useContext(PermissionContext);
    if (context === undefined) {
        throw new Error('usePermission must be used within a PermissionProvider');
    }
    return context;
};
