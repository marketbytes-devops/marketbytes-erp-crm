import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { Settings, Loader2, Shield } from "lucide-react";
import apiClient from "../../helpers/apiClient";
import LayoutComponents from "../../components/LayoutComponents";
import Loading from "../../components/Loading";

const Permissions = () => {
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [permissionsData, setPermissionsData] = useState([]);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(true);

  const pageNameMap = {
    admin: { apiName: "admin", displayName: "Admin Dashboard" },
    employees: { apiName: "employees", displayName: "Employees" },
    departments: { apiName: "departments", displayName: "Departments" }, 
    attendance: { apiName: "attendance", displayName: "Attendance" },
    holidays: { apiName: "holidays", displayName: "Holidays" },
    leaves: { apiName: "leaves", displayName: "Leaves" },
    overtime: { apiName: "overtime", displayName: "Overtime" },
    recruitment: { apiName: "recruitment", displayName: "Recruitment" },
    performance: { apiName: "performance", displayName: "Performance" },
    profile: { apiName: "profile", displayName: "Profile" },
    users: { apiName: "users", displayName: "Users" },
    roles: { apiName: "roles", displayName: "Roles" },
    permissions: { apiName: "permissions", displayName: "Permissions" },
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await apiClient.get("/auth/profile/");
        const user = response.data;
        setIsSuperadmin(user.is_superuser || user.role?.name === "Superadmin");

        const roleId = user.role?.id;
        if (roleId) {
          const res = await apiClient.get(`/auth/roles/${roleId}/`);
          setPermissionsData(res.data.permissions || []);
        }
      } catch (error) {
        console.error("Unable to fetch user profile:", error);
        setPermissionsData([]);
        setIsSuperadmin(false);
      } finally {
        setIsLoadingPermissions(false);
      }
    };

    fetchProfile();
    fetchRoles();
  }, []);

  const hasPermission = (page, action) => {
    if (isSuperadmin) return true;
    const perm = permissionsData.find((p) => p.page === page);
    return perm?.[`can_${action}`] || false;
  };

  const fetchRoles = async () => {
    try {
      const response = await apiClient.get("/auth/roles/");
      setRoles(response.data);
    } catch (error) {
      toast.error("Failed to fetch roles.");
    }
  };

  const openPermissionsModal = async (role) => {
    if (!hasPermission("permissions", "edit")) {
      toast.error("You do not have permission to edit permissions.");
      return;
    }

    setSelectedRole(role);
    try {
      const response = await apiClient.get(`/auth/roles/${role.id}/`);
      const rolePermissions = response.data.permissions || [];

      const permissionsMap = {};

      Object.keys(pageNameMap).forEach((key) => {
        permissionsMap[key] = {
          id: null,
          view: false,
          add: false,
          edit: false,
          delete: false,
        };
      });

      rolePermissions.forEach((perm) => {
        const matchedKey = Object.keys(pageNameMap).find(
          (key) => pageNameMap[key].apiName === perm.page
        );
        if (matchedKey) {
          permissionsMap[matchedKey] = {
            id: perm.id,
            view: perm.can_view,
            add: perm.can_add,
            edit: perm.can_edit,
            delete: perm.can_delete,
          };
        }
      });

      setPermissions(permissionsMap);
    } catch (error) {
      toast.error("Failed to load permissions.");
      setSelectedRole(null);
    }
  };

  const handlePermissionChange = (page, action) => {
    setPermissions((prev) => ({
      ...prev,
      [page]: {
        ...prev[page],
        [action]: !prev[page][action],
      },
    }));
  };

  const handleSelectAll = (checked) => {
    setPermissions((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((page) => {
        updated[page] = {
          ...updated[page],
          view: checked,
          add: checked,
          edit: checked,
          delete: checked,
        };
      });
      return updated;
    });
  };

  const isSelectAllChecked = () => {
    return Object.values(permissions).every(
      (perm) => perm.view && perm.add && perm.edit && perm.delete
    );
  };

  const handleSavePermissions = async () => {
    if (!hasPermission("permissions", "edit")) {
      toast.error("You do not have permission to edit permissions.");
      return;
    }

    setIsSaving(true);
    try {
      const updatePromises = Object.keys(permissions).map(async (pageKey) => {
        const perm = permissions[pageKey];
        const apiPageName = pageNameMap[pageKey].apiName;

        const payload = {
          role: selectedRole.id,
          page: apiPageName,
          can_view: perm.view,
          can_add: perm.add,
          can_edit: perm.edit,
          can_delete: perm.delete,
        };

        if (perm.id) {
          return apiClient.put(`/auth/permissions/${perm.id}/`, payload);
        } else if (perm.view || perm.add || perm.edit || perm.delete) {
          return apiClient.post("/auth/permissions/", payload);
        }
      }).filter(Boolean);

      await Promise.all(updatePromises);
      toast.success(`Permissions updated for ${selectedRole.name}!`);
      await fetchRoles(); 
      setTimeout(() => setSelectedRole(null), 1000);
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save permissions. Check console.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingPermissions) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="p-6">
      <LayoutComponents
        title="Permissions Management"
        subtitle="Manage role-based access control for different modules"
        variant="table"
      >
        <div className="bg-white rounded-xl shadow-inner overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-2xl font-bold text-black flex items-center gap-3">
              <Shield className="w-8 h-8" />
              Existing Roles
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-6 text-left text-sm font-bold text-black uppercase tracking-wider">
                    Role Name
                  </th>
                  <th className="p-6 text-left text-sm font-bold text-black uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {roles.map((role) => (
                  <motion.tr
                    key={role.id}
                    className="hover:bg-gray-50 transition"
                    whileHover={{ x: 4 }}
                  >
                    <td className="p-6">
                      <span className="text-lg font-semibold text-black">{role.name}</span>
                    </td>
                    <td className="p-6">
                      <button
                        onClick={() => openPermissionsModal(role)}
                        disabled={!hasPermission("permissions", "edit")}
                        className={`inline-flex items-center gap-3 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                          hasPermission("permissions", "edit")
                            ? "bg-black text-white hover:bg-white hover:text-black border-2 border-black"
                            : "bg-gray-200 text-gray-500 cursor-not-allowed"
                        }`}
                      >
                        <Settings className="w-5 h-5" />
                        Edit Permissions
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <AnimatePresence>
          {selectedRole && (
            <motion.div
              className="fixed inset-0 backdrop-brightness-50 flex items-center justify-center z-50 p-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedRole(null)}
            >
              <motion.div
                className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden"
                initial={{ scale: 0.9, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 50 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="bg-linear-to-r from-black to-gray-800 p-8 text-center">
                  <h2 className="text-3xl font-bold text-white">
                    Permissions for <span className="text-red-500">{selectedRole.name}</span>
                  </h2>
                </div>

                <div className="p-6 overflow-y-auto max-h-[65vh]">
                  <div className="mb-6 p-6 bg-linear-to-r from-gray-100 to-gray-50 rounded-2xl flex items-center justify-between">
                    <label className="flex items-center gap-4 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isSelectAllChecked()}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        disabled={!hasPermission("permissions", "edit")}
                        className="w-6 h-6 rounded border-2 border-black checked:bg-black focus:ring-0"
                      />
                      <span className="text-lg font-bold text-black">Select All Permissions</span>
                    </label>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-black text-white">
                          <th className="text-left p-6 text-sm font-bold rounded-tl-2xl">Module</th>
                          <th className="text-center p-6 text-sm font-bold">View</th>
                          <th className="text-center p-6 text-sm font-bold">Add</th>
                          <th className="text-center p-6 text-sm font-bold">Edit</th>
                          <th className="text-center p-6 text-sm font-bold rounded-tr-2xl">Delete</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.keys(pageNameMap).map((pageKey, idx) => (
                          <tr key={pageKey} className={`${idx % 2 === 0 ? "bg-gray-50" : "bg-white"} hover:bg-gray-100 transition`}>
                            <td className="p-6 font-semibold text-black">
                              {pageNameMap[pageKey].displayName}
                            </td>
                            {["view", "add", "edit", "delete"].map((action) => (
                              <td key={action} className="text-center p-6">
                                <input
                                  type="checkbox"
                                  checked={permissions[pageKey]?.[action] || false}
                                  onChange={() => handlePermissionChange(pageKey, action)}
                                  disabled={!hasPermission("permissions", "edit")}
                                  className="w-5 h-5 rounded border-2 border-black checked:bg-black cursor-pointer focus:ring-0"
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="px-8 py-6 bg-gray-50 flex justify-end gap-4">
                  <button
                    onClick={() => setSelectedRole(null)}
                    className="px-8 py-3 rounded-xl font-medium bg-gray-300 text-black hover:bg-gray-400 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSavePermissions}
                    disabled={isSaving || !hasPermission("permissions", "edit")}
                    className={`px-8 py-3 rounded-xl font-medium flex items-center gap-3 transition-all ${
                      isSaving || !hasPermission("permissions", "edit")
                        ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                        : "bg-black text-white hover:bg-gray-800 shadow-lg"
                    }`}
                  >
                    {isSaving && <Loader2 className="w-5 h-5 animate-spin" />}
                    {isSaving ? "Saving..." : "Save Permissions"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </LayoutComponents>
    </div>
  );
};

export default Permissions;