import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import LayoutComponents from "../../../components/LayoutComponents";
import { MdArrowBack, MdAutoAwesome, MdAdd, MdClose } from "react-icons/md";
import toast from "react-hot-toast";
import apiClient from "../../../helpers/apiClient";
import Loading from "../../../components/Loading";
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

const EmployeeCreate = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(true);
  const [generatePassword, setGeneratePassword] = useState(true);
  const [customPassword, setCustomPassword] = useState("");

  const [nextEmployeeId, setNextEmployeeId] = useState("");

  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [employees, setEmployees] = useState([]);

  // Quick-Add Modal States
  const [showDesigModal, setShowDesigModal] = useState(false);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [newDesigName, setNewDesigName] = useState("");
  const [newDeptName, setNewDeptName] = useState("");
  const [modalLoading, setModalLoading] = useState(false);

  const [directPermissions, setDirectPermissions] = useState(() => {
    const initialPerms = {};
    Object.keys(pageNameMap).forEach(key => {
      initialPerms[key] = { view: false, add: false, edit: false, delete: false };
    });
    return initialPerms;
  });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    username: "",
    mobile: "",
    country_code: "+91",
    address: "",
    designation_id: "",
    department_id: "",
    reports_to: "",
    joining_date: "",
    dob: "",
    gender: "",
    skills: "",
    probation_period: "",
    hourly_rate: "",
    status: "active",
    login_enabled: true,
    email_notifications: true,
    profile_picture: null,
    exit_date: "",
  });

  const [selectedDesignation, setSelectedDesignation] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setFormLoading(true);

        const [usersRes, deptRes, desigRes] = await Promise.all([
          apiClient.get("/auth/users/"),
          apiClient.get("/auth/departments/"),
          apiClient.get("/auth/roles/"),
        ]);

        const extract = (data) => (Array.isArray(data) ? data : data.results || []);

        const users = extract(usersRes.data);
        const depts = extract(deptRes.data);
        const roles = extract(desigRes.data);

        setDepartments(depts);
        setDesignations(roles);
        setEmployees(users);

        const usedIds = users
          .map(u => u.employee_id)
          .filter(id => id && id.startsWith("MB"))
          .map(id => parseInt(id.replace("MB", "")) || 0);

        const maxId = usedIds.length > 0 ? Math.max(...usedIds) : 0;
        const nextId = `MB${String(maxId + 1).padStart(4, "0")}`;
        setNextEmployeeId(nextId);

      } catch (err) {
        toast.error("Failed to load data");
        console.error(err);
      } finally {
        setFormLoading(false);
      }
    };

    fetchData();
  }, []);

  const fetchLists = async () => {
    try {
      const [deptRes, desigRes] = await Promise.all([
        apiClient.get("/auth/departments/"),
        apiClient.get("/auth/roles/"),
      ]);
      const extract = (data) => (Array.isArray(data) ? data : data.results || []);
      setDepartments(extract(deptRes.data));
      setDesignations(extract(desigRes.data));
    } catch (err) {
      console.error("Failed to refresh lists", err);
    }
  };

  const handleSubmitDesignation = async (e) => {
    e.preventDefault();
    if (!newDesigName.trim()) return;
    setModalLoading(true);
    try {
      await apiClient.post("/auth/roles/", { name: newDesigName });
      toast.success("Designation added successfully!");
      setNewDesigName("");
      setShowDesigModal(false);
      await fetchLists();
    } catch (err) {
      toast.error(err.response?.data?.name?.[0] || "Failed to add designation");
    } finally {
      setModalLoading(false);
    }
  };

  const handleSubmitDepartment = async (e) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;
    setModalLoading(true);
    try {
      await apiClient.post("/auth/departments/", { name: newDeptName });
      toast.success("Department added successfully!");
      setNewDeptName("");
      setShowDeptModal(false);
      await fetchLists();
    } catch (err) {
      toast.error(err.response?.data?.name?.[0] || "Failed to add department");
    } finally {
      setModalLoading(false);
    }
  };

  useEffect(() => {
    if (formData.email && !formData.username) {
      const username = formData.email.split("@")[0];
      setFormData(prev => ({ ...prev, username }));
    }
  }, [formData.email]);

  useEffect(() => {
    if (formData.designation_id) {
      const designation = designations.find(d => d.id === parseInt(formData.designation_id));
      setSelectedDesignation(designation);
    } else {
      setSelectedDesignation(null);
    }
  }, [formData.designation_id, designations]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formDataToSend = new FormData();

    const fieldMapping = {
      name: 'name',
      email: 'email',
      username: 'username',
      mobile: 'mobile',
      country_code: 'country_code',
      address: 'address',
      designation_id: 'role_id',
      department_id: 'department_id',
      reports_to: 'reports_to_id',
      joining_date: 'joining_date',
      dob: 'dob',
      gender: 'gender',
      skills: 'skills',
      probation_period: 'probation_period',
      hourly_rate: 'hourly_rate',
      status: 'status',
      login_enabled: 'login_enabled',
      email_notifications: 'email_notifications',
      profile_picture: 'image',
      exit_date: 'exit_date'
    };

    Object.keys(fieldMapping).forEach(key => {
      const value = formData[key];
      if (value !== null && value !== undefined && value !== "") {
        formDataToSend.append(fieldMapping[key], value);
      }
    });

    if (generatePassword) {
      formDataToSend.append('send_password_email', 'true');
    } else if (customPassword.trim()) {
      formDataToSend.append('password', customPassword);
      formDataToSend.append('send_password_email', 'true');
    }

    // Add direct permissions
    const permsArray = Object.keys(directPermissions).map(key => ({
      page: pageNameMap[key].apiName,
      can_view: directPermissions[key].view,
      can_add: directPermissions[key].add,
      can_edit: directPermissions[key].edit,
      can_delete: directPermissions[key].delete
    }));
    formDataToSend.append('user_permissions', JSON.stringify(permsArray));

    try {
      await apiClient.post("/auth/users/", formDataToSend);
      toast.success("Employee created successfully!");
      navigate("/hr/employees");
    } catch (err) {
      const errorMsg =
        err.response?.data?.email?.[0] ||
        err.response?.data?.detail ||
        "Failed to create employee";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePassword = () => {
    const newPass = generateStrongPassword();
    setCustomPassword(newPass);
    navigator.clipboard.writeText(newPass);
    toast.success("Strong password generated & copied!");
  };

  if (formLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loading />
      </div>
    );
  }

  const departmentOptions = departments.map(d => ({ value: d.id, label: d.name }));
  const designationOptions = designations.map(d => ({
    value: d.id,
    label: d.name
  }));
  const reportsToOptions = employees.map(e => ({
    value: e.id,
    label: `${e.name} (${e.employee_id || 'No ID'})`
  }));

  const QuickAddModal = ({ isOpen, onClose, title, value, onChange, onSubmit, placeholder, loading }) => {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition">
              <MdClose className="w-6 h-6 text-gray-500" />
            </button>
          </div>
          <form onSubmit={onSubmit} className="p-6 space-y-6">
            <Input
              label={`${title.split(' ')[1]} Name`}
              placeholder={placeholder}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              required
              autoFocus
            />
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-black text-white font-medium rounded-xl hover:bg-gray-900 transition disabled:opacity-50"
                disabled={loading || !value.trim()}
              >
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Modals */}
      <QuickAddModal
        isOpen={showDesigModal}
        onClose={() => setShowDesigModal(false)}
        title="Add Designation"
        value={newDesigName}
        onChange={setNewDesigName}
        onSubmit={handleSubmitDesignation}
        placeholder="e.g. Senior Developer"
        loading={modalLoading}
      />
      <QuickAddModal
        isOpen={showDeptModal}
        onClose={() => setShowDeptModal(false)}
        title="Add Department"
        value={newDeptName}
        onChange={setNewDeptName}
        onSubmit={handleSubmitDepartment}
        placeholder="e.g. Marketing"
        loading={modalLoading}
      />
      <LayoutComponents title="Add New Employee" subtitle="Fill in the details to create a new employee profile" variant="card">
        <div className="mb-8">
          <Link
            to="/hr/employees"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
          >
            <MdArrowBack className="w-5 h-5" />
            Back to Employees
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Employee ID <span className="text-red-500">*</span>
                </label>
                <div className="px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg font-mono text-gray-800">
                  {nextEmployeeId || "MB0001"}
                </div>
                <p className="text-xs text-gray-500 mt-1">Auto-generated • Cannot be changed</p>
              </div>

              <Input label="Full Name" required placeholder="John Doe" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              <Input label="Email" required type="email" placeholder="john@company.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
              <Input label="Username" required placeholder="johndoe" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} />
              <Input label="Mobile Number" placeholder="9876543210" value={formData.mobile} onChange={e => setFormData({ ...formData, mobile: e.target.value })} />
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
                  { value: "other", label: "Other" }
                ]}
                value={formData.gender}
                onChange={v => setFormData({ ...formData, gender: v })}
              />
              <div className="md:col-span-2 lg:col-span-1">
                <Input label="Profile Picture" type="file" onChange={e => setFormData({ ...formData, profile_picture: e.target.files[0] })} />
              </div>
            </div>
            <div className="mt-6">
              <Input label="Address" type="textarea" rows={3} placeholder="123 Main Street, City, Country" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Job Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-black">
                    Designation / Role (Optional)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowDesigModal(true)}
                    className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors group flex items-center gap-1 text-xs font-semibold"
                    title="Quick Add Designation"
                  >
                    <MdAdd className="w-4 h-4" /> Add New
                  </button>
                </div>
                <Input
                  type="select"
                  options={[{ value: "", label: "None (Direct Permissions Only)" }, ...designationOptions]}
                  value={formData.designation_id}
                  onChange={v => setFormData({ ...formData, designation_id: v })}
                />
                {selectedDesignation && (
                  <p className="text-sm font-medium mt-2 text-green-600">
                    Designation Selected: {selectedDesignation.name}
                  </p>
                )}
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-black">
                    Department <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowDeptModal(true)}
                    className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors group flex items-center gap-1 text-xs font-semibold"
                    title="Quick Add Department"
                  >
                    <MdAdd className="w-4 h-4" /> Add New
                  </button>
                </div>
                <Input
                  type="select"
                  options={[{ value: "", label: "Select Department" }, ...departmentOptions]}
                  value={formData.department_id}
                  onChange={v => setFormData({ ...formData, department_id: v })}
                  required
                />
              </div>
              <Input label="Reports To" type="select" options={[{ value: "", label: "None (Top Level)" }, ...reportsToOptions]} value={formData.reports_to || ""} onChange={v => setFormData({ ...formData, reports_to: v || null })} />
              <Input label="Joining Date" required type="date" value={formData.joining_date} onChange={e => setFormData({ ...formData, joining_date: e.target.value })} />
              <Input label="Exit Date" type="date" value={formData.exit_date} onChange={e => setFormData({ ...formData, exit_date: e.target.value })} />
              <Input label="Probation Period (months)" type="number" placeholder="3" value={formData.probation_period} onChange={e => setFormData({ ...formData, probation_period: e.target.value })} />
              <Input label="Hourly Rate ($)" type="number" step="0.01" placeholder="45.00" value={formData.hourly_rate} onChange={e => setFormData({ ...formData, hourly_rate: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 gap-6 mt-6">
              <Input label="Skills (comma separated)" placeholder="React, Node.js, Leadership" value={formData.skills} onChange={e => setFormData({ ...formData, skills: e.target.value })} />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Account Settings</h3>
            <div className="space-y-6">
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
                    <input type="radio" name="notify" checked={formData.email_notifications} onChange={() => setFormData({ ...formData, email_notifications: true })} className="text-black" />
                    <span>Yes</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="notify" checked={!formData.email_notifications} onChange={() => setFormData({ ...formData, email_notifications: false })} className="text-black" />
                    <span>No</span>
                  </label>
                </div>
              </div>
              <div className="pt-6">
                <div className="flex items-center gap-4 mb-5">
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
                    Generate Random Password & Send via Email (Recommended)
                  </label>
                </div>

                {!generatePassword && (
                  <div className="max-w-full">
                    <div className="flex items-center justify-center gap-4">
                      <div className="flex-1">
                        <Input
                          label="Custom Password"
                          type="password"
                          placeholder="Enter strong password"
                          value={customPassword}
                          onChange={e => setCustomPassword(e.target.value)}
                          required
                        />
                        <p className="text-sm text-gray-600 mt-1">
                          Password will be emailed to the employee
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleGeneratePassword}
                        className="px-6 py-3 bg-linear-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition text-sm font-medium flex items-center"
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
          <div className="flex justify-end gap-4">
            <Link
              to="/hr/employees"
              className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || (!generatePassword && !customPassword.trim())}
              className="flex items-center gap-3 px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-900 transition text-sm font-medium disabled:opacity-50"
            >
              {loading ? "Creating Employee..." : "Create Employee"}
            </button>
          </div>
        </form>
      </LayoutComponents>
    </div >
  );
};

export default EmployeeCreate;