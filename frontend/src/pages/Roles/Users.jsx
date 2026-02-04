import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { Search, Trash2, Edit, Loader2, X, UserPlus, Shield, ShieldAlert, CheckCircle } from "lucide-react";
import apiClient from "../../helpers/apiClient";
import Input from "../../components/Input";
import PermissionMatrix from "../../components/PermissionMatrix";

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

const Users = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [editUser, setEditUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [permissionsData, setPermissionsData] = useState([]);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(true);

  // Form States (Manual Control)
  const [createFormValues, setCreateFormValues] = useState({
    email: "",
    name: "",
    role_id: "",
  });

  const [editFormValues, setEditFormValues] = useState({
    email: "",
    name: "",
    role_id: "",
  });

  // Permission states for forms
  const initialPermissions = useMemo(() => {
    const perms = {};
    Object.keys(pageNameMap).forEach(key => {
      perms[key] = { view: false, add: false, edit: false, delete: false };
    });
    return perms;
  }, []);

  const [createDirectPerms, setCreateDirectPerms] = useState(initialPermissions);
  const [editDirectPerms, setEditDirectPerms] = useState(initialPermissions);
  const [editOverrides, setEditOverrides] = useState(initialPermissions);

  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

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
      } catch (err) {
        console.error(err);
        setPermissionsData([]);
        setIsSuperadmin(false);
      } finally {
        setIsLoadingPermissions(false);
      }
    };
    fetchProfile();
    fetchUsers();
    fetchRoles();
  }, []);

  const hasPermission = (page, action) => {
    if (isSuperadmin) return true;
    const perm = permissionsData.find((p) => p.page === page);
    return perm && perm[`can_${action}`];
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data } = await apiClient.get("/auth/users/");
      setUsers(data);
    } catch {
      toast.error("Failed to fetch users.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const { data } = await apiClient.get("/auth/roles/");
      setRoles(data);
    } catch (err) {
      console.error(err);
    }
  };

  const processPermissionsToArray = (permsState) => {
    return Object.keys(permsState)
      .map(key => {
        const p = permsState[key];
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
  };

  const processOverridesToArray = (overridesState) => {
    return Object.keys(overridesState)
      .flatMap(key => {
        const o = overridesState[key];
        return Object.keys(o)
          .filter(action => o[action])
          .map(action => ({
            page: pageNameMap[key].apiName,
            action: `can_${action}`,
            is_blocked: true
          }));
      });
  };

  const onCreateUser = async (e) => {
    e.preventDefault();

    if (!createFormValues.email.trim()) {
      toast.error("Email is required");
      return;
    }
    if (!createFormValues.name.trim()) {
      toast.error("Full name is required");
      return;
    }

    if (!hasPermission("users", "add")) {
      toast.error("You do not have permission to create users.");
      return;
    }

    setIsCreating(true);
    try {
      const payload = {
        email: createFormValues.email.trim(),
        name: createFormValues.name.trim(),
        role_id: createFormValues.role_id ? Number(createFormValues.role_id) : null,
        user_permissions: processPermissionsToArray(createDirectPerms)
      };

      const response = await apiClient.post("/auth/users/", payload);
      setUsers((prev) => [...prev, response.data]);
      toast.success("User created successfully!");
      setCreateFormValues({ email: "", name: "", role_id: "" });
      setCreateDirectPerms(initialPermissions);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to create user.");
    } finally {
      setIsCreating(false);
    }
  };

  const onEditUser = async (e) => {
    e.preventDefault();

    setIsEditing(true);
    try {
      const payload = {
        email: editFormValues.email.trim(),
        name: editFormValues.name.trim(),
        role_id: editFormValues.role_id ? Number(editFormValues.role_id) : null,
        user_permissions: processPermissionsToArray(editDirectPerms),
        permission_overrides: processOverridesToArray(editOverrides)
      };

      const response = await apiClient.put(`/auth/users/${editUser.id}/`, payload);
      setUsers((prev) =>
        prev.map((u) => (u.id === editUser.id ? response.data : u))
      );
      toast.success("User updated successfully!");
      setEditUser(null);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to update user.");
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!hasPermission("users", "delete")) {
      toast.error("You do not have permission to delete users.");
      return;
    }
    if (!window.confirm("Delete this user permanently?")) return;

    try {
      await apiClient.delete(`/auth/users/${id}/`);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      toast.success("User deleted successfully");
    } catch {
      toast.error("Failed to delete user.");
    }
  };

  const openEditModal = (user) => {
    if (!hasPermission("users", "edit")) {
      toast.error("You do not have permission to edit users.");
      return;
    }
    setEditUser(user);
    setEditFormValues({
      email: user.email,
      name: user.name || "",
      role_id: user.role?.id ? String(user.role.id) : "",
    });

    // Populate direct permissions
    const loadedDirect = { ...initialPermissions };
    (user.direct_permissions || []).forEach(perm => {
      const key = Object.keys(pageNameMap).find(k => pageNameMap[k].apiName === perm.page);
      if (key) {
        loadedDirect[key] = {
          view: perm.can_view,
          add: perm.can_add,
          edit: perm.can_edit,
          delete: perm.can_delete
        };
      }
    });
    setEditDirectPerms(loadedDirect);
    setEditOverrides(initialPermissions); // Reset overrides on open
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading || isLoadingPermissions) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-gray-600" />
        <p className="mt-4 text-gray-600 font-medium">Loading…</p>
      </div>
    );
  }

  const roleOptions = [{ value: "", label: "None (Direct Permissions Only)" }, ...roles.map((r) => ({ value: r.id, label: r.name }))];

  return (
    <motion.div
      className="p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-full mx-auto">
        <h1 className="text-2xl font-medium text-black mb-2 font-mono uppercase tracking-tighter">Users Management</h1>
        <p className="text-gray-600 mb-6">
          Create, edit, and manage user accounts and assign roles. Roles are optional templates.
        </p>

        {/* Create User Form */}
        {hasPermission("users", "add") && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8 border border-gray-100">
            <div className="p-6 border-b border-gray-200 bg-gray-50/50">
              <h3 className="text-2xl font-medium text-black flex items-center gap-3">
                <UserPlus className="w-7 h-7 text-gray-600" />
                Create New User
              </h3>
            </div>

            <form onSubmit={onCreateUser} className="p-6 flex flex-col gap-6">
              <div className="grid md:grid-cols-3 gap-6">
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="john@example.com"
                  value={createFormValues.email}
                  onChange={(e) => setCreateFormValues(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
                <Input
                  label="Full Name"
                  type="text"
                  placeholder="John Doe"
                  value={createFormValues.name}
                  onChange={(e) => setCreateFormValues(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
                <Input
                  label="Role (Optional)"
                  type="select"
                  value={createFormValues.role_id}
                  onChange={(val) => setCreateFormValues(prev => ({ ...prev, role_id: val }))}
                  options={roleOptions}
                  placeholder="Select Role"
                />
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Direct Permissions
                </h4>
                <PermissionMatrix
                  permissions={createDirectPerms}
                  onChange={(page, action, val) => setCreateDirectPerms(prev => ({
                    ...prev,
                    [page]: { ...prev[page], [action]: val }
                  }))}
                  pageNameMap={pageNameMap}
                  type="direct"
                />
              </div>

              <div className="flex justify-start pt-4">
                <button
                  type="submit"
                  disabled={isCreating}
                  className="inline-flex items-center gap-4 px-10 py-4 bg-black text-sm text-white rounded-2xl font-bold shadow-2xl hover:bg-gray-800 transition-all disabled:opacity-70"
                >
                  {isCreating && <Loader2 className="w-5 h-5 animate-spin" />}
                  {isCreating ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          <div className="p-6 border-b border-gray-200 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <h3 className="text-2xl font-medium text-black">Existing Users</h3>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-10 py-3 rounded-xl border border-gray-300 focus:border-gray-500 focus:ring-4 focus:ring-gray-100 outline-none w-full sm:w-80 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">User / Identity</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Assigned Role</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="px-6 py-12 text-center text-gray-500 italic">
                      No users match your search
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50/50 group transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-black">{user.name || "Unnamed User"}</span>
                          <span className="text-sm text-gray-500">{user.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                          ${user.role?.name === 'Superadmin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                          <Shield className="w-3.5 h-3.5" />
                          {user.role?.name || "DIRECT ONLY"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => openEditModal(user)}
                            disabled={!hasPermission("users", "edit")}
                            className={`p-2 rounded-lg transition-colors ${hasPermission("users", "edit")
                              ? "text-gray-600 hover:bg-black hover:text-white"
                              : "text-gray-300 cursor-not-allowed"
                              }`}
                            title="Edit User"
                          >
                            <Edit className="w-5 h-5" />
                          </button>

                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={!hasPermission("users", "delete")}
                            className={`p-2 rounded-lg transition-colors ${hasPermission("users", "delete")
                              ? "text-red-600 hover:bg-red-600 hover:text-white"
                              : "text-gray-300 cursor-not-allowed"
                              }`}
                            title="Delete User"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit Modal */}
        <AnimatePresence>
          {editUser && (
            <motion.div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditUser(null)}
            >
              <motion.div
                className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-8 border-b border-gray-100 sticky top-0 bg-white z-10 flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold text-black tracking-tight">Edit Permissions</h2>
                    <p className="text-gray-500 font-medium">{editUser.email}</p>
                  </div>
                  <button onClick={() => setEditUser(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={onEditUser} className="p-8 space-y-8">
                  <div className="grid md:grid-cols-2 gap-6">
                    <Input
                      label="Full Name"
                      type="text"
                      value={editFormValues.name}
                      onChange={(e) => setEditFormValues(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                    <Input
                      label="Role (Optional)"
                      type="select"
                      value={editFormValues.role_id}
                      onChange={(val) => setEditFormValues(prev => ({ ...prev, role_id: val }))}
                      options={roleOptions}
                      placeholder="Select Role"
                    />
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center gap-2 text-black">
                      <Shield className="w-6 h-6" />
                      <h4 className="text-xl font-bold">Direct Permissions</h4>
                    </div>
                    <PermissionMatrix
                      permissions={editDirectPerms}
                      onChange={(page, action, val) => setEditDirectPerms(prev => ({
                        ...prev,
                        [page]: { ...prev[page], [action]: val }
                      }))}
                      pageNameMap={pageNameMap}
                      type="direct"
                    />
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center gap-2 text-red-600">
                      <ShieldAlert className="w-6 h-6" />
                      <h4 className="text-xl font-bold">Permission Blocks (Overrides)</h4>
                    </div>
                    <PermissionMatrix
                      permissions={editOverrides}
                      onChange={(page, action, val) => setEditOverrides(prev => ({
                        ...prev,
                        [page]: { ...prev[page], [action]: val }
                      }))}
                      pageNameMap={pageNameMap}
                      type="override"
                    />
                  </div>

                  {editUser.effective_permissions && (
                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                      <div className="flex items-center gap-2 text-green-700 mb-6">
                        <CheckCircle className="w-6 h-6" />
                        <h4 className="text-xl font-bold">Effective Permissions (Live)</h4>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {Object.keys(pageNameMap).map(key => {
                          const apiName = pageNameMap[key].apiName;
                          const ep = editUser.effective_permissions[apiName] || {};
                          const hasAny = ep.can_view || ep.can_add || ep.can_edit || ep.can_delete;
                          if (!hasAny) return null;
                          return (
                            <div key={key} className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                              <p className="text-[10px] font-black uppercase text-gray-400 mb-2 truncate">{pageNameMap[key].displayName}</p>
                              <div className="flex flex-wrap gap-1">
                                {ep.can_view && <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[9px] font-black rounded">VIEW</span>}
                                {ep.can_add && <span className="px-1.5 py-0.5 bg-green-50 text-green-700 text-[9px] font-black rounded">ADD</span>}
                                {ep.can_edit && <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 text-[9px] font-black rounded">EDIT</span>}
                                {ep.can_delete && <span className="px-1.5 py-0.5 bg-red-50 text-red-700 text-[9px] font-black rounded">DEL</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-4 pt-6 sticky bottom-0 bg-white/80 backdrop-blur-sm p-4 -m-4">
                    <button
                      type="button"
                      onClick={() => setEditUser(null)}
                      className="px-8 py-3 bg-gray-100 text-gray-700 rounded-2xl hover:bg-gray-200 font-bold transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isEditing}
                      className="px-12 py-3 bg-black text-white rounded-2xl font-bold shadow-xl hover:bg-gray-800 transition-all disabled:opacity-70 flex items-center gap-3"
                    >
                      {isEditing && <Loader2 className="w-5 h-5 animate-spin" />}
                      {isEditing ? "Saving Changes..." : "Apply Permissions"}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default Users;