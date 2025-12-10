import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { Search, Trash2, Edit, Loader2, X, Shield } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import apiClient from "../../helpers/apiClient";
import LayoutComponents from "../../components/LayoutComponents";
import Loading from "../../components/Loading";
import Input from "../../components/Input";

const createRoleSchema = z.object({
  name: z.string().min(1, "Role name is required"),
  description: z.string().optional(),
});

const Roles = () => {
  const [roles, setRoles] = useState([]);
  const [editRole, setEditRole] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [permissionsData, setPermissionsData] = useState([]);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(true);

  const {
    register: registerCreate,
    handleSubmit: handleCreateSubmit,
    formState: { errors: createErrors, isSubmitting: isCreating },
    reset: resetCreate,
  } = useForm({
    resolver: zodResolver(createRoleSchema),
  });

  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    formState: { errors: editErrors, isSubmitting: isEditing },
    reset: resetEdit,
    setValue,
  } = useForm({
    resolver: zodResolver(createRoleSchema),
  });

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
    return perm && perm[`can_${action}`];
  };

  const fetchRoles = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get("/auth/roles/");
      setRoles(response.data);
    } catch (error) {
      toast.error("Failed to fetch roles.");
    } finally {
      setIsLoading(false);
    }
  };

  const onCreateRole = async (data) => {
    if (!hasPermission("roles", "add")) {
      toast.error("You do not have permission to create roles.");
      return;
    }

    try {
      const response = await apiClient.post("/auth/roles/", {
        name: data.name.trim(),
        description: data.description?.trim() || null,
      });
      setRoles((prev) => [...prev, response.data]);
      toast.success("Role created successfully!");
      resetCreate();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to create role.");
    }
  };

  const onEditRole = async (data) => {
    try {
      const response = await apiClient.put(`/auth/roles/${editRole.id}/`, {
        name: data.name.trim(),
        description: data.description?.trim() || null,
      });
      setRoles((prev) => prev.map((r) => (r.id === editRole.id ? response.data : r)));
      toast.success("Role updated successfully!");
      setEditRole(null);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to update role.");
    }
  };

  const handleDeleteRole = async (id) => {
    if (!hasPermission("roles", "delete")) {
      toast.error("You do not have permission to delete roles.");
      return;
    }
    const role = roles.find((r) => r.id === id);
    if (role.name === "Superadmin") {
      toast.error("Superadmin role cannot be deleted.");
      return;
    }
    if (!window.confirm(`Delete "${role.name}" permanently?`)) return;

    try {
      await apiClient.delete(`/auth/roles/${id}/`);
      setRoles((prev) => prev.filter((r) => r.id !== id));
      toast.success("Role deleted successfully");
    } catch (error) {
      toast.error("Failed to delete role.");
    }
  };

  const openEditModal = (role) => {
    if (!hasPermission("roles", "edit") || role.name === "Superadmin") {
      toast.error("You cannot edit the Superadmin role.");
      return;
    }
    setEditRole(role);
    setValue("name", role.name);
    setValue("description", role.description || "");
  };

  const filteredRoles = roles.filter((role) =>
    role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (role.description && role.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (isLoading || isLoadingPermissions) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="p-6">
      <LayoutComponents
        title="Roles Management"
        subtitle="Create, edit, and delete user roles. Assign permissions separately."
        variant="table"
      >
        {hasPermission("roles", "add") && (
          <div className="bg-white rounded-xl shadow-inner border border-gray-200 overflow-hidden mb-6">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-2xl font-medium text-black flex items-center gap-3">
                <Shield className="w-8 h-8" />
                Create New Role
              </h3>
            </div>
            <div className="p-6">
              <form onSubmit={handleCreateSubmit(onCreateRole)} className="grid md:grid-cols-2 gap-6">
                <Input
                  label="Role Name"
                  placeholder="e.g. Manager, Editor"
                  {...registerCreate("name")}
                  error={createErrors.name?.message}
                  required
                />
                <Input
                  label="Description (Optional)"
                  placeholder="Brief description of this role"
                  {...registerCreate("description")}
                  error={createErrors.description?.message}
                />
                <div className="md:col-span-2">
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="inline-flex items-center gap-4 px-6 py-3 rounded-xl text-sm font-medium bg-black text-white hover:bg-white hover:text-black border transition-all duration-300 shadow-lg disabled:opacity-70"
                  >
                    {isCreating && <Loader2 className="w-6 h-6 animate-spin" />}
                    {isCreating ? "Creating..." : "Create Role"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-inner border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h3 className="text-2xl font-medium text-black">Existing Roles</h3>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Search roles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-10 py-3 rounded-xl border border-gray-300 focus:border-black focus:ring-4 focus:ring-black/10 outline-none transition w-full sm:w-80"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          <div className="overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-5 text-left text-sm font-medium text-black uppercase tracking-wider">Role Name</th>
                  <th className="px-6 py-5 text-left text-sm font-medium text-black uppercase tracking-wider">Description</th>
                  <th className="px-6 py-5 text-left text-sm font-medium text-black uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRoles.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="px-6 py-16 text-center text-gray-500 text-lg">
                      No roles found
                    </td>
                  </tr>
                ) : (
                  filteredRoles.map((role) => (
                    <motion.tr
                      key={role.id}
                      className="hover:bg-gray-50 transition"
                      whileHover={{ x: 4 }}
                    >
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-4">
                          <span className="text-lg font-medium text-black">{role.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-6 text-gray-700">{role.description || "—"}</td>
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => openEditModal(role)}
                            disabled={!hasPermission("roles", "edit") || role.name === "Superadmin"}
                            className={`
                              inline-flex items-center gap-3 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 shadow-lg
                              ${hasPermission("roles", "edit") && role.name !== "Superadmin"
                                ? "bg-black text-white hover:bg-white hover:text-black border"
                                : "bg-gray-200 text-gray-500 cursor-not-allowed"
                              }
                            `}
                          >
                            <Edit className="w-5 h-5" />
                            Edit
                          </button>

                          <button
                            onClick={() => handleDeleteRole(role.id)}
                            disabled={!hasPermission("roles", "delete") || role.name === "Superadmin"}
                            className={`
                              inline-flex items-center gap-3 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 shadow-lg
                              ${hasPermission("roles", "delete") && role.name !== "Superadmin"
                                ? "bg-red-600 text-white hover:bg-red-700"
                                : "bg-gray-200 text-gray-500 cursor-not-allowed"
                              }
                            `}
                          >
                            <Trash2 className="w-5 h-5" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <AnimatePresence>
          {editRole && (
            <motion.div
              className="fixed inset-0 backdrop-brightness-50 flex items-center justify-center z-50 p-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditRole(null)}
            >
              <motion.div
                className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden"
                initial={{ scale: 0.9, y: 100 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 100 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="bg-black text-white px-10 py-8 text-center">
                  <h2 className="text-3xl font-medium">
                    Edit Role: <span className="text-gray-300">{editRole.name}</span>
                  </h2>
                </div>

                <div className="p-10">
                  <form onSubmit={handleEditSubmit(onEditRole)} className="space-y-8">
                    <Input
                      label="Role Name"
                      {...registerEdit("name")}
                      error={editErrors.name?.message}
                      required
                    />
                    <div>
                      <label className="block text-sm font-medium text-black mb-3">Description (Optional)</label>
                      <textarea
                        {...registerEdit("description")}
                        rows={4}
                        className={`
                          w-full px-5 py-4 rounded-xl border transition
                          ${editErrors.description ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:border-black"}
                          focus:ring-4 focus:ring-black/10 outline-none resize-none
                        `}
                        placeholder="Optional description..."
                      />
                      {editErrors.description && (
                        <p className="text-sm text-red-600 mt-1">{editErrors.description.message}</p>
                      )}
                    </div>

                    <div className="flex justify-end gap-6 pt-6">
                      <button
                        type="button"
                        onClick={() => setEditRole(null)}
                        className="px-8 py-4 bg-gray-200 text-black font-medium rounded-xl hover:bg-gray-300 transition text-lg"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isEditing}
                        className="px-10 py-4 bg-black text-white font-medium rounded-xl hover:bg-white hover:text-black border transition text-lg shadow-xl disabled:opacity-70"
                      >
                        {isEditing ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </LayoutComponents>
    </div>
  );
};

export default Roles;