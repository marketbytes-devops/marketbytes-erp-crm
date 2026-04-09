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
  const [isInitialLoad, setIsInitialLoad] = useState(true);

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
          email: empData.email || "",
          mobile: empData.mobile || "",
          country_code: empData.country_code || "+91",
          address: empData.address || "",
          residential_address: empData.residential_address || "",
          is_residential_same: empData.is_residential_same || false,
          role_id: empData.role?.id || "",
          designation_id: empData.designation?.id || "",
          department_id: empData.department?.id || "",
          reports_to: empData.reports_to?.id || "",
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

  /*
  useEffect(() => {
  if (isInitialLoad) {
  setIsInitialLoad(false);
  return;
  }
  // Clear Reports To if Department changes
  setFormData(prev => (prev ? { ...prev, reports_to: "" } : null));
  }, [formData?.department_id]);
  */

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
        if (key === 'reports_to') {
          data.append('reports_to_id', value);
        } else {
          data.append(key, value);
        }
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
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <Loading />
      </div>
    );
  }

  const departmentOptions = departments.map(d => ({ value: d.id, label: d.name }));
  const designationOptions = designations.map(d => ({ value: d.id, label: d.name }));
  const roleOptions = roles.map(r => ({ value: r.id, label: r.name }));

  const filteredEmployees = employees;

  const reportsToOptions = filteredEmployees.map(e => ({
    value: e.id,
    label: `${e.name} (${(e.employee_id || "No ID").replace("EMP", "MB")})`,
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
      <LayoutComponents title="Edit Employee" subtitle="Update employee information and settings" variant="card">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Link
            to="/hr/employees"
            className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 hover:bg-gray-100 transition px-4 py-3 text-sm rounded-xl font-medium"
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
                  Employee ID
                </label>
                <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-mono text-gray-800 text-lg font-semibold h-[50px] flex items-center">
                  {formData.employee_id}
                </div>
                <p className="text-[10px] text-gray-500 mt-1.5 flex items-center gap-1 uppercase tracking-wider font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  Fixed ID
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
              
              <div className="grid grid-cols-3 gap-3">
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

              <Input 
                label="Date of Birth" 
                type="date" 
                value={formData.dob} 
                onChange={e => setFormData({ ...formData, dob: e.target.value })} 
                required
              />
              
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
                    onChange={e => {
                      if (e.target.files[0]) {
                        setFormData({ ...formData, profile_picture: e.target.files[0] });
                      }
                    }} 
                 />
              </div>
            </div>

            <div className="mt-10 pt-8 border-t border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <Input
                      label="Permanent Address"
                      type="textarea"
                      rows={4}
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
                      placeholder="If different from permanent address"
                      value={formData.residential_address}
                      onChange={e => setFormData({ ...formData, residential_address: e.target.value })}
                      disabled={formData.is_residential_same}
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
              <h3 className="text-lg font-semibold text-gray-900">Job & Role Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
              <Input
                label="User Role"
                type="select"
                options={[{ value: "", label: "None" }, ...roleOptions]}
                value={formData.role_id}
                onChange={v => setFormData({ ...formData, role_id: v })}
              />
              <Input
                label="Designation"
                type="select"
                options={[{ value: "", label: "Select Designation" }, ...designationOptions]}
                value={formData.designation_id}
                onChange={v => setFormData({ ...formData, designation_id: v })}
                required
              />
              <Input
                label="Department"
                type="select"
                options={[{ value: "", label: "Select Department" }, ...departmentOptions]}
                value={formData.department_id}
                onChange={v => setFormData({ ...formData, department_id: v })}
                required
              />
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
              <h3 className="text-lg font-semibold text-gray-900">Account & Access Settings</h3>
            </div>
            
            <div className="space-y-8">
              <div className="flex flex-wrap items-center gap-12">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={formData.login_enabled}
                    onChange={e => setFormData({ ...formData, login_enabled: e.target.checked })}
                    className="w-6 h-6 rounded border-gray-300 text-black focus:ring-black cursor-pointer shadow-sm"
                  />
                  <span className="font-semibold text-gray-800 group-hover:text-black transition-colors">Enable Login Access</span>
                </label>

                <div className="flex items-center gap-8 bg-gray-50 px-6 py-3 rounded-2xl border border-gray-100">
                  <span className="font-bold text-xs uppercase tracking-widest text-gray-500">Email Notifications</span>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input type="radio" name="notify" checked={formData.email_notifications} onChange={() => setFormData({ ...formData, email_notifications: true })} className="w-4 h-4 text-black focus:ring-black" />
                      <span className="text-sm font-medium">Yes</span>
                    </label>
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input type="radio" name="notify" checked={!formData.email_notifications} onChange={() => setFormData({ ...formData, email_notifications: false })} className="w-4 h-4 text-black focus:ring-black" />
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
                    Generate New Random Password & Send via Email
                  </label>
                </div>

                {!generatePassword && (
                   <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                      <div className="md:col-span-3">
                        <Input
                          label="Set Custom Password (Optional)"
                          type="password"
                          placeholder="Leave blank to keep current password"
                          value={customPassword}
                          onChange={e => setCustomPassword(e.target.value)}
                        />
                      </div>
                      <div className="pb-2">
                        <button
                          type="button"
                          onClick={handleGeneratePassword}
                          className="w-full bg-black text-white hover:bg-gray-800 transition-all flex items-center justify-center gap-2 px-6 py-3.5 text-sm rounded-xl font-bold uppercase tracking-wider shadow-lg"
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
          <div className="flex justify-end gap-4 mt-8">
            <Link
              to="/hr/employees"
              className="border border-gray-300 text-gray-700 hover:bg-gray-100 transition px-6 py-3.5 text-sm rounded-xl font-bold uppercase tracking-wider"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitLoading}
              className="flex items-center gap-3 bg-black text-white hover:bg-gray-800 transition disabled:opacity-50 px-8 py-3.5 text-sm rounded-xl font-bold uppercase tracking-wider shadow-lg"
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