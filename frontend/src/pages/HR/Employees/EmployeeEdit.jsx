import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router";
import { MdArrowBack, MdAutoAwesome, MdBadge, MdAdd, MdClose } from "react-icons/md";
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



  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [empRes, deptRes, roleRes, desigRes, empAllRes] = await Promise.all([
          apiClient.get(`/auth/users/${id}/`),
          apiClient.get("/auth/departments/"),
          apiClient.get("/auth/roles/"),
          apiClient.get("/auth/designations/"),
          apiClient.get("/auth/users/"),
        ]);

        const extract = d => (Array.isArray(d) ? d : d.results || []);

        const allEmployees = extract(empAllRes.data);
        setDepartments(extract(deptRes.data));
        setRoles(extract(roleRes.data));
        setDesignations(extract(desigRes.data));
        setEmployees(allEmployees.filter(e => e.id !== parseInt(id)));

        const empData = empRes.data;

        setEmployeeId((empData.employee_id || "N/A").replace("EMP", "MB"));
        setEmployeeName(empData.name || "Employee");

        setFormData({
          name: empData.name || "",
          mobile: empData.mobile || "",
          country_code: empData.country_code || "+91",
          address: empData.address || "",
          role_id: empData.role?.id || "",
          designation_id: empData.designation?.id || "",
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



      } catch (err) {
        toast.error("Failed to load employee data");
        navigate("/hr/employees");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

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


  const handleGeneratePassword = () => {
    const newPass = generateStrongPassword();
    setCustomPassword(newPass);
    navigator.clipboard.writeText(newPass);
    toast.success("Strong password generated & copied!");
  };

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
  const designationOptions = designations.map(d => ({ value: d.id, label: d.name }));
  const roleOptions = roles.map(r => ({ value: r.id, label: r.name }));
  const reportsToOptions = employees.map(e => ({
    value: e.id,
    label: `${e.name} (${(e.employee_id || "No ID").replace("EMP", "MB")})`,
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
              label={`${title.split(' ')[1] || title.split(' ')[0]} Name`}
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
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-black">
                    Role (Optional)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowRoleModal(true)}
                    className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors group flex items-center gap-1 text-xs font-semibold"
                    title="Quick Add Role"
                  >
                    <MdAdd className="w-4 h-4" /> Add New
                  </button>
                </div>
                <Input
                  type="select"
                  options={[{ value: "", label: "None (Direct Permissions Only)" }, ...roleOptions]}
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
                    className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors group flex items-center gap-1 text-xs font-semibold"
                    title="Quick Add Designation"
                  >
                    <MdAdd className="w-4 h-4" /> Add New
                  </button>
                </div>
                <Input
                  type="select"
                  options={[{ value: "", label: "Select Designation" }, ...designationOptions]}
                  value={formData.designation_id}
                  onChange={v => setFormData({ ...formData, designation_id: v })}
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
                />
              </div>
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