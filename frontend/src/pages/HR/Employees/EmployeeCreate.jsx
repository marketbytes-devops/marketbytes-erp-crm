import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import LayoutComponents from "../../../components/LayoutComponents";
import { MdArrowBack, MdAutoAwesome, MdAdd, MdClose, MdBadge } from "react-icons/md";
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



const EmployeeCreate = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(true);
  const [generatePassword, setGeneratePassword] = useState(true);
  const [customPassword, setCustomPassword] = useState("");

  const [nextEmployeeId, setNextEmployeeId] = useState("");

  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [employees, setEmployees] = useState([]);

  // Quick-Add Modal States
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showDesigModal, setShowDesigModal] = useState(false);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newDesigName, setNewDesigName] = useState("");
  const [newDeptName, setNewDeptName] = useState("");
  const [modalLoading, setModalLoading] = useState(false);



  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    mobile: "",
    country_code: "+91",
    address: "",
    residential_address: "",
    is_residential_same: false,
    role_id: "",
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
    image: null,
    exit_date: "",
  });

  const [selectedDesignation, setSelectedDesignation] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setFormLoading(true);

        const [usersRes, deptRes, roleRes, desigRes] = await Promise.all([
          apiClient.get("/auth/users/"),
          apiClient.get("/auth/departments/"),
          apiClient.get("/auth/roles/"),
          apiClient.get("/auth/designations/"),
        ]);

        const extract = (data) => (Array.isArray(data) ? data : data.results || []);

        const users = extract(usersRes.data);
        const depts = extract(deptRes.data);
        const rolesData = extract(roleRes.data);
        const desigsData = extract(desigRes.data);

        setDepartments(depts);
        setRoles(rolesData);
        setDesignations(desigsData);
        setEmployees(users);

        const usedIds = users
          .map(u => u.employee_id)
          .filter(id => id && id.startsWith("MB"))
          .map(id => parseInt(id.replace("MB", "")) || 0);

        const maxId = usedIds.length > 0 ? Math.max(...usedIds) : 0;
        const nextId = `MB${String(maxId + 1).padStart(2, "0")}`;
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
      const [deptRes, roleRes, desigRes] = await Promise.all([
        apiClient.get("/auth/departments/"),
        apiClient.get("/auth/roles/"),
        apiClient.get("/auth/designations/"),
      ]);
      const extract = (data) => (Array.isArray(data) ? data : data.results || []);
      setDepartments(extract(deptRes.data));
      setRoles(extract(roleRes.data));
      setDesignations(extract(desigRes.data));
    } catch (err) {
      console.error("Failed to refresh lists", err);
    }
  };

  const handleSubmitRole = async (e) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;
    setModalLoading(true);
    try {
      await apiClient.post("/auth/roles/", { name: newRoleName });
      toast.success("Role added successfully!");
      setNewRoleName("");
      setShowRoleModal(false);
      await fetchLists();
    } catch (err) {
      toast.error(err.response?.data?.name?.[0] || "Failed to add role");
    } finally {
      setModalLoading(false);
    }
  };

  const handleSubmitDesignation = async (e) => {
    e.preventDefault();
    if (!newDesigName.trim()) return;
    setModalLoading(true);
    try {
      await apiClient.post("/auth/designations/", { name: newDesigName });
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

  /*
  useEffect(() => {
  // Clear Reports To if Department changes
  setFormData(prev => ({ ...prev, reports_to: "" }));
  }, [formData.department_id]);
  */

  const [selectedRole, setSelectedRole] = useState(null);
  useEffect(() => {
    if (formData.role_id) {
      const role = roles.find(r => r.id === parseInt(formData.role_id));
      setSelectedRole(role);
    } else {
      setSelectedRole(null);
    }
  }, [formData.role_id, roles]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.dob) {
      const dobDate = new Date(formData.dob);
      const today = new Date();
      let age = today.getFullYear() - dobDate.getFullYear();
      const m = today.getMonth() - dobDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) {
        age--;
      }
      if (age < 18) {
        toast.error("Employee must be at least 18 years old.");
        return;
      }
    }

    setLoading(true);

    const formDataToSend = new FormData();

    const fieldMapping = {
      name: 'name',
      email: 'email',
      username: 'username',
      mobile: 'mobile',
      country_code: 'country_code',
      address: 'address',
      residential_address: 'residential_address',
      is_residential_same: 'is_residential_same',
      role_id: 'role_id',
      designation_id: 'designation_id',
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
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <Loading />
      </div>
    );
  }

  const departmentOptions = departments.map(d => ({ value: d.id, label: d.name }));
  const designationOptions = designations.map(d => ({
    value: d.id,
    label: d.name
  }));
  const roleOptions = roles.map(r => ({
    value: r.id,
    label: r.name
  }));

  const filteredEmployees = employees;

  const reportsToOptions = filteredEmployees.map(e => ({
    value: e.id,
    label: `${e.name} (${e.employee_id || 'No ID'})`
  }));

  const QuickAddModal = ({ isOpen, onClose, title, value, onChange, onSubmit, placeholder, loading }) => {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 z-2000 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
            <button onClick={onClose} className="p-1.5 rounded-md text-sm hover:bg-gray-100 transition">
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
                className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-100 transition px-4 py-3 text-sm rounded-xl font-medium"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-black text-white hover:bg-gray-100 hover:text-black transition disabled:opacity-50 px-4 py-3 text-sm rounded-xl font-medium"
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
        isOpen={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        title="Add User Role"
        value={newRoleName}
        onChange={setNewRoleName}
        onSubmit={handleSubmitRole}
        placeholder="e.g. Manager"
        loading={modalLoading}
      />
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
            className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 hover:bg-gray-100 transition px-4 py-3 text-sm rounded-xl font-medium"
          >
            <MdArrowBack className="w-5 h-5" />
            Back to Employees
          </Link>

        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center gap-3 mb-8 border-b border-gray-100 pb-4">
              <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center text-white">
                <MdBadge className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Employee ID <span className="text-red-500">*</span>
                </label>
                <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-mono text-gray-800 text-lg font-semibold h-[50px] flex items-center">
                  {nextEmployeeId || "MB01"}
                </div>
                <p className="text-[10px] text-gray-500 mt-1.5 flex items-center gap-1 uppercase tracking-wider font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                  Auto-generated
                </p>
              </div>
              <Input
                label="Full Name"
                required
                placeholder="John Doe"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
              <Input
                label="Email Address"
                required
                type="email"
                placeholder="john@company.com"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-1">
                  <Input
                    label="Code"
                    type="select"
                    options={countryCodes}
                    value={formData.country_code}
                    onChange={v => setFormData({ ...formData, country_code: v })}
                    required
                  />
                </div>
                <div className="col-span-1">
                  <Input
                    label="Mobile Number"
                    placeholder="9876543210"
                    value={formData.mobile}
                    onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="col-span-1">
                <Input
                  label="Date of Birth"
                  type="date"
                  value={formData.dob}
                  onChange={e => setFormData({ ...formData, dob: e.target.value })}
                  required
                />
              </div>
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
                required
              />

              <div className="lg:col-span-3">
                <Input
                  label="Profile Picture"
                  type="file"
                  className="bg-gray-50 border-dashed border-2 hover:border-black transition-colors"
                  onChange={e => setFormData({ ...formData, profile_picture: e.target.files[0] })}
                />
              </div>
            </div>

            <div className="mt-10 pt-8 border-t border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <Input
                    label="Permanent Address"
                    required
                    type="textarea"
                    rows={4}
                    placeholder="Enter permanent contact address"
                    value={formData.address}
                    onChange={e => {
                      const val = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        address: val,
                        residential_address: prev.is_residential_same ? val : prev.residential_address
                      }));
                    }}
                  />
                </div>
                <div className="relative -top-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-black">Residential Address</label>
                    <label className="flex items-center gap-2 cursor-pointer bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.is_residential_same}
                        onChange={e => {
                          const checked = e.target.checked;
                          setFormData(prev => ({
                            ...prev,
                            is_residential_same: checked,
                            residential_address: checked ? prev.address : prev.residential_address
                          }));
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
                      />
                      <span className="text-xs font-bold text-gray-600 uppercase tracking-tight">Same as Permanent</span>
                    </label>
                  </div>
                  <Input
                    type="textarea"
                    rows={4}
                    placeholder="Enter current residential address"
                    value={formData.residential_address}
                    onChange={e => setFormData({ ...formData, residential_address: e.target.value })}
                    disabled={formData.is_residential_same}
                    required={!formData.is_residential_same}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center gap-3 mb-8 border-b border-gray-100 pb-4">
              <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center text-white">
                <MdBadge className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Employment Details</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-black">
                    User Role
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowRoleModal(true)}
                    className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition-all uppercase tracking-tight"
                  >
                    <MdAdd className="w-3.5 h-3.5" /> New
                  </button>
                </div>
                <Input
                  type="select"
                  options={[{ value: "", label: "None" }, ...roleOptions]}
                  value={formData.role_id}
                  onChange={v => setFormData({ ...formData, role_id: v })}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-black">
                    Designation
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowDesigModal(true)}
                    className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition-all uppercase tracking-tight"
                  >
                    <MdAdd className="w-3.5 h-3.5" /> New
                  </button>
                </div>
                <Input
                  type="select"
                  options={[{ value: "", label: "Select Designation" }, ...designationOptions]}
                  value={formData.designation_id}
                  onChange={v => setFormData({ ...formData, designation_id: v })}
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-black">
                    Department
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowDeptModal(true)}
                    className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition-all uppercase tracking-tight"
                  >
                    <MdAdd className="w-3.5 h-3.5" /> New
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

              <Input
                label="Reports To"
                type="select"
                options={[{ value: "", label: "None (Top Level)" }, ...reportsToOptions]}
                value={formData.reports_to || ""}
                onChange={v => setFormData({ ...formData, reports_to: v || null })}
              />
              <Input
                label="Joining Date"
                required
                type="date"
                value={formData.joining_date}
                onChange={e => setFormData({ ...formData, joining_date: e.target.value })}
              />
              <Input
                label="Probation Period"
                type="number"
                placeholder="Months (e.g. 3)"
                value={formData.probation_period}
                onChange={e => setFormData({ ...formData, probation_period: e.target.value })}
              />
              <Input
                label="Hourly Rate ($)"
                type="number"
                step="0.01"
                placeholder="45.00"
                value={formData.hourly_rate}
                onChange={e => setFormData({ ...formData, hourly_rate: e.target.value })}
              />
              <div className="lg:col-span-2">
                <Input
                  label="Skills"
                  placeholder="e.g. React, Node.js, Leadership (comma separated)"
                  value={formData.skills}
                  onChange={e => setFormData({ ...formData, skills: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center gap-3 mb-8 border-b border-gray-100 pb-4">
              <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center text-white">
                <MdAutoAwesome className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Account & Access Control</h3>
            </div>

            <div className="space-y-8">
              <div className="flex flex-wrap items-center gap-12">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={formData.login_enabled}
                      onChange={e => setFormData({ ...formData, login_enabled: e.target.checked })}
                      className="w-6 h-6 rounded border-gray-300 text-black focus:ring-black transition-all cursor-pointer"
                    />
                  </div>
                  <span className="font-semibold text-gray-800 group-hover:text-black transition-colors">Enable Login Access</span>
                </label>

                <div className="flex items-center gap-8 bg-gray-50 px-6 py-3 rounded-2xl border border-gray-100">
                  <span className="font-bold text-xs uppercase tracking-widest text-gray-500">Email Notifications</span>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="radio"
                        name="notify"
                        checked={formData.email_notifications}
                        onChange={() => setFormData({ ...formData, email_notifications: true })}
                        className="w-4 h-4 text-black focus:ring-black"
                      />
                      <span className="text-sm font-medium">Yes</span>
                    </label>
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="radio"
                        name="notify"
                        checked={!formData.email_notifications}
                        onChange={() => setFormData({ ...formData, email_notifications: false })}
                        className="w-4 h-4 text-black focus:ring-black"
                      />
                      <span className="text-sm font-medium">No</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-50">
                <div className="flex items-center gap-4 mb-6">
                  <input
                    type="checkbox"
                    checked={generatePassword}
                    onChange={e => {
                      setGeneratePassword(e.target.checked);
                      if (e.target.checked) setCustomPassword("");
                    }}
                    className="w-6 h-6 rounded border-gray-300 text-black focus:ring-black shadow-sm"
                  />
                  <label className="font-semibold text-gray-900">
                    Generate Secure Password & Send via Email
                  </label>
                </div>

                {!generatePassword && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                      <div className="md:col-span-3">
                        <Input
                          label="Custom Password"
                          type="password"
                          placeholder="••••••••••••"
                          value={customPassword}
                          onChange={e => setCustomPassword(e.target.value)}
                          required
                          helperText="The password will be securely emailed to the employee."
                        />
                      </div>
                      <div className="pb-2">
                        <button
                          type="button"
                          onClick={handleGeneratePassword}
                          className="w-full bg-black text-white hover:bg-gray-800 transition-all flex items-center justify-center gap-2 px-6 py-3.5 text-sm rounded-xl font-bold uppercase tracking-wider"
                        >
                          <MdAutoAwesome className="w-5 h-5" />
                          Generate
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-12 bg-gray-50 -mx-8 -mb-8 p-8 border-t border-gray-100 rounded-b-xl">
            <Link
              to="/hr/employees"
              className="px-8 py-3.5 text-sm font-bold uppercase tracking-wider text-gray-600 hover:text-black hover:bg-white border border-transparent hover:border-gray-200 rounded-xl transition-all duration-300"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || (!generatePassword && !customPassword.trim())}
              className="flex items-center gap-3 bg-black text-white hover:bg-gray-800 transition-all disabled:opacity-50 px-10 py-3.5 text-sm rounded-xl font-bold uppercase tracking-wider shadow-[0_10px_20px_rgba(0,0,0,0.2)] hover:shadow-[0_15px_30px_rgba(0,0,0,0.3)] active:scale-95"
            >
              {loading ? "Creating Employee..." : "Create Employee"}
            </button>
          </div>
        </form>
      </LayoutComponents>
    </div>
  );
};

export default EmployeeCreate;