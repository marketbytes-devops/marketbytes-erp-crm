import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { Search, Loader2, X, Shield, Lock, ChevronRight, AlertCircle } from "lucide-react";
import apiClient from "../../helpers/apiClient";
import { usePermission } from "../../context/PermissionContext";
import PermissionMatrix from "../../components/PermissionMatrix";

const pageNameMap = {
  // Dashboards
  admin: { apiName: "admin", displayName: "Admin Dashboard", route: "/" },
  hr_dashboard: { apiName: "hr_dashboard", displayName: "HR Dashboard", route: "/hr-dashboard" },
  sales_dashboard: { apiName: "sales_dashboard", displayName: "Sales Dashboard", route: "/sales-dashboard" },
  lead_dashboard: { apiName: "lead_dashboard", displayName: "Lead Dashboard", route: "/lead-dashboard" },
  employee_dashboard: { apiName: "employee_dashboard", displayName: "My Dashboard", route: "/employee-dashboard" },

  // HR Management
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
  projects: { apiName: "projects", displayName: "Projects", route: "/operations/projects" },
  tasks: { apiName: "tasks", displayName: "Tasks", route: "/operations/tasks" },
  task_board: { apiName: "task_board", displayName: "Task Board", route: "/operations/task-board" },
  time_logs: { apiName: "time_logs", displayName: "Time Log", route: "/operations/time-logs" },
  task_calendar: { apiName: "task_calendar", displayName: "Task Calendar", route: "/operations/task-calendar" },
  common_calendar: { apiName: "common_calendar", displayName: "Events", route: "/operations/common-calendar" },
  scrum: { apiName: "scrum", displayName: "Scrum", route: "/operations/scrum" },
  contracts: { apiName: "contracts", displayName: "Contracts", route: "/operations/contracts" },

  // Sales
  leads: { apiName: "leads", displayName: "Leads", route: "/sales/leads" },
  pipeline: { apiName: "pipeline", displayName: "Pipeline", route: "/sales/pipeline" },
  communication_tools: { apiName: "communication_tools", displayName: "Communication Tools", route: "/sales/communication-tools" },
  invoices: { apiName: "invoices", displayName: "Invoices", route: "/sales/invoices" },
  reports: { apiName: "reports", displayName: "Reports", route: "/sales/reports" },
  customers: { apiName: "customers", displayName: "Clients & Companies", route: "/sales/customer" },

  // User Roles
  roles: { apiName: "roles", displayName: "Roles", route: "/user-roles/roles" },
  users: { apiName: "users", displayName: "Users", route: "/user-roles/users" },
  permissions: { apiName: "permissions", displayName: "Permissions", route: "/user-roles/permissions" },

  // Profile
  profile: { apiName: "profile", displayName: "Profile", route: "/profile" },

  // Lead Management (Scoped)
  lead_management: { apiName: "lead_management", displayName: "Team Management", route: "/team/employees" },
  lead_attendance: { apiName: "lead_attendance", displayName: "Team Attendance", route: "/lead/attendance" },
  lead_leaves: { apiName: "lead_leaves", displayName: "Team Leaves", route: "/lead/leaves" },
  lead_time_logs: { apiName: "lead_time_logs", displayName: "Team Timelogs", route: "/lead/time-logs" },
  lead_projects: { apiName: "lead_projects", displayName: "Team Projects", route: "/lead/projects" },
  lead_tasks: { apiName: "lead_tasks", displayName: "Team Tasks", route: "/lead/tasks" },
  lead_scrum: { apiName: "lead_scrum", displayName: "Team Scrum", route: "/lead/scrum" },

  // Self Management (Scoped)
  employee_projects: { apiName: "employee_projects", displayName: "My Projects", route: "/employee/projects" },
  employee_tasks: { apiName: "employee_tasks", displayName: "My Tasks", route: "/employee/tasks" },
  employee_attendance: { apiName: "employee_attendance", displayName: "My Attendance", route: "/employee/attendance" },
  employee_holidays: { apiName: "employee_holidays", displayName: "My Holidays", route: "/employee/holidays" },
  employee_leaves: { apiName: "employee_leaves", displayName: "My Leaves", route: "/employee/leaves" },
  employee_time_logs: { apiName: "employee_time_logs", displayName: "My Time Logs", route: "/employee/time-logs" },
  employee_scrum: { apiName: "employee_scrum", displayName: "My Scrum", route: "/employee/scrum" },
  employee_task_calendar: { apiName: "employee_task_calendar", displayName: "Task Calendar", route: "/employee/task-calendar" },
};

const Permissions = () => {
 const { hasPermission, isSuperadmin } = usePermission();
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

 // Step 1: Baseline from Role (to show what's already granted)
 if (userData.role?.permissions) {
 userData.role.permissions.forEach((perm) => {
 const matchedKey = Object.keys(pageNameMap).find(
 (key) => pageNameMap[key].apiName === perm.page
 );
 if (matchedKey) {
 permissionsMap[matchedKey] = {
 view: permissionsMap[matchedKey].view || perm.can_view,
 add: permissionsMap[matchedKey].add || perm.can_add,
 edit: permissionsMap[matchedKey].edit || perm.can_edit,
 delete: permissionsMap[matchedKey].delete || perm.can_delete,
 };
 }
 });
 }

 // Step 2: Merge Direct permissions
 (userData.direct_permissions || []).forEach((perm) => {
 const matchedKey = Object.keys(pageNameMap).find(
 (key) => pageNameMap[key].apiName === perm.page
 );
 if (matchedKey) {
 permissionsMap[matchedKey] = {
 view: permissionsMap[matchedKey].view || perm.can_view,
 add: permissionsMap[matchedKey].add || perm.can_add,
 edit: permissionsMap[matchedKey].edit || perm.can_edit,
 delete: permissionsMap[matchedKey].delete || perm.can_delete,
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

 const isAllSelected = (perms) => {
 return Object.values(perms).every(p => p.view && p.add && p.edit && p.delete);
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
 try {
 setIsSaving(true);
 const permsArray = [];

 // We send all toggled perms to the backend.
 // Backend union merging logic will handle the rest.
 Object.keys(userPermissions).forEach((key) => {
 const perms = userPermissions[key];
 // We only need to send it if at least one permission is true
 if (perms.view || perms.add || perms.edit || perms.delete) {
 permsArray.push({
 page: pageNameMap[key].apiName,
 can_view: perms.view,
 can_add: perms.add,
 can_edit: perms.edit,
 can_delete: perms.delete,
 });
 }
 });

 await apiClient.put(`/auth/users/${selectedUser.id}/`, {
 user_permissions: permsArray
 });

 toast.success(`Permissions updated successfully for ${selectedUser.name}!`);
 // Update local state immediately to avoid refresh lag
 setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, direct_permissions: permsArray } : u));
 setSelectedUser(null);
 } catch (error) {
 console.error(error);
 toast.error("Failed to update permissions.");
 } finally {
 setIsSaving(false);
 }
 };


 const filteredUsers = users.filter(u => {
 const matchesSearch = u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
 u.email?.toLowerCase().includes(searchQuery.toLowerCase());

 if (!isSuperadmin && (u.is_superuser || (u.role && u.role.name === "Superadmin"))) return false;
 return matchesSearch;
 });

 if (isLoading) return (
 <div className="p-6 flex items-center justify-center min-h-screen">
 <Loader2 className="w-12 h-12 animate-spin text-gray-600" />
 </div>
 );

 return (
 <div className="p-6 min-h-screen">
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
 <div>
 <h1 className="text-2xl font-medium text-gray-900">Permissions Management</h1>
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
 className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group"
 >
 <div className="absolute top-0 right-0 p-4">
 <span className="bg-blue-50 text-[#50728c] text-[10px] font-medium px-3 py-1 rounded-full uppercase tracking-wider">
 {user.role?.name || "No Role"}
 </span>
 </div>

 <div className="flex items-start gap-4 mb-6 pt-2">
 <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center text-xl font-medium text-gray-400 border border-gray-200 uppercase">
 {user.name?.charAt(0) || "U"}
 </div>
 <div className="flex-1 min-w-0">
 <h3 className="font-medium text-gray-900 truncate pr-20">{user.name}</h3>
 <p className="text-sm text-gray-500 truncate">{user.email}</p>
 </div>
 </div>

 <div className="flex items-center justify-between pt-4 border-t border-gray-50">
 <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">Access Control</span>
 {hasPermission("permissions", "edit") && (
 <button
 onClick={() => openOverridesModal(user)}
 className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-black transition-colors"
 >
 Manage <ChevronRight className="w-4 h-4" />
 </button>
 )}
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
 className="bg-white rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl shadow-black/30"
 onClick={(e) => e.stopPropagation()}
 >
 {/* Modal Header */}
 <div className="p-8 pb-4 flex items-center justify-between border-b border-gray-100">
 <h2 className="text-2xl font-medium text-[#4a627a]">Direct Permissions: {selectedUser.name}</h2>
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
 <h4 className="font-medium text-[#d97706]">User-Specific Permissions</h4>
 <p className="text-sm text-[#d97706] opacity-80 leading-relaxed">
 These settings define specific access rights for this user, complementing their assigned role.
 </p>
 </div>
 </div>

 {/* Bulk Actions Section */}
 <div className="bg-gray-50/80 rounded-3xl p-6 border border-gray-100 shadow-inner">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div>
 <h4 className="font-medium text-gray-900 uppercase tracking-tighter">Select All Permissions</h4>
 <p className="text-xs text-gray-500">Quickly enable or disable all access rights across all modules</p>
 </div>
 <div className="flex gap-2 bg-white p-1.5 rounded-xl shadow-sm border border-gray-100 min-w-[200px] justify-center">
 {isAllSelected(userPermissions) ? (
 <button
 onClick={() => handleBulkAction('deselectAll')}
 className="text-gray-700 hover:bg-gray-50 transition-colors whitespace-nowrap w-full px-4 py-3 text-sm rounded-xl font-medium"
 >
 Deselect All
 </button>
 ) : (
 <button
 onClick={() => handleBulkAction('selectAll')}
 className="bg-[#50728c] text-white transition-opacity hover:opacity-90 whitespace-nowrap w-full px-4 py-3 text-sm rounded-xl font-medium"
 >
 Select All
 </button>
 )}
 </div>
 </div>
 </div>

 {/* Permissions Grid */}
 <PermissionMatrix
 permissions={userPermissions}
 onChange={handleToggleChange}
 pageNameMap={pageNameMap}
 />
 </div>

 {/* Modal Footer */}
 <div className="p-8 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 rounded-b-[2.5rem]">
 <button
 onClick={() => setSelectedUser(null)}
 className=".5 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors shadow-sm px-4 py-3 text-sm rounded-xl font-medium"
 >
 Cancel
 </button>
 <button
 onClick={handleSavePermissions}
 disabled={isSaving}
 className=".5 bg-[#50728c] text-white shadow-xl shadow-blue-900/10 hover:opacity-90 transition-all flex items-center gap-3 px-4 py-3 text-sm rounded-xl font-medium"
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