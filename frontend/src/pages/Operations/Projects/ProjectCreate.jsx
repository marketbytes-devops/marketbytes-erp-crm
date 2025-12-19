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

    // CORRECTED FIELD MAPPINGS:
    formDataToSend.append('name', formData.projectName); 
    
    // Department
    formDataToSend.append('department_id', formData.department || '');
    
    formDataToSend.append('start_date', formData.startDate);
    
    if (!formData.noDeadline && formData.deadline) {
      formDataToSend.append('deadline', formData.deadline);
    }
    formDataToSend.append('no_deadline', formData.noDeadline);

    // Category
    if (formData.projectCategory)
      formDataToSend.append('category_id', formData.projectCategory);

    // Status
    if (formData.status)
      formDataToSend.append('status_id', formData.status);

    // Stage
    if (formData.stage)
      formDataToSend.append('stage_id', formData.stage);

    // Client
    if (formData.client)
      formDataToSend.append('client_id', formData.client);

    // Currency
    if (formData.currency)
      formDataToSend.append('currency_id', formData.currency);

    // Booleans - FIXED NAMES
    formDataToSend.append('amc', formData.amc);
    if (formData.amc && formData.amcDate) 
      formDataToSend.append('amc_date', formData.amcDate);
    
    formDataToSend.append('renewal_only', formData.renewalOnly);
    formDataToSend.append('dm', formData.dm);
    formDataToSend.append('allow_manual_timelogs', formData.allowManualTimeLogs);
    
    // hours_allocated 
    if (formData.allowManualTimeLogs && formData.allocatedHours) {
      formDataToSend.append('hours_allocated', formData.allocatedHours);
    }

    formDataToSend.append('client_can_manage_tasks', formData.clientCanManageTasks);
    formDataToSend.append('send_task_notifications_to_client', formData.sendTaskNotification);

    if (formData.budget) 
      formDataToSend.append('budget', formData.budget);
    if (formData.summary) 
      formDataToSend.append('summary', formData.summary);
    if (formData.note) 
      formDataToSend.append('notes', formData.note); 

    // Members'
    formData.projectMembers.forEach(id => {
      formDataToSend.append('members_ids', id);
    });

    // Files
    files.forEach(file => {
      formDataToSend.append('files', file);
    });

    // DEBUG: Log what we're sending
    console.log("Sending form data:");
    for (let [key, value] of formDataToSend.entries()) {
      console.log(key, value);
    }

    // Check if apiClient is properly configured
    const response = await apiClient.post("/operation/projects/", formDataToSend, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });

    toast.success("Project created successfully!");
    handleReset();
    console.log("Created Project:", response.data);
    
  } catch (error) {
    console.error("Error creating project:", error);
    console.error("Error response:", error.response?.data);
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

  // Category Modal Functions
  const handleAddCategory = async () => {
  if (newCategoryName.trim() === "") {
    toast.error("Please enter a category name");
    return;
  }

  try {
    // POST to backend and capture response (with ID)
    const postRes = await apiClient.post("/operation/categories/", {
      name: newCategoryName.trim(),
      description: `Category: ${newCategoryName.trim()}`,
    });
    const newCategoryId = postRes.data.id; // Assume backend returns {id, name, ...}

    // Refetch to update modal list and state
    const res = await apiClient.get("/operation/categories/");
    setCategories(Array.isArray(res.data) ? res.data : res.data?.results || []);

    // Set in formData using ID (not name)
    setFormData((prev) => ({
      ...prev,
      projectCategory: newCategoryId.toString(), // String for select value
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
  const handleAddDepartment = async () => { // Make async for POST
  if (newDepartmentName.trim() === "") {
    toast.error("Please enter a department name");
    return;
  }

  try {
    // POST to backend (assume /auth/departments/ supports POST {name: "..."})
    const postRes = await apiClient.post("/auth/departments/", {
      name: newDepartmentName.trim(),
    });
    const newDepartmentId = postRes.data.id; // Assume backend returns {id, name, ...}

    // Refetch to update modal list and state
    const res = await apiClient.get("/auth/departments/");
    setDepartments(Array.isArray(res.data) ? res.data : res.data?.results || []);

    // Set in formData using ID (not name)
    setFormData((prev) => ({
      ...prev,
      department: newDepartmentId.toString(), // String for select value
    }));
    setNewDepartmentName("");
    setShowDepartmentModal(false);
    toast.success("Department added successfully");
  } catch (error) {
    console.error("Error adding department:", error);
    toast.error("Failed to add department");
  }
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
    // POST to backend and capture response (with ID)
    const postRes = await apiClient.post("/operation/clients/", {
      name,
      email,
      password,
    });
    const newClientId = postRes.data.id; // Assume backend returns {id, name, email, ...}

    // Refetch clients to update state/modal list
    const res = await apiClient.get("/operation/clients/");
    setClients(Array.isArray(res.data) ? res.data : res.data?.results || []);

    // Set in formData using ID (not name)
    setFormData((prev) => ({
      ...prev,
      client: newClientId.toString(), // String for select value
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
                    Allow manual time for project
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
                <label className="text-sm font-medium text-gray-700 mb-2">
                  Add Project Members
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
      {/* ==================== CLIENT MODAL ==================== */}
{showClientModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
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
        {/* Existing Clients List (new: fetch/display like categories) */}
        <div className="space-y-3 mb-6">
          {clients.map((client) => (
            <div
              key={client.id}
              className="flex justify-between items-center p-4 border border-gray-200 rounded-lg"
            >
              <div className="flex items-center gap-4">
                <span className="text-gray-700">{client.id}</span>
                <span className="font-medium">{client.name}</span>
                <span className="text-gray-500 text-sm">({client.email})</span>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveClient(client.id)}
                className="text-red-500 hover:text-red-700 text-sm font-medium px-3 py-1 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        {/* Add New Form (existing, unchanged) */}
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
    </div>
  );
};

export default CreateProjectPage;