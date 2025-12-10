import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { Search, Trash2, Edit, Loader2, X, UserPlus, Shield } from "lucide-react";
import apiClient from "../../helpers/apiClient";
import Input from "../../components/Input";

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
    if (!createFormValues.role_id) {
      toast.error("Please select a role");
      return;
    }

    if (!hasPermission("users", "add")) {
      toast.error("You do not have permission to create users.");
      return;
    }

    setIsCreating(true);
    try {
      const response = await apiClient.post("/auth/users/", {
        email: createFormValues.email.trim(),
        name: createFormValues.name.trim(),
        role_id: Number(createFormValues.role_id),
      });
      setUsers((prev) => [...prev, response.data]);
      toast.success("User created successfully!");
      setCreateFormValues({ email: "", name: "", role_id: "" });
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to create user.");
    } finally {
      setIsCreating(false);
    }
  };

  const onEditUser = async (e) => {
    e.preventDefault();

    if (!editFormValues.role_id) {
      toast.error("Please select a role");
      return;
    }

    setIsEditing(true);
    try {
      const response = await apiClient.put(`/auth/users/${editUser.id}/`, {
        email: editFormValues.email.trim(),
        name: editFormValues.name.trim(),
        role_id: Number(editFormValues.role_id),
      });
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

  const roleOptions = roles.map((r) => ({ value: r.id, label: r.name }));

  return (
    <motion.div
      className="p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-full mx-auto">
        <h1 className="text-2xl font-medium text-black mb-2">Users Management</h1>
        <p className="text-gray-600 mb-6">
          Create, edit, and manage user accounts and assign roles.
        </p>

        {/* Create User Form */}
        {hasPermission("users", "add") && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-2xl font-medium text-black flex items-center gap-3">
                <UserPlus className="w-7 h-7 text-gray-600" />
                Create New User
              </h3>
            </div>

            <form onSubmit={onCreateUser} className="p-6 grid md:grid-cols-3 gap-6">
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
                label="Role"
                type="select"
                value={createFormValues.role_id}
                onChange={(val) => setCreateFormValues(prev => ({ ...prev, role_id: val }))}
                options={roleOptions}
                placeholder="Select Role"
                required
              />

              <div className="md:col-span-3 flex justify-start">
                <button
                  type="submit"
                  disabled={isCreating}
                  className="inline-flex items-center gap-4 px-8 py-3 bg-black text-sm text-white rounded-xl font-medium shadow-lg hover:bg-gray-100 hover:text-black border transition-all disabled:opacity-70"
                >
                  {isCreating && <Loader2 className="w-5 h-5 animate-spin" />}
                  {isCreating ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h3 className="text-2xl font-medium text-black">Existing Users</h3>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-10 py-3 rounded-xl border border-gray-300 focus:border-gray-500 focus:ring-4 focus:ring-gray-100 outline-none w-full sm:w-80"
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
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Role</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{user.email}</td>
                      <td className="px-6 py-4 text-gray-700">{user.name || "—"}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                          <Shield className="w-4 h-4" />
                          {user.role?.name || "No Role"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => openEditModal(user)}
                            disabled={!hasPermission("users", "edit")}
                            className={`px-6 py-3 rounded-xl flex items-center gap-2 text-sm font-medium ${
                              hasPermission("users", "edit")
                                ? "bg-black text-white"
                                : "bg-gray-300 text-gray-500 cursor-not-allowed"
                            }`}
                          >
                            <Edit className="w-5 h-5" />
                            Edit
                          </motion.button>

                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={!hasPermission("users", "delete")}
                            className={`px-6 py-3 rounded-xl flex items-center gap-2 text-sm font-medium ${
                              hasPermission("users", "delete")
                                ? "bg-red-600 text-white"
                                : "bg-gray-300 text-gray-500 cursor-not-allowed"
                            }`}
                          >
                            <Trash2 className="w-5 h-5" />
                            Delete
                          </motion.button>
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
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditUser(null)}
            >
              <motion.div
                className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-2xl font-medium">
                    Edit User: <span className="text-gray-600">{editUser.email}</span>
                  </h2>
                </div>

                <form onSubmit={onEditUser} className="p-6 space-y-6">
                  <Input
                    label="Email Address"
                    type="email"
                    value={editFormValues.email}
                    onChange={(e) => setEditFormValues(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                  <Input
                    label="Full Name"
                    type="text"
                    value={editFormValues.name}
                    onChange={(e) => setEditFormValues(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                  <Input
                    label="Role"
                    type="select"
                    value={editFormValues.role_id}
                    onChange={(val) => setEditFormValues(prev => ({ ...prev, role_id: val }))}
                    options={roleOptions}
                    placeholder="Select Role"
                    required
                  />

                  <div className="flex justify-end gap-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setEditUser(null)}
                      className="px-6 py-3 bg-gray-200 rounded-xl hover:bg-gray-300 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isEditing}
                      className="px-10 py-3 bg-black text-white rounded-xl font-medium shadow-lg hover:bg-gray-100 hover:text-black border transition-all disabled:opacity-70"
                    >
                      {isEditing ? "Saving..." : "Save Changes"}
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