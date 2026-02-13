import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router";
import { MdArrowBack, MdAutoAwesome, MdBadge } from "react-icons/md";
import toast from "react-hot-toast";
import apiClient from "../../../helpers/apiClient";
import Loading from "../../../components/Loading";
import LayoutComponents from "../../../components/LayoutComponents";
import Input from "../../../components/Input";
import { countryCodes } from "../../../utils/countryCodes";

const generateStrongPassword = () => {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";
  let password = "";
  const array = new Uint32Array(16);
  crypto.getRandomValues(array);
  for (let i = 0; i < 16; i++) {
    password += charset[array[i] % charset.length];
  }
  return password;
};

const pageNameMap = {
  // Common / Home
  admin: { apiName: "admin", displayName: "Dashboard", route: "/Dashboard" },

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
  timelogs: { apiName: "timelogs", displayName: "Time Log", route: "/operations/time-logs" },
  task_calendar: { apiName: "task_calendar", displayName: "Task Calendar", route: "/operations/task-calendar" },
  scrum: { apiName: "scrum", displayName: "Scrum", route: "/operations/scrum" },
  contracts: { apiName: "contracts", displayName: "Contracts", route: "/operations/contracts" },

  // Sales
  leads: { apiName: "leads", displayName: "Leads", route: "/sales/leads" },
  pipeline: { apiName: "pipeline", displayName: "Pipeline", route: "/sales/pipeline" },
  communication_tools: { apiName: "communication_tools", displayName: "Communication Tools", route: "/sales/communication-tools" },
  invoices: { apiName: "invoices", displayName: "Invoices", route: "/sales/invoices" },
  reports: { apiName: "reports", displayName: "Reports", route: "/sales/reports" },
  customer: { apiName: "customer", displayName: "Clients & Companies", route: "/sales/customer" },

  // User Roles
  roles: { apiName: "roles", displayName: "Roles", route: "/user-roles/roles" },
  users: { apiName: "users", displayName: "Users", route: "/user-roles/users" },
  permissions: { apiName: "permissions", displayName: "Permissions", route: "/user-roles/permissions" },

  // Profile
  profile: { apiName: "profile", displayName: "Profile", route: "/profile" },
};

const EmployeeEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formData, setFormData] = useState(null);
  const [employeeId, setEmployeeId] = useState("");
  const [employeeName, setEmployeeName] = useState("");

  const [generatePassword, setGeneratePassword] = useState(false);
  const [customPassword, setCustomPassword] = useState("");

  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [effectivePermissions, setEffectivePermissions] = useState({});
  const [directPermissions, setDirectPermissions] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [empRes, deptRes, roleRes, empAllRes] = await Promise.all([
          apiClient.get(`/auth/users/${id}/`),
          apiClient.get("/auth/departments/"),
          apiClient.get("/auth/roles/"),
          apiClient.get("/auth/users/"),
        ]);

        const extract = d => (Array.isArray(d) ? d : d.results || []);

        const allEmployees = extract(empAllRes.data);
        setDepartments(extract(deptRes.data));
        setRoles(extract(roleRes.data));
        setEmployees(allEmployees.filter(e => e.id !== parseInt(id)));

        const empData = empRes.data;

        setEmployeeId((empData.employee_id || "N/A").replace("EMP", "MB"));
        setEmployeeName(empData.name || "Employee");

        setFormData({
          name: empData.name || "",
          username: empData.username || "",
          mobile: empData.mobile || "",
          country_code: empData.country_code || "+91",
          address: empData.address || "",
          role_id: empData.role?.id || "",
          department_id: empData.department?.id || "",
          reports_to: empData.reports_to || "",
          joining_date: empData.joining_date || "",
          dob: empData.dob || "",
          gender: empData.gender || "",
          skills: empData.skills || "",
          probation_period: empData.probation_period || "",
          hourly_rate: empData.hourly_rate || "",
          status: empData.status || "active",
          login_enabled: empData.login_enabled ?? true,
          email_notifications: empData.email_notifications ?? true,
          exit_date: empData.exit_date || "",
          image: null,
        });

        setEffectivePermissions(empData.effective_permissions || {});

        const permissionsMap = {};
        Object.keys(pageNameMap).forEach((key) => {
          permissionsMap[key] = { view: false, add: false, edit: false, delete: false };
        });

        (empData.direct_permissions || []).forEach((perm) => {
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
        setDirectPermissions(permissionsMap);

      } catch (err) {
        toast.error("Failed to load employee data");
        navigate("/hr/employees");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);


  const handleGeneratePassword = () => {
    const newPass = generateStrongPassword();
    setCustomPassword(newPass);
    navigator.clipboard.writeText(newPass);
    toast.success("Strong password generated & copied!");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);

    const data = new FormData();

    Object.entries(formData).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== "") {
        data.append(key, value);
      }
    });

    if (formData.image instanceof File) {
      data.append("image", formData.image);
    }

    if (generatePassword) {
      data.append("generate_password", "true");
    } else if (customPassword.trim()) {
      data.append("password", customPassword);
      data.append("send_password_email", "true");
    }

    // Add direct permissions
    const permsArray = Object.keys(directPermissions).map(key => ({
      page: pageNameMap[key].apiName,
      can_view: directPermissions[key].view,
      can_add: directPermissions[key].add,
      can_edit: directPermissions[key].edit,
      can_delete: directPermissions[key].delete
    }));
    data.append('user_permissions', JSON.stringify(permsArray));


    try {
      await apiClient.put(`/auth/users/${id}/`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Employee updated successfully!" + (generatePassword || customPassword ? " New password sent via email." : ""));
      navigate("/hr/employees");
    } catch (err) {
      const errorMsg =
        err.response?.data?.detail ||
        err.response?.data?.email?.[0] ||
        "Failed to update employee";
      toast.error(errorMsg);
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading || !formData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loading />
      </div>
    );
  }

  const departmentOptions = departments.map(d => ({ value: d.id, label: d.name }));
  const roleOptions = roles.map(r => ({ value: r.id, label: r.name }));
  const reportsToOptions = employees.map(e => ({
    value: e.id,
    label: `${e.name} (${(e.employee_id || "No ID").replace("EMP", "MB")})`,
  }));

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <LayoutComponents title="Edit Employee" subtitle="Update employee information and settings" variant="card">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Link
            to="/hr/employees"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
          >
            <MdArrowBack className="w-5 h-5" />
            Back to Employees
          </Link>

          <div className="flex items-center gap-3">
            <div>
              <p className="text-sm text-gray-500">Employee ID</p>
              <p className="text-xl font-medium text-black">{employeeId}</p>
            </div>
            {employeeName && (
              <span className="ml-4 text-sm font-medium text-black">
                {employeeName}
              </span>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Input label="Full Name" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              <Input label="Username" required value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} />
              <Input label="Mobile Number" value={formData.mobile} onChange={e => setFormData({ ...formData, mobile: e.target.value })} />
              <Input
                label="Country Code"
                type="select"
                options={countryCodes}
                value={formData.country_code}
                onChange={v => setFormData({ ...formData, country_code: v })}
              />
              <Input label="Date of Birth" type="date" value={formData.dob} onChange={e => setFormData({ ...formData, dob: e.target.value })} />
              <Input
                label="Gender"
                type="select"
                options={[
                  { value: "", label: "Select Gender" },
                  { value: "male", label: "Male" },
                  { value: "female", label: "Female" },
                  { value: "other", label: "Other" },
                ]}
                value={formData.gender}
                onChange={v => setFormData({ ...formData, gender: v })}
              />
              <div className="lg:col-span-2">
                <Input label="Address" type="textarea" rows={3} value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
              </div>
              <div>
                <Input label="Profile Picture" type="file" onChange={e => setFormData({ ...formData, image: e.target.files[0] || null })} />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Job & Role Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Input
                label="Role (Optional)"
                type="select"
                options={[{ value: "", label: "None (Direct Permissions Only)" }, ...roleOptions]}
                value={formData.role_id}
                onChange={v => setFormData({ ...formData, role_id: v })}
              />
              <Input
                label="Department"
                type="select"
                options={[{ value: "", label: "Select Department" }, ...departmentOptions]}
                value={formData.department_id}
                onChange={v => setFormData({ ...formData, department_id: v })}
              />
              <Input
                label="Reports To"
                type="select"
                options={[{ value: "", label: "None (Top Level)" }, ...reportsToOptions]}
                value={formData.reports_to || ""}
                onChange={v => setFormData({ ...formData, reports_to: v || null })}
              />
              <Input label="Joining Date" required type="date" value={formData.joining_date} onChange={e => setFormData({ ...formData, joining_date: e.target.value })} />
              <Input label="Exit Date" type="date" value={formData.exit_date} onChange={e => setFormData({ ...formData, exit_date: e.target.value })} />
              <Input label="Status" type="select" options={[
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
                { value: "terminated", label: "Terminated" },
              ]} value={formData.status} onChange={v => setFormData({ ...formData, status: v })} />
              <Input label="Probation Period (months)" type="number" value={formData.probation_period} onChange={e => setFormData({ ...formData, probation_period: e.target.value })} />
              <Input label="Hourly Rate ($)" type="number" step="0.01" value={formData.hourly_rate} onChange={e => setFormData({ ...formData, hourly_rate: e.target.value })} />
              <Input label="Skills (comma separated)" placeholder="React, Leadership, Python" value={formData.skills} onChange={e => setFormData({ ...formData, skills: e.target.value })} />
            </div>
          </div>


          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div>
                <h3 className="text-xl font-medium text-gray-900">Direct Permissions</h3>
                <p className="text-sm text-gray-500 mt-1">Set individual access overrides for this employee</p>
              </div>
              <div className="flex gap-2 p-1.5 bg-white rounded-2xl shadow-sm border border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    const reset = {};
                    Object.keys(pageNameMap).forEach(k => { reset[k] = { view: false, add: false, edit: false, delete: false }; });
                    setDirectPermissions(reset);
                  }}
                  className="px-6 py-2 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Clear All
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const all = {};
                    Object.keys(pageNameMap).forEach(k => { all[k] = { view: true, add: true, edit: true, delete: true }; });
                    setDirectPermissions(all);
                  }}
                  className="px-6 py-2 rounded-xl text-sm font-medium bg-black text-white hover:bg-gray-800 transition-colors"
                >
                  Select All
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#fafbff]">
                  <tr>
                    <th className="px-8 py-5 text-xs font-medium text-gray-400 uppercase tracking-widest">Module / Page</th>
                    {["view", "add", "edit", "delete"].map(action => (
                      <th key={action} className="px-4 py-5 text-xs font-medium text-gray-400 uppercase tracking-widest text-center">{action}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {Object.keys(pageNameMap).map((key) => (
                    <tr key={key} className="hover:bg-gray-50/50 group transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900 leading-none mb-1">{pageNameMap[key].displayName}</span>
                          <span className="text-[10px] text-gray-400 font-mono tracking-tight">{pageNameMap[key].apiName}</span>
                        </div>
                      </td>
                      {["view", "add", "edit", "delete"].map((action) => (
                        <td key={action} className="px-4 py-5 text-center">
                          <div className="flex justify-center">
                            <button
                              type="button"
                              onClick={() => setDirectPermissions(prev => ({
                                ...prev,
                                [key]: { ...prev[key], [action]: !prev[key][action] }
                              }))}
                              className={`${directPermissions[key]?.[action] ? 'bg-[#50728c]' : 'bg-gray-200'
                                } relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
                            >
                              <span
                                className={`${directPermissions[key]?.[action] ? 'translate-x-5' : 'translate-x-0'
                                  } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out mt-0.1`}
                              />
                            </button>
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Account & Access Settings</h3>
            <div className="space-y-7">
              <div className="flex flex-wrap items-center gap-8">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.login_enabled}
                    onChange={e => setFormData({ ...formData, login_enabled: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-400 text-black focus:ring-black"
                  />
                  <span className="font-medium">Enable Login Access</span>
                </label>

                <div className="flex items-center gap-6">
                  <span className="font-medium text-gray-700">Email Notifications:</span>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="notify" checked={formData.email_notifications} onChange={() => setFormData({ ...formData, email_notifications: true })} />
                    <span>Yes</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="notify" checked={!formData.email_notifications} onChange={() => setFormData({ ...formData, email_notifications: false })} />
                    <span>No</span>
                  </label>
                </div>
              </div>

              <div className="pt-6">
                <div className="flex items-center gap-4">
                  <input
                    type="checkbox"
                    checked={generatePassword}
                    onChange={e => {
                      setGeneratePassword(e.target.checked);
                      if (e.target.checked) setCustomPassword("");
                    }}
                    className="w-5 h-5 rounded border-gray-400 text-black"
                  />
                  <label className="font-medium text-gray-800">
                    Generate New Random Password & Send via Email
                  </label>
                </div>

                {!generatePassword && (
                  <div className="max-w-full mt-4">
                    <div className="flex items-center justify-center gap-4">
                      <div className="flex-1">
                        <Input
                          label="Set Custom Password (Optional)"
                          type="password"
                          placeholder="Leave blank to keep current password"
                          value={customPassword}
                          onChange={e => setCustomPassword(e.target.value)}
                        />
                        <p className="text-sm text-gray-600 mt-1">
                          If set, new password will be emailed
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleGeneratePassword}
                        className="px-6 py-3 bg-linear-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition font-medium flex items-center gap-2 shadow-md"
                      >
                        <MdAutoAwesome className="w-5 h-5" />
                        Generate
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Link
              to="/hr/employees"
              className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitLoading}
              className="flex items-center gap-3 px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-900 transition text-sm font-medium disabled:opacity-50"
            >
              {submitLoading ? "Updating..." : "Update Employee"}
            </button>
          </div>
        </form>
      </LayoutComponents>
    </div>
  );
};

export default EmployeeEdit;