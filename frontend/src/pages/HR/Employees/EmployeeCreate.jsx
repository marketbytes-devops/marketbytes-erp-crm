import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import LayoutComponents from "../../../components/LayoutComponents";
import Input from "../../../components/Input";
import { MdArrowBack, MdAutoAwesome } from "react-icons/md";
import toast from "react-hot-toast";
import apiClient from "../../../helpers/apiClient";
import Loading from "../../../components/Loading";

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
  const [designations, setDesignations] = useState([]);
  const [employees, setEmployees] = useState([]);

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
          .filter(id => id && id.startsWith("EMP"))
          .map(id => parseInt(id.replace("EMP", "")) || 0);

        const maxId = usedIds.length > 0 ? Math.max(...usedIds) : 0;
        const nextId = `EMP${String(maxId + 1).padStart(4, "0")}`;
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
      profile_picture: 'image'
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loading />
      </div>
    );
  }

  const departmentOptions = departments.map(d => ({ value: d.id, label: d.name }));
  const designationOptions = designations.map(d => ({
    value: d.id,
    label: d.name + (d.role_name ? ` (Role: ${d.role_name})` : '')
  }));
  const reportsToOptions = employees.map(e => ({
    value: e.id,
    label: `${e.name} (${e.employee_id || 'No ID'})`
  }));

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
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
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  Employee ID <span className="text-red-500">*</span>
                </label>
                <div className="px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg font-mono text-gray-800">
                  {nextEmployeeId || "EMP0001"}
                </div>
                <p className="text-xs text-gray-500 mt-1">Auto-generated • Cannot be changed</p>
              </div>

              <Input label="Full Name" required placeholder="John Doe" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              <Input label="Email" required type="email" placeholder="john@company.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
              <Input label="Username" required placeholder="johndoe" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} />
              <Input label="Mobile Number" placeholder="9876543210" value={formData.mobile} onChange={e => setFormData({ ...formData, mobile: e.target.value })} />
              <Input label="Country Code" placeholder="+91" value={formData.country_code} onChange={e => setFormData({ ...formData, country_code: e.target.value })} />
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
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Job Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <Input
                  label="Designation"
                  required
                  type="select"
                  options={[{ value: "", label: "Select Designation" }, ...designationOptions]}
                  value={formData.designation_id}
                  onChange={v => setFormData({ ...formData, designation_id: v })}
                />
                {selectedDesignation && (
                  <p className={`text-sm font-medium mt-2 ${selectedDesignation.role_name ? 'text-green-600' : 'text-amber-600'}`}>
                    {selectedDesignation.role_name ? `Role: ${selectedDesignation.role_name}` : "No role assigned"}
                  </p>
                )}
              </div>
              <Input label="Department" required type="select" options={[{ value: "", label: "Select Department" }, ...departmentOptions]} value={formData.department_id} onChange={v => setFormData({ ...formData, department_id: v })} />
              <Input label="Reports To" type="select" options={[{ value: "", label: "None (Top Level)" }, ...reportsToOptions]} value={formData.reports_to || ""} onChange={v => setFormData({ ...formData, reports_to: v || null })} />
              <Input label="Joining Date" required type="date" value={formData.joining_date} onChange={e => setFormData({ ...formData, joining_date: e.target.value })} />
              <Input label="Probation Period (months)" type="number" placeholder="3" value={formData.probation_period} onChange={e => setFormData({ ...formData, probation_period: e.target.value })} />
              <Input label="Hourly Rate ($)" type="number" step="0.01" placeholder="45.00" value={formData.hourly_rate} onChange={e => setFormData({ ...formData, hourly_rate: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 gap-6 mt-6">
              <Input label="Skills (comma separated)" placeholder="React, Node.js, Leadership" value={formData.skills} onChange={e => setFormData({ ...formData, skills: e.target.value })} />
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Account Settings</h3>
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
                  <label className="font-semibold text-gray-800">
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
                        className="px-6 py-3 bg-linear-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition text-sm font-medium flex items-center shadow-md"
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
              disabled={loading || (!generatePassword && !customPassword.trim())}
              className="flex items-center gap-3 px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-900 transition text-sm font-semibold disabled:opacity-50"
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