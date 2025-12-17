import { useState, useEffect } from "react";
import {
  MdAdd,
  MdClose,
  MdVisibility,
  MdVisibilityOff,
  MdArrowBack,
  MdAutoAwesome,
} from "react-icons/md";
import LayoutComponents from "../../../components/LayoutComponents";
import Input from "../../../components/Input";
import toast from "react-hot-toast";
import apiClient from "../../../helpers/apiClient";

const CreateProjectPage = () => {
  const [formData, setFormData] = useState({
    projectName: "",
    projectCategory: "",
    department: "",
    startDate: "",
    deadline: "",
    noDeadline: false,
    amc: false,
    amcDate: "",
    allowManualTimeLogs: true,
    allocatedHours: "",
    renewalOnly: false,
    dm: false,
    projectMembers: [],
    client: "",
    clientCanManageTasks: false,
    sendTaskNotification: false,
    budget: "",
    currency: "",
    hoursAllocated: "",
    status: "Not Started",
    stage: "",
    summary: "",
    note: "",
  });

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState([]);

  // Dynamic states for dropdowns
  const [categories, setCategories] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [stages, setStages] = useState([]);
  const [clients, setClients] = useState([]);
  const [currencies, setCurrencies] = useState([]);

  // Category Modal States
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  // Department Modal States
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);

  const [newDepartmentName, setNewDepartmentName] = useState("");
  const [departments, setDepartments] = useState([]);

  // Client Modal States
  const [showClientModal, setShowClientModal] = useState(false);
  const [newClientData, setNewClientData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  // Project Members Modal States
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [newMemberData, setNewMemberData] = useState({
    employeeId: "",
    name: "",
    email: "",
    password: "",
    designation: "",
    department: "",
    joiningDate: "",
    gender: "",
  });
  const [showMemberPassword, setShowMemberPassword] = useState(false);
  const [generateMemberPassword, setGenerateMemberPassword] = useState(true);
  const [customMemberPassword, setCustomMemberPassword] = useState("");

  // Designation options for dropdown
  const [designations, setDesignations] = useState([]);
  const [genderOptions] = useState([
    { value: "", label: "Select Gender" },
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "other", label: "Other" },
  ]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

 const handleSubmit = async (e) => {
  e.preventDefault();

  // Basic required validation
  if (!formData.projectName || !formData.department || !formData.startDate || (!formData.deadline && !formData.noDeadline)) {
    toast.error("Please fill required fields");
    return;
  }

  try {
    const formDataToSend = new FormData();

    formDataToSend.append('name', formData.projectName);
    formDataToSend.append('department_id', formData.department || '');
    formDataToSend.append('start_date', formData.startDate);
    
    if (!formData.noDeadline) {
      formDataToSend.append('deadline', formData.deadline);
    }
    formDataToSend.append('no_deadline', formData.noDeadline);

    // Optional name-based fields
    // Relations — ID based (MATCHES YOUR SERIALIZER)
if (formData.projectCategory)
  formDataToSend.append('category_id', formData.projectCategory);

if (formData.status)
  formDataToSend.append('status_id', formData.status);

if (formData.stage)
  formDataToSend.append('stage_id', formData.stage);

if (formData.client)
  formDataToSend.append('client_id', formData.client);

if (formData.currency)
  formDataToSend.append('currency_id', formData.currency);


    // Booleans & others
    formDataToSend.append('amc', formData.amc);
    if (formData.amc && formData.amcDate) formDataToSend.append('amc_date', formData.amcDate);
    
    formDataToSend.append('renewal_only', formData.renewalOnly);
    formDataToSend.append('dm', formData.dm);
    formDataToSend.append('allow_manual_timelogs', formData.allowManualTimeLogs);
    if (formData.allowManualTimeLogs && formData.allocatedHours) {
      formDataToSend.append('hours_allocated', formData.allocatedHours);
    }

    formDataToSend.append('client_can_manage_tasks', formData.clientCanManageTasks);
    formDataToSend.append('send_task_notifications_to_client', formData.sendTaskNotification);

    if (formData.budget) formDataToSend.append('budget', formData.budget);
    if (formData.summary) formDataToSend.append('summary', formData.summary);
    if (formData.note) formDataToSend.append('notes', formData.note);

    // Members
    formData.projectMembers.forEach(id => {
      formDataToSend.append('members_ids', id);
    });

    // Files
    files.forEach(file => {
      formDataToSend.append('files', file);
    });

    const response = await apiClient.post("/operation/projects/", formDataToSend);
    // No headers needed!

    toast.success("Project created successfully!");
    handleReset();
    console.log("Created Project:", response.data);
  } catch (error) {
    console.error("Error creating project:", error.response?.data || error);
    toast.error("Failed to create project: " + (error.response?.data?.detail || "Check console"));
  }
};

  const handleReset = () => {
    setFormData({
      projectName: "",
      projectCategory: "",
      department: "",
      startDate: "",
      deadline: "",
      noDeadline: false,
      amc: false,
      amcDate: "",
      allowManualTimeLogs: true,
      allocatedHours: "",
      renewalOnly: false,
      dm: false,
      projectMembers: [],
      client: "",
      clientCanManageTasks: false,
      sendTaskNotification: false,
      budget: "",
      currency: "",
      hoursAllocated: "",
      status: "",
      stage: "",
      summary: "",
      note: "",
    });
    setFiles([]);
  };

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await apiClient.get("/auth/users/");

        const userData = Array.isArray(response.data)
          ? response.data
          : response.data.results || [];

        setUsers(userData);
        console.log("Fetched users:", userData);
      } catch (error) {
        console.error("Error fetching users:", error);
        toast.error("Failed to load users");
      }
    };

    fetchUsers();
  }, []);

  // Fetch designations and departments for dropdowns
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        // Fetch designations (roles)
        const desigResponse = await apiClient.get("/auth/roles/");
        const designationsData = Array.isArray(desigResponse.data)
          ? desigResponse.data
          : desigResponse.data.results || [];

        setDesignations(
          designationsData.map((d) => ({
            value: d.id,
            label: d.name,
          }))
        );

        // Note: Departments are already hardcoded as per instructions
      } catch (error) {
        console.error("Error fetching dropdown data:", error);
      }
    };

    fetchDropdownData();
  }, []);

  // Fetch dynamic data for dropdowns
  useEffect(() => {
    const fetchDynamicData = async () => {
      try {
        setLoading(true);

        // Fetch Categories
        const catRes = await apiClient.get("/operation/categories/");
        setCategories(
          Array.isArray(catRes.data) ? catRes.data : catRes.data?.results || []
        );

        // Fetch Clients
        const clientRes = await apiClient.get("/operation/clients/");
        setClients(
          Array.isArray(clientRes.data)
            ? clientRes.data
            : clientRes.data?.results || []
        );

        // Fetch Statuses
        const statusRes = await apiClient.get("/operation/statuses/");
        setStatuses(
          Array.isArray(statusRes.data)
            ? statusRes.data
            : statusRes.data?.results || []
        );

        // Fetch Stages
        const stageRes = await apiClient.get("/operation/stages/");
        setStages(
          Array.isArray(stageRes.data)
            ? stageRes.data
            : stageRes.data?.results || []
        );

        // Fetch Currencies
        const currencyRes = await apiClient.get("/operation/currencies/");
        setCurrencies(
          Array.isArray(currencyRes.data)
            ? currencyRes.data
            : currencyRes.data?.results || []
        );

        // Fetch Departments
        const deptRes = await apiClient.get("/auth/departments/");
        setDepartments(
          Array.isArray(deptRes.data)
            ? deptRes.data
            : deptRes.data?.results || []
        );
      } catch (error) {
        console.error("Error fetching dynamic data:", error);
        toast.error("Failed to load dropdown options");
      } finally {
        setLoading(false);
      }
    };

    fetchDynamicData();
  }, []);

  // Generate next employee ID
  useEffect(() => {
    if (users.length > 0) {
      const usedIds = users
        .map((u) => u.employee_id || u.employeeId)
        .filter((id) => id && id.startsWith("EMP"))
        .map((id) => parseInt(id.replace("EMP", "")) || 0);

      const maxId = usedIds.length > 0 ? Math.max(...usedIds) : 0;
      const nextId = `EMP${String(maxId + 1).padStart(4, "0")}`;
      setNewMemberData((prev) => ({ ...prev, employeeId: nextId }));
    }
  }, [users]);

  // Category Modal Functions
  const handleAddCategory = async () => {
    if (newCategoryName.trim() === "") {
      toast.error("Please enter a category name");
      return;
    }

    try {
      // POST to backend
      await apiClient.post("/operation/categories/", {
        name: newCategoryName.trim(),
        description: `Category: ${newCategoryName.trim()}`,
      });

      // Refetch categories to update state
      const res = await apiClient.get("/operation/categories/");
      setCategories(res.data || []);

      // Set in formData
      setFormData((prev) => ({
        ...prev,
        projectCategory: newCategoryName.trim(),
      }));
      setNewCategoryName("");
      setShowCategoryModal(false);
      toast.success("Category added successfully");
    } catch (error) {
      console.error("Error adding category:", error);
      toast.error("Failed to add category");
    }
  };

  const handleRemoveCategory = (id) => {
    // Note: Removal not implemented via API; keep local if needed
    setCategories(categories.filter((category) => category.id !== id));
    toast.success("Category removed");
  };

  // Department Modal Functions
  const handleAddDepartment = () => {
    if (newDepartmentName.trim() === "") {
      toast.error("Please enter a department name");
      return;
    }

    const newDepartment = {
      id: departments.length + 1,
      name: newDepartmentName.trim(),
    };

    setDepartments([...departments, newDepartment]);
    setFormData((prev) => ({
      ...prev,
      department: newDepartmentName.trim(),
    }));
    setNewDepartmentName("");
    setShowDepartmentModal(false);
    toast.success("Department added successfully");
  };

  const handleRemoveDepartment = (id) => {
    setDepartments(departments.filter((dept) => dept.id !== id));
    toast.success("Department removed");
  };

  // Client Modal Functions
  const handleClientChange = (e) => {
    const { name, value } = e.target;
    setNewClientData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddClient = async () => {
    const { name, email, password } = newClientData;

    if (!name.trim() || !email.trim() || !password.trim()) {
      toast.error("Please fill all fields");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    try {
      // POST to backend
      await apiClient.post("/operation/clients/", {
        name,
        email,
        password,
      });

      // Refetch clients to update state
      const res = await apiClient.get("/operation/clients/");
      setClients(res.data || []);

      // Set in formData
      setFormData((prev) => ({
        ...prev,
        client: name.trim(),
      }));

      // Reset form
      setNewClientData({
        name: "",
        email: "",
        password: "",
      });

      setShowClientModal(false);
      toast.success("Client added successfully");
    } catch (error) {
      console.error("Error adding client:", error);
      toast.error("Failed to add client");
    }
  };

  const handleRemoveClient = (id) => {
    // Note: Removal not implemented via API; keep local if needed
    setClients(clients.filter((client) => client.id !== id));
    toast.success("Client removed");
  };

  // Project Members Modal Functions
  const handleMemberChange = (e) => {
    const { name, value } = e.target;
    setNewMemberData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name, value) => {
    setNewMemberData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Generate strong password function
  const generateStrongPassword = () => {
    const charset =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";
    let password = "";
    const array = new Uint32Array(16);
    crypto.getRandomValues(array);
    for (let i = 0; i < 16; i++) {
      password += charset[array[i] % charset.length];
    }
    return password;
  };

  const handleGenerateMemberPassword = () => {
    const newPass = generateStrongPassword();
    setCustomMemberPassword(newPass);
    navigator.clipboard.writeText(newPass);
    toast.success("Strong password generated & copied!");
  };

  const handleAddMember = () => {
    const {
      name,
      email,
      password,
      designation,
      department,
      joiningDate,
      gender,
      employeeId,
    } = newMemberData;

    if (!name.trim()) {
      toast.error("Please enter employee name");
      return;
    }

    if (!email.trim()) {
      toast.error("Please enter employee email");
      return;
    }

    if (!generateMemberPassword && !customMemberPassword.trim()) {
      toast.error("Please enter or generate password");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    // Generate employee ID if not provided
    const empId =
      employeeId.trim() || `EMP${String(users.length + 1).padStart(4, "0")}`;

    const newMember = {
      id: users.length + 1,
      employeeId: empId,
      name: name.trim(),
      email: email.trim(),
      designation: designation,
      department: department,
      joiningDate: joiningDate,
      gender: gender,
    };

    // Add to users list (project members)
    setUsers([...users, newMember]);

    // Also add to project members selection
    setFormData((prev) => ({
      ...prev,
      projectMembers: [...prev.projectMembers, newMember.id.toString()],
    }));

    // Reset form
    setNewMemberData({
      employeeId: "",
      name: "",
      email: "",
      password: "",
      designation: "",
      department: "",
      joiningDate: "",
      gender: "",
    });
    setCustomMemberPassword("");
    setGenerateMemberPassword(true);

    setShowMembersModal(false);
    toast.success("Employee added successfully");
  };

  const handleRemoveMember = (id) => {
    setUsers(users.filter((user) => user.id !== id));

    // Remove from project members if selected
    setFormData((prev) => ({
      ...prev,
      projectMembers: prev.projectMembers.filter(
        (memberId) => memberId !== id.toString()
      ),
    }));

    toast.success("Employee removed");
  };

  return (
    <div className="p-6">
      <LayoutComponents
        title="Add New Project"
        subtitle="Fill in the details to create a new project"
      >
        <div className="p-6 max-w-6xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-10">
            {/* ==================== PROJECT INFO ==================== */}
            <section className="rounded-xl p-8 border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-8">
                PROJECT INFO
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Project Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="projectName"
                    value={formData.projectName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black outline-none"
                    placeholder="Enter project name"
                  />
                </div>

                {/* Project Category */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    Project Category{" "}
                    <button
                      type="button"
                      onClick={() => setShowCategoryModal(true)}
                      className="text-green-500 hover:text-white hover:bg-green-500
                                 border border-green-500 rounded-full ml-2 p-1
                                 cursor-pointer transition-all duration-200"
                    >
                      <MdAdd className="w-4 h-4" />
                    </button>
                  </label>
                  <Input
                    type="select"
                    options={[
                      { value: "", label: "Select a category" },
                      ...categories.map((cat) => ({
                        value: cat.id,
                        label: cat.name,
                      })),
                    ]}
                    value={formData.projectCategory}
                    onChange={(newValue) =>
                      setFormData((prev) => ({
                        ...prev,
                        projectCategory: newValue,
                      }))
                    }
                    placeholder="Select a category"
                    disabled={loading}
                    className="border-gray-300 hover:border-gray-300 rounded-xl focus:ring-2 focus:border-black"
                  />
                </div>

                {/* Department */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    Department <span className="text-red-500">*</span>{" "}
                    <button
                      type="button"
                      onClick={() => setShowDepartmentModal(true)}
                      className="text-green-500 hover:text-white hover:bg-green-500
                                 border border-green-500 rounded-full ml-2 p-1
                                 cursor-pointer transition-all duration-200"
                    >
                      <MdAdd className="w-4 h-4" />
                    </button>
                  </label>
                  <Input
                    type="select"
                    options={[
                      { value: "", label: "Select department" },
                      ...departments.map((dept) => ({
                        value: dept.id, // ← Now send ID, not name
                        label: dept.name,
                      })),
                    ]}
                    value={formData.department}
                    onChange={(newValue) =>
                      setFormData((prev) => ({ ...prev, department: newValue }))
                    }
                    placeholder="Select department"
                    disabled={loading}
                    className="border-gray-300 hover:border-gray-300 rounded-xl focus:ring-2 focus:border-black"
                  />
                </div>
              </div>

              {/* Start Date & Deadline */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Deadline <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="date"
                      name="deadline"
                      value={formData.deadline}
                      onChange={handleChange}
                      disabled={formData.noDeadline}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black"
                    />
                    <label className="flex items-center text-sm text-gray-600 whitespace-nowrap">
                      <input
                        type="checkbox"
                        name="noDeadline"
                        checked={formData.noDeadline}
                        onChange={handleChange}
                        className="mr-2"
                      />
                      Add project without deadline?
                    </label>
                  </div>
                </div>
              </div>

              {/* Checkboxes Row */}
              <div className="flex flex-wrap items-center gap-10 mt-8">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="amc"
                    checked={formData.amc}
                    onChange={handleChange}
                    className="mr-3 w-4 h-4"
                  />
                  <span className="text-sm font-medium">AMC</span>
                </label>

                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="allowManualTimeLogs"
                    checked={formData.allowManualTimeLogs}
                    onChange={handleChange}
                    className="mr-3 w-4 h-4 accent-blue-600"
                  />
                  <span className="text-sm font-medium">
                    Allow manual time logs?
                  </span>
                </label>

                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="renewalOnly"
                    checked={formData.renewalOnly}
                    onChange={handleChange}
                    className="mr-3 w-4 h-4"
                  />
                  <span className="text-sm font-medium">
                    Renewal Only Project
                  </span>
                </label>

                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="dm"
                    checked={formData.dm}
                    onChange={handleChange}
                    className="mr-3 w-4 h-4"
                  />
                  <span className="text-sm font-medium">DM</span>
                </label>
              </div>

              {/* Conditional AMC Date Input */}
              {formData.amc && (
                <div className="mt-8">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    AMC Date
                  </label>
                  <input
                    type="date"
                    name="amcDate"
                    value={formData.amcDate}
                    onChange={handleChange}
                    placeholder="Choose AMC date"
                    className="w-full max-w-md px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black outline-none"
                  />
                </div>
              )}

              {/* Conditional Allocated Hours Input */}
              {formData.allowManualTimeLogs && (
                <div className="mt-8">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Allocated Hours
                  </label>
                  <input
                    type="number"
                    name="allocatedHours"
                    value={formData.allocatedHours}
                    onChange={handleChange}
                    placeholder="Enter allocated hours"
                    className="w-full max-w-md px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black outline-none"
                  />
                </div>
              )}

              {/* Project Members */}
              <div className="mt-8">
                <label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  Add Project Members <span className="text-red-500">*</span>{" "}
                  <button
                    type="button"
                    onClick={() => setShowMembersModal(true)}
                    className="text-green-500 hover:text-white hover:bg-green-500
                               border border-green-500 rounded-full ml-2 p-1
                               cursor-pointer transition-all duration-200"
                  >
                    <MdAdd className="w-4 h-4" />
                  </button>
                </label>
                {loading ? (
                  <div className="text-gray-500 py-3">Loading users...</div>
                ) : users.length === 0 ? (
                  <div className="text-amber-600 py-3">No users found</div>
                ) : (
                  <Input
                    type="select"
                    multiple
                    options={users.map((user) => ({
                      value: user.id.toString(),
                      label: user.name || user.email || `User ${user.id}`,
                    }))}
                    value={formData.projectMembers}
                    onChange={(newValue) =>
                      setFormData((prev) => ({
                        ...prev,
                        projectMembers: Array.isArray(newValue)
                          ? newValue
                          : [newValue],
                      }))
                    }
                    placeholder="Select project members"
                    className="border-gray-300 hover:border-gray-300 rounded-xl focus:ring-2 focus:border-black h-32"
                  />
                )}
              </div>

              {/* ==================== CLIENT INFO ==================== */}

              <h2 className="text-md font-semibold text-gray-900 mb-2 mt-5">
                CLIENT INFO
              </h2>
              <div className="max-w-lg">
                <label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  Select Client{" "}
                  <button
                    type="button"
                    onClick={() => setShowClientModal(true)}
                    className="text-green-500 hover:text-white hover:bg-green-500
                               border border-green-500 rounded-full ml-2 p-1
                               cursor-pointer transition-all duration-200"
                  >
                    <MdAdd className="w-4 h-4" />
                  </button>
                </label>
                <Input
                  type="select"
                  options={[
                    { value: "", label: "Select a client" },
                    ...clients.map((client) => ({
                      value: client.id,
                      label: `${client.name} (${client.email})`,
                    })),
                  ]}
                  value={formData.client}
                  onChange={(newValue) =>
                    setFormData((prev) => ({ ...prev, client: newValue }))
                  }
                  placeholder="Select a client"
                  disabled={loading}
                  className="border-gray-300 hover:border-gray-300 rounded-xl focus:ring-2 focus:border-black"
                />

                <label className="flex items-center mt-6">
                  <input
                    type="checkbox"
                    name="clientCanManageTasks"
                    checked={formData.clientCanManageTasks}
                    onChange={handleChange}
                    className="mr-3 w-4 h-4"
                  />
                  <span className="text-sm text-gray-600">
                    Client can manage tasks of this project
                  </span>
                </label>

                {/* Conditional Send Task Notification Checkbox */}
                {formData.clientCanManageTasks && (
                  <label className="flex items-center mt-4">
                    <input
                      type="checkbox"
                      name="sendTaskNotification"
                      checked={formData.sendTaskNotification}
                      onChange={handleChange}
                      className="mr-3 w-4 h-4"
                    />
                    <span className="text-sm text-gray-600">
                      Send task notification to client?
                    </span>
                  </label>
                )}
              </div>

              {/* ==================== BUDGET INFO ==================== */}

              <h2 className="text-md font-semibold text-gray-900 mb-6 mt-5">
                BUDGET INFO
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Budget
                  </label>
                  <input
                    type="number"
                    name="budget"
                    value={formData.budget}
                    onChange={handleChange}
                    placeholder="0.00"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency
                  </label>
                  <Input
                    type="select"
                    options={[
                      { value: "", label: "Select currency" },
                      ...currencies.map((curr) => ({
                        value: curr.id, // ← Send ID to backend
                        label: `${curr.name} (${curr.code})`,
                      })),
                    ]}
                    value={formData.currency}
                    onChange={(newValue) =>
                      setFormData((prev) => ({ ...prev, currency: newValue }))
                    }
                    placeholder="Select currency"
                    disabled={loading}
                    className="border-gray-300 hover:border-gray-300 rounded-xl focus:ring-2 focus:border-black"
                  />
                </div>
              </div>

              {/* ==================== STATUS & STAGE ==================== */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <section className=" mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2 ">
                    Project Status
                  </label>
                  <Input
                    type="select"
                    options={[
                      { value: "", label: "Select status" },
                      ...statuses.map((status) => ({
                        value: status.id,
                        label: status.name,
                      })),
                    ]}
                    value={formData.status}
                    onChange={(newValue) =>
                      setFormData((prev) => ({ ...prev, status: newValue }))
                    }
                    placeholder="Select status"
                    disabled={loading}
                    className="border-gray-300 hover:border-gray-300 rounded-xl focus:ring-2 focus:border-black"
                  />
                </section>

                <section className=" mt-4 ">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Stage
                  </label>
                  <Input
                    type="select"
                    options={[
                      { value: "", label: "Select stage" },
                      ...stages.map((stage) => ({
                        value: stage.id,
                        label: stage.name,
                      })),
                    ]}
                    value={formData.stage}
                    onChange={(newValue) =>
                      setFormData((prev) => ({ ...prev, stage: newValue }))
                    }
                    placeholder="Select stage"
                    disabled={loading}
                    className="border-gray-300 hover:border-gray-300 rounded-xl focus:ring-2 focus:border-black"
                  />
                </section>
              </div>

              {/* ==================== FILE UPLOAD ==================== */}
              <section className="rounded-xl p-12 border-2 border-dashed border-gray-300 mt-4 text-center">
                <input
                  type="file"
                  multiple
                  className="hidden"
                  id="fileUpload"
                  onChange={(e) => setFiles(Array.from(e.target.files))}
                />

                <label htmlFor="fileUpload" className="cursor-pointer block">
                  <p className="text-gray-600 text-lg">
                    Click or drop files here to upload
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Supports all file types
                  </p>
                </label>

                {files.length > 0 && (
                  <ul className="mt-4 text-sm text-left">
                    {files.map((file, index) => (
                      <li key={index}>📎 {file.name}</li>
                    ))}
                  </ul>
                )}
              </section>

              {/* ==================== PROJECT SUMMARY ==================== */}

              <h2 className="text-md font-semibold text-gray-900 mb-6 mt-5">
                Project Summary
              </h2>
              <div className="border border-gray-300 rounded-xl overflow-hidden">
                <div className="p-3 flex gap-2 flex-wrap">
                  <button
                    type="button"
                    className="px-3 py-1 hover:bg-gray-200 rounded"
                  >
                    B
                  </button>
                  <button
                    type="button"
                    className="px-3 py-1 hover:bg-gray-200 rounded italic"
                  >
                    I
                  </button>
                  <button
                    type="button"
                    className="px-3 py-1 hover:bg-gray-200 rounded underline"
                  >
                    U
                  </button>
                </div>

                <textarea
                  name="summary"
                  value={formData.summary}
                  onChange={handleChange}
                  rows="8"
                  className="w-full px-4 py-4 outline-none resize-none"
                  placeholder="Write project summary..."
                />
              </div>

              <section className=" rounded-xl p-8 border border-gray-200 mt-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 ">
                  Note
                </h2>
                <div className="border border-gray-300 rounded-xl overflow-hidden">
                  <div className="bg-gray-100 p-3 flex gap-2 flex-wrap">
                    <button
                      type="button"
                      className="px-3 py-1 hover:bg-gray-200 rounded"
                    >
                      B
                    </button>
                    <button
                      type="button"
                      className="px-3 py-1 hover:bg-gray-200 rounded italic"
                    >
                      I
                    </button>
                    <button
                      type="button"
                      className="px-3 py-1 hover:bg-gray-200 rounded underline"
                    >
                      U
                    </button>
                  </div>
                  <textarea
                    name="note"
                    value={formData.note}
                    onChange={handleChange}
                    rows="6"
                    className="w-full px-4 py-4 outline-none resize-none"
                    placeholder="Add any internal note..."
                  />
                </div>
              </section>
            </section>

            {/* ==================== SAVE / RESET ==================== */}
            <div className="flex justify-start gap-6 pt-8">
              <button
                type="submit"
                className="flex items-center gap-3 px-8 py-4 bg-black text-white rounded-xl transition font-semibold text-base"
              >
                <MdAdd className="w-5 h-5" /> Save
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="px-8 py-4 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition font-medium"
              >
                Reset
              </button>
            </div>
          </form>
        </div>
      </LayoutComponents>

      {/* ==================== CATEGORY MODAL ==================== */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                Project Category
              </h2>
              <button
                onClick={() => {
                  setShowCategoryModal(false);
                  setNewCategoryName("");
                }}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <MdClose className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-3 mb-6">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex justify-between items-center p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-gray-700">{category.id}</span>
                      <span className="font-medium">{category.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveCategory(category.id)}
                      className="text-red-500 hover:text-red-700 text-sm font-medium px-3 py-1 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Add Category Name *
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Enter category name"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:outline-none"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddCategory();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    className="px-6 py-3 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== DEPARTMENT MODAL ==================== */}
      {showDepartmentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                Department
              </h2>
              <button
                onClick={() => {
                  setShowDepartmentModal(false);
                  setNewDepartmentName("");
                }}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <MdClose className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-3 mb-6">
                {departments.map((department) => (
                  <div
                    key={department.id}
                    className="flex justify-between items-center p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-gray-700">{department.id}</span>
                      <span className="font-medium">{department.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveDepartment(department.id)}
                      className="text-red-500 hover:text-red-700 text-sm font-medium px-3 py-1 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Add Department Name *
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newDepartmentName}
                    onChange={(e) => setNewDepartmentName(e.target.value)}
                    placeholder="Enter department name"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:outline-none"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddDepartment();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddDepartment}
                    className="px-6 py-3 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== CLIENT MODAL ==================== */}
      {showClientModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                Add Client
              </h2>
              <button
                onClick={() => {
                  setShowClientModal(false);
                  setNewClientData({
                    name: "",
                    email: "",
                    password: "",
                  });
                }}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <MdClose className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="mt-8 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Client Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={newClientData.name}
                    onChange={handleClientChange}
                    placeholder="Enter client name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Client Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={newClientData.email}
                    onChange={handleClientChange}
                    placeholder="Enter client email"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={newClientData.password}
                      onChange={handleClientChange}
                      placeholder="Enter password"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:outline-none pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? (
                        <MdVisibilityOff className="w-5 h-5" />
                      ) : (
                        <MdVisibility className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={handleAddClient}
                    className="px-6 py-3 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors flex-1"
                  >
                    Save Client
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== PROJECT MEMBERS MODAL ==================== */}
      {showMembersModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
              <h2 className="text-xl font-semibold text-gray-900">
                Add Project Member (Employee)
              </h2>
              <button
                onClick={() => {
                  setShowMembersModal(false);
                  setNewMemberData({
                    employeeId: "",
                    name: "",
                    email: "",
                    password: "",
                    designation: "",
                    department: "",
                    joiningDate: "",
                    gender: "",
                  });
                  setCustomMemberPassword("");
                  setGenerateMemberPassword(true);
                }}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <MdClose className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              {/* Form Section */}
              <div className="space-y-6">
                <h3 className="text-md font-medium text-gray-700 mb-2">
                  Add New Employee
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Employee ID */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Employee ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="employeeId"
                      value={newMemberData.employeeId}
                      onChange={handleMemberChange}
                      placeholder="EMP0001"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:outline-none bg-gray-50 text-sm"
                      readOnly
                    />
                    <p className="text-xs text-gray-500 mt-1">Auto-generated</p>
                  </div>

                  {/* Employee Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Employee Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={newMemberData.name}
                      onChange={handleMemberChange}
                      placeholder="Enter employee name"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:outline-none text-sm"
                    />
                  </div>

                  {/* Email */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={newMemberData.email}
                      onChange={handleMemberChange}
                      placeholder="employee@company.com"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:outline-none text-sm"
                    />
                  </div>

                  {/* Designation Dropdown */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Designation
                    </label>
                    <Input
                      type="select"
                      options={[
                        { value: "", label: "Select Designation" },
                        ...designations,
                      ]}
                      value={newMemberData.designation}
                      onChange={(value) =>
                        handleSelectChange("designation", value)
                      }
                      placeholder="Select designation"
                      className="border-gray-300 hover:border-gray-300 rounded-lg focus:ring-2 focus:border-black text-sm py-2"
                    />
                  </div>

                  {/* Department Dropdown */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Department
                    </label>
                    <Input
                      type="select"
                      options={[
                        { value: "", label: "Select Department" },
                        ...departments.map((dept) => ({
                          value: dept.name,
                          label: dept.name,
                        })),
                      ]}
                      value={newMemberData.department}
                      onChange={(value) =>
                        handleSelectChange("department", value)
                      }
                      placeholder="Select department"
                      className="border-gray-300 hover:border-gray-300 rounded-lg focus:ring-2 focus:border-black text-sm py-2"
                    />
                  </div>

                  {/* Joining Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Joining Date
                    </label>
                    <input
                      type="date"
                      name="joiningDate"
                      value={newMemberData.joiningDate}
                      onChange={handleMemberChange}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:outline-none text-sm"
                    />
                  </div>

                  {/* Gender Dropdown */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gender
                    </label>
                    <Input
                      type="select"
                      options={genderOptions}
                      value={newMemberData.gender}
                      onChange={(value) => handleSelectChange("gender", value)}
                      placeholder="Select gender"
                      className="border-gray-300 hover:border-gray-300 rounded-lg focus:ring-2 focus:border-black text-sm py-2"
                    />
                  </div>
                </div>

                {/* Password Section */}
                <div className="pt-4 border-t">
                  <div className="flex items-center gap-3 mb-4">
                    <input
                      type="checkbox"
                      checked={generateMemberPassword}
                      onChange={(e) => {
                        setGenerateMemberPassword(e.target.checked);
                        if (e.target.checked) setCustomMemberPassword("");
                      }}
                      className="w-4 h-4 rounded border-gray-400 text-black"
                    />
                    <label className="font-medium text-gray-800 text-sm">
                      Generate Random Password & Send via Email (Recommended)
                    </label>
                  </div>

                  {!generateMemberPassword && (
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1">
                          <div className="relative">
                            <input
                              type={showMemberPassword ? "text" : "password"}
                              value={customMemberPassword}
                              onChange={(e) =>
                                setCustomMemberPassword(e.target.value)
                              }
                              placeholder="Enter strong password"
                              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:outline-none text-sm pr-10"
                              required
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setShowMemberPassword(!showMemberPassword)
                              }
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            >
                              {showMemberPassword ? (
                                <MdVisibilityOff className="w-4 h-4" />
                              ) : (
                                <MdVisibility className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">
                            Password will be emailed to the employee
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleGenerateMemberPassword}
                          className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition text-sm font-medium flex items-center justify-center gap-2 shadow-sm whitespace-nowrap"
                        >
                          <MdAutoAwesome className="w-4 h-4" />
                          Generate
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Save Button */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowMembersModal(false);
                      setNewMemberData({
                        employeeId: "",
                        name: "",
                        email: "",
                        password: "",
                        designation: "",
                        department: "",
                        joiningDate: "",
                        gender: "",
                      });
                      setCustomMemberPassword("");
                      setGenerateMemberPassword(true);
                    }}
                    className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium text-sm flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddMember}
                    disabled={
                      !generateMemberPassword && !customMemberPassword.trim()
                    }
                    className="px-4 py-2.5 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition text-sm flex-1 disabled:opacity-50"
                  >
                    Save Employee
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateProjectPage;
