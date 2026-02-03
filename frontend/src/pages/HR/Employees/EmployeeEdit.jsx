import { useState, useEffect, useMemo } from "react";
import { Link, useParams, useNavigate } from "react-router";
import { MdArrowBack, MdAutoAwesome, MdBadge, MdShield, MdBlock, MdCheckCircle } from "react-icons/md";
import toast from "react-hot-toast";
import apiClient from "../../../helpers/apiClient";
import Loading from "../../../components/Loading";
import LayoutComponents from "../../../components/LayoutComponents";
import Input from "../../../components/Input";
import PermissionMatrix from "../../../components/PermissionMatrix";

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
  admin: { apiName: "admin", displayName: "Dashboard", route: "/Dashboard" },
  enquiries: { apiName: "enquiries", displayName: "Enquiries", route: "/enquiries" },
  new_enquiries: { apiName: "new_enquiries", displayName: "New Assigned Enquiries", route: "/new_enquiries" },
  follow_ups: { apiName: "follow_ups", displayName: "Follow Ups", route: "/follow_ups" },
  processing_enquiries: { apiName: "processing_enquiries", displayName: "Processing Enquiries", route: "/processing_enquiries" },
  survey: { apiName: "survey", displayName: "Survey", route: "/survey" },
  quotation: { apiName: "quotation", displayName: "Quotation", route: "/quotation" },
  booking: { apiName: "booking", displayName: "Booking", route: "/booking" },
  operations: { apiName: "operations", displayName: "Operations", route: "/operations" },
  accounts: { apiName: "accounts", displayName: "Accounts", route: "/accounts" },
  hr: { apiName: "hr", displayName: "HR", route: "/hr" },
  employees: { apiName: "employees", displayName: "Employees", route: "/hr/employees" },
  departments: { apiName: "departments", displayName: "Departments", route: "/hr/departments" },
  reports: { apiName: "reports", displayName: "Reports", route: "/reports" },
  users: { apiName: "users", displayName: "Users", route: "/roles/users" },
  roles: { apiName: "roles", displayName: "Roles", route: "/roles/roles" },
  permissions: { apiName: "permissions", displayName: "Permissions", route: "/roles/permissions" },
  settings: { apiName: "settings", displayName: "Settings", route: "/settings" },
  profile: { apiName: "profile", displayName: "Profile", route: "/profile" }
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

  // Permission states
  const initialPermissions = useMemo(() => {
    const perms = {};
    Object.keys(pageNameMap).forEach(key => {
      perms[key] = { view: false, add: false, edit: false, delete: false };
    });
    return perms;
  }, []);

  const [directPermissions, setDirectPermissions] = useState(initialPermissions);
  const [overrides, setOverrides] = useState(initialPermissions);
  const [effectivePermissions, setEffectivePermissions] = useState({});

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

        setEmployeeId(empData.employee_id || "N/A");
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

        // Load Direct Permissions
        const loadedDirect = { ...initialPermissions };
        (empData.direct_permissions || []).forEach(perm => {
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
        setDirectPermissions(loadedDirect);

        // Load Overrides (Note: Backend structure for overrides might vary, assuming is_blocked for now)
        // We'll calculate/load them if available or if the user creates them.
        setEffectivePermissions(empData.effective_permissions || {});

      } catch (err) {
        toast.error("Failed to load employee data");
        navigate("/hr/employees");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, navigate, initialPermissions]);

  const handlePermissionChange = (pageKey, action, value) => {
    setDirectPermissions(prev => ({
      ...prev,
      [pageKey]: {
        ...prev[pageKey],
        [action]: value
      }
    }));
  };

  const handleOverrideChange = (pageKey, action, value) => {
    setOverrides(prev => ({
      ...prev,
      [pageKey]: {
        ...prev[pageKey],
        [action]: value
      }
    }));
  };

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

    // Process direct permissions
    const directPermsArray = Object.keys(directPermissions)
      .map(key => {
        const p = directPermissions[key];
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

    if (directPermsArray.length > 0) {
      data.append('user_permissions', JSON.stringify(directPermsArray));
    }

    // Process overrides (BLOCKS)
    const overridesArray = Object.keys(overrides)
      .flatMap(key => {
        const o = overrides[key];
        return Object.keys(o)
          .filter(action => o[action])
          .map(action => ({
            page: pageNameMap[key].apiName,
            action: `can_${action}`,
            is_blocked: true
          }));
      });

    if (overridesArray.length > 0) {
      data.append('permission_overrides', JSON.stringify(overridesArray));
    }

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
    label: `${e.name} (${e.employee_id || "No ID"})`,
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
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Input label="Full Name" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              <Input label="Username" required value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} />
              <Input label="Mobile Number" value={formData.mobile} onChange={e => setFormData({ ...formData, mobile: e.target.value })} />
              <Input label="Country Code" value={formData.country_code} onChange={e => setFormData({ ...formData, country_code: e.target.value })} />
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
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Job & Role Information</h3>
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

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <MdShield className="w-6 h-6" />
              Direct User Permissions
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Assigned directly to this user. Combined with role permissions using OR logic.
            </p>
            <PermissionMatrix
              permissions={directPermissions}
              onChange={handlePermissionChange}
              pageNameMap={pageNameMap}
              type="direct"
            />
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-red-600 mb-6 flex items-center gap-2">
              <MdBlock className="w-6 h-6" />
              Permission Overrides (BLOCKS)
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              BLOCK specific actions even if they are allowed by the role or direct permissions.
            </p>
            <PermissionMatrix
              permissions={overrides}
              onChange={handleOverrideChange}
              pageNameMap={pageNameMap}
              type="override"
            />
          </div>

          <div className="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <MdCheckCircle className="w-6 h-6 text-green-600" />
              Effective Permissions (Preview)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Object.keys(pageNameMap).map(key => {
                const apiName = pageNameMap[key].apiName;
                const perms = effectivePermissions[apiName] || {};
                const hasAny = perms.can_view || perms.can_add || perms.can_edit || perms.can_delete;

                if (!hasAny) return null;

                return (
                  <div key={key} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                    <p className="font-bold text-xs uppercase text-gray-500 mb-2">{pageNameMap[key].displayName}</p>
                    <div className="flex flex-wrap gap-1">
                      {perms.can_view && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] rounded-full font-bold">VIEW</span>}
                      {perms.can_add && <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] rounded-full font-bold">ADD</span>}
                      {perms.can_edit && <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] rounded-full font-bold">EDIT</span>}
                      {perms.can_delete && <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] rounded-full font-bold">DEL</span>}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-gray-500 mt-4 italic">
              * This is a read-only preview of what the user can actually do after combining all sources.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Account & Access Settings</h3>
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
                  <label className="font-semibold text-gray-800">
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
              className="flex items-center gap-3 px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-900 transition text-sm font-semibold disabled:opacity-50"
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