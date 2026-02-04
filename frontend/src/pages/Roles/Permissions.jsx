import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { Search, Loader2, X, Shield, Lock, ChevronRight, AlertCircle } from "lucide-react";
import apiClient from "../../helpers/apiClient";
import LayoutComponents from "../../components/LayoutComponents";
import Loading from "../../components/Loading";
import Toggle from "../../components/Toggle";

const pageNameMap = {
  // Common
  admin: { apiName: "admin", displayName: "Dashboard", route: "/Dashboard" },
  profile: { apiName: "profile", displayName: "Profile", route: "/profile" },

  // HR
  employees: { apiName: "employees", displayName: "Employees", route: "/hr/employees" },
  departments: { apiName: "departments", displayName: "Departments", route: "/hr/departments" },
  designations: { apiName: "designations", displayName: "Designations", route: "/hr/designations" },
  attendance: { apiName: "attendance", displayName: "Attendance", route: "/hr/attendance" },
  holidays: { apiName: "holidays", displayName: "Holidays", route: "/hr/holidays" },
  leaves: { apiName: "leaves", displayName: "Leaves", route: "/hr/leaves" },
  overtime: { apiName: "overtime", displayName: "Overtime", route: "/hr/overtime" },
  recruitment: { apiName: "recruitment", displayName: "Recruitment", route: "/hr/recruitment" },
  performance: { apiName: "performance", displayName: "Performance", route: "/hr/performance" },

  // Operations
  projects: { apiName: "Projects", displayName: "Projects", route: "/Operations/projects" },
  tasks: { apiName: "Tasks", displayName: "Tasks", route: "/operations/tasks" },
  taskboard: { apiName: "Task Board", displayName: "Task Board", route: "/operations/taskboard" },

  // Sales
  leads: { apiName: "leads", displayName: "Leads", route: "/sales/leads" },
  pipeline: { apiName: "pipeline", displayName: "Pipeline", route: "/sales/pipeline" },
  communication_tools: { apiName: "communication_tools", displayName: "Communication Tools", route: "/sales/communication-tools" },
  invoices: { apiName: "invoices", displayName: "Invoices", route: "/sales/invoices" },
  reports: { apiName: "reports", displayName: "Reports", route: "/sales/reports" },
  customer: { apiName: "customer", displayName: "Customer", route: "/sales/customer" },

  // User Roles
  roles: { apiName: "roles", displayName: "Roles", route: "/user-roles/roles" },
  users: { apiName: "users", displayName: "Users", route: "/user-roles/users" },
  permissions: { apiName: "permissions", displayName: "Permissions", route: "/user-roles/permissions" }
};

const Permissions = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userPermissions, setUserPermissions] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get("/auth/users/");
      setUsers(Array.isArray(response.data) ? response.data : response.data.results || []);
    } catch (error) {
      toast.error("Failed to fetch users.");
    } finally {
      setIsLoading(false);
    }
  };

  const openOverridesModal = async (user) => {
    setSelectedUser(user);
    try {
      // Backend UserSerializer now includes direct_permissions
      const response = await apiClient.get(`/auth/users/${user.id}/`);
      const userData = response.data;

      const permissionsMap = {};
      Object.keys(pageNameMap).forEach((key) => {
        permissionsMap[key] = {
          view: false,
          add: false,
          edit: false,
          delete: false,
        };
      });

      (userData.direct_permissions || []).forEach((perm) => {
        const matchedKey = Object.keys(pageNameMap).find(
          (key) => pageNameMap[key].apiName === perm.page
        );
        if (matchedKey) {
          permissionsMap[matchedKey] = {
            view: perm.can_view,
            add: perm.can_add,
            edit: perm.can_edit,
            delete: perm.can_delete,
          };
        }
      });

      setUserPermissions(permissionsMap);
    } catch (error) {
      toast.error("Failed to load user permissions.");
    }
  };

  const handleToggleChange = (pageKey, action, value) => {
    setUserPermissions((prev) => ({
      ...prev,
      [pageKey]: {
        ...prev[pageKey],
        [action]: value,
      },
    }));
  };

  const handleBulkAction = (action) => {
    const value = action === 'selectAll';
    setUserPermissions((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((key) => {
        updated[key] = {
          view: value,
          add: value,
          edit: value,
          delete: value,
        };
      });
      return updated;
    });
  };

  const handleSavePermissions = async () => {
    setIsSaving(true);
    try {
      const permsArray = Object.keys(userPermissions)
        .map(key => {
          const p = userPermissions[key];
          if (p.view || p.add || p.edit || p.delete) {
            return {
              page: pageNameMap[key].apiName,
              can_view: p.view,
              can_add: p.add,
              can_edit: p.edit,
              can_delete: p.delete
            };
          }
          return null;
        })
        .filter(Boolean);

      await apiClient.put(`/auth/users/${selectedUser.id}/`, {
        user_permissions: permsArray
      });

      toast.success(`Permissions updated for ${selectedUser.name}!`);
      fetchUsers();
      setSelectedUser(null);
    } catch (error) {
      toast.error("Failed to update permissions.");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) return <div className="p-6"><Loading /></div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Permissions Management</h1>
          <p className="text-sm text-gray-500">Manage individual user access control and overrides</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg w-full md:w-80 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow bg-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map((user) => (
          <motion.div
            key={user.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-4">
              <span className="bg-blue-50 text-[#50728c] text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                {user.role?.name || "No Role"}
              </span>
            </div>

            <div className="flex items-start gap-4 mb-6 pt-2">
              <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center text-xl font-bold text-gray-400 border border-gray-200 uppercase">
                {user.name?.charAt(0) || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-gray-900 truncate pr-20">{user.name}</h3>
                <p className="text-sm text-gray-500 truncate">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-50">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">Access Control</span>
              <button
                onClick={() => openOverridesModal(user)}
                className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-black transition-colors"
              >
                Manage <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedUser(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl shadow-black/30"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-8 pb-4 flex items-center justify-between border-b border-gray-100">
                <h2 className="text-2xl font-bold text-[#4a627a]">Permissions Overrides: {selectedUser.name}</h2>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="p-2 transition-colors hover:bg-gray-100 rounded-full text-red-400"
                >
                  <X className="w-7 h-7" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 pt-6 space-y-8">
                {/* Yellow Alert Box */}
                <div className="bg-[#fffbeb] border border-[#fef3c7] rounded-3xl p-6 flex gap-4">
                  <div className="bg-[#fef3c7] w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
                    <Lock className="w-5 h-5 text-[#d97706]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#d97706]">Individual Overrides</h4>
                    <p className="text-sm text-[#d97706] opacity-80 leading-relaxed">
                      These settings will override the default permissions assigned to the user's role.
                    </p>
                  </div>
                </div>

                {/* Bulk Actions Section */}
                <div className="bg-gray-50/80 rounded-3xl p-6 border border-gray-100 shadow-inner">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-gray-900 uppercase tracking-tighter text-lg">Select All Permissions</h4>
                      <p className="text-xs text-gray-500">Quickly enable or disable all access rights across all modules</p>
                    </div>
                    <div className="flex gap-2 bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100">
                      <button
                        onClick={() => handleBulkAction('deselectAll')}
                        className="px-6 py-2 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors whitespace-nowrap"
                      >
                        Deselect All
                      </button>
                      <button
                        onClick={() => handleBulkAction('selectAll')}
                        className="px-6 py-2 rounded-xl text-sm font-semibold bg-[#50728c] text-white transition-opacity hover:opacity-90 whitespace-nowrap"
                      >
                        Select All
                      </button>
                    </div>
                  </div>
                </div>

                {/* Permissions Grid */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-[#fafbff]">
                      <tr>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest pl-8">Module / Page</th>
                        {["view", "add", "edit", "delete"].map(action => (
                          <th key={action} className="px-4 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">{action}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {Object.keys(pageNameMap).map((key) => (
                        <tr key={key} className="hover:bg-gray-50/50 group transition-colors">
                          <td className="px-6 py-5 pl-8">
                            <div className="flex flex-col">
                              <span className="font-bold text-gray-900 leading-none mb-1">{pageNameMap[key].displayName}</span>
                              <span className="text-[10px] text-gray-400 font-mono tracking-tight">{pageNameMap[key].route}</span>
                            </div>
                          </td>
                          {["view", "add", "edit", "delete"].map((action) => (
                            <td key={action} className="px-4 py-5 text-center">
                              <div className="flex justify-center">
                                <Toggle
                                  enabled={userPermissions[key]?.[action] || false}
                                  onChange={(val) => handleToggleChange(key, action, val)}
                                />
                              </div>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-8 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 rounded-b-[2.5rem]">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="px-8 py-3.5 rounded-2xl font-bold bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors shadow-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePermissions}
                  disabled={isSaving}
                  className="px-10 py-3.5 rounded-2xl font-bold bg-[#50728c] text-white shadow-xl shadow-blue-900/10 hover:opacity-90 transition-all active:scale-95 flex items-center gap-3"
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Changes"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Permissions;