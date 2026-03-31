import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        projectName: "",
        projectCategory: "",
        involvedDepartments: [],
        startDate: "",
        deadline: "",
        noDeadline: false,
        amc: false,
        amcDate: "",
        allowManualTimeLogs: true,
        allocatedHours: "",
        tenor: "one_time",
        renewalOnly: false,
        dm: false,
        projectMembers: [],
        client: "",
        clientCanManageTasks: true,
        sendTaskNotification: false,
        budget: "",
        currency: "",
        hoursAllocated: "",
        status: "",
        stage: "",
        summary: "",
        note: "",
    });

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [files, setFiles] = useState([]);

    const [categories, setCategories] = useState([]);
    const [statuses, setStatuses] = useState([]);
    const [stages, setStages] = useState([]);
    const [clients, setClients] = useState([]);
    const [currencies, setCurrencies] = useState([]);

    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");

    const [showDepartmentModal, setShowDepartmentModal] = useState(false);
    const [newDepartmentName, setNewDepartmentName] = useState("");
    const [departments, setDepartments] = useState([]);

    const [showClientModal, setShowClientModal] = useState(false);
    const [newClientData, setNewClientData] = useState({
        name: "",
        email: "",
        password: "",
    });
    const [showPassword, setShowPassword] = useState(false);

    const [showStageModal, setShowStageModal] = useState(false);
    const [newStageName, setNewStageName] = useState("");

    const [showCurrencyModal, setShowCurrencyModal] = useState(false);
    const [newCurrencyValue, setNewCurrencyValue] = useState("");

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.projectName || !formData.involvedDepartments || !formData.startDate || (!formData.deadline && !formData.noDeadline)) {
            toast.error("Please fill required fields");
            return;
        }

        try {
            const formDataToSend = new FormData();

            formDataToSend.append('name', formData.projectName);
            formData.involvedDepartments.forEach(id => formDataToSend.append('involved_departments_ids', id));
            formDataToSend.append('start_date', formData.startDate);

            if (!formData.noDeadline && formData.deadline) {
                formDataToSend.append('deadline', formData.deadline);
            }
            formDataToSend.append('no_deadline', formData.noDeadline);

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

            formDataToSend.append('amc', formData.amc);
            if (formData.amc && formData.amcDate)
                formDataToSend.append('amc_date', formData.amcDate);

            formDataToSend.append('renewal_only', formData.renewalOnly);
            formDataToSend.append('dm', formData.dm);
            formDataToSend.append('allow_manual_timelogs', formData.allowManualTimeLogs);

            if (formData.allowManualTimeLogs && formData.allocatedHours) {
                formDataToSend.append('hours_allocated', formData.allocatedHours);
                formDataToSend.append('tenor', formData.tenor);
            }

            formDataToSend.append('client_can_manage_tasks', formData.clientCanManageTasks);
            formDataToSend.append('send_task_notifications_to_client', formData.sendTaskNotification);

            if (formData.budget)
                formDataToSend.append('budget', formData.budget);
            if (formData.summary)
                formDataToSend.append('summary', formData.summary);
            if (formData.note)
                formDataToSend.append('notes', formData.note);

            formData.projectMembers.forEach(id => {
                formDataToSend.append('members_ids', id);
            });

            files.forEach(file => {
                formDataToSend.append('files', file);
            });

            const response = await apiClient.post("/operation/projects/", formDataToSend);

            toast.success("Project created successfully!");
            handleReset();
            navigate("/operations/projects");
        } catch (error) {
            toast.error("Failed to create project");
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

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await apiClient.get("/auth/users/");
                const userData = Array.isArray(response.data)
                    ? response.data
                    : response.data.results || [];
                setUsers(userData);
            } catch (error) {
                toast.error("Failed to load users");
            }
        };
        fetchUsers();
    }, []);

    useEffect(() => {
        const fetchDynamicData = async () => {
            try {
                setLoading(true);

                const catRes = await apiClient.get("/operation/categories/");
                setCategories(Array.isArray(catRes.data) ? catRes.data : catRes.data?.results || []);

                const clientRes = await apiClient.get("/operation/clients/");
                setClients(Array.isArray(clientRes.data) ? clientRes.data : clientRes.data?.results || []);

                const statusRes = await apiClient.get("/operation/statuses/");
                const statusList = Array.isArray(statusRes.data) ? statusRes.data : statusRes.data?.results || [];
                setStatuses(statusList);
                
                // Set default status to "To be Started" if not set
                if (statusList.length > 0) {
                    const defaultStatus = statusList.find(s => s.name === "To be Started");
                    if (defaultStatus) {
                        setFormData(prev => ({ ...prev, status: defaultStatus.id.toString() }));
                    }
                }

                const stageRes = await apiClient.get("/operation/stages/");
                setStages(Array.isArray(stageRes.data) ? stageRes.data : stageRes.data?.results || []);

                const currencyRes = await apiClient.get("/operation/currencies/");
                setCurrencies(Array.isArray(currencyRes.data) ? currencyRes.data : currencyRes.data?.results || []);

                const deptRes = await apiClient.get("/auth/departments/");
                setDepartments(Array.isArray(deptRes.data) ? deptRes.data : deptRes.data?.results || []);
            } catch (error) {
                toast.error("Failed to load dropdown options");
            } finally {
                setLoading(false);
            }
        };
        fetchDynamicData();
    }, []);

    const handleAddCategory = async () => {
        if (newCategoryName.trim() === "") {
            toast.error("Please enter a category name");
            return;
        }
        try {
            const postRes = await apiClient.post("/operation/categories/", {
                name: newCategoryName.trim(),
                description: `Category: ${newCategoryName.trim()}`,
            });
            const res = await apiClient.get("/operation/categories/");
            setCategories(Array.isArray(res.data) ? res.data : res.data?.results || []);
            setFormData((prev) => ({
                ...prev,
                projectCategory: postRes.data.id.toString(),
            }));
            setNewCategoryName("");
            setShowCategoryModal(false);
            toast.success("Category added successfully");
        } catch (error) {
            toast.error("Failed to add category");
        }
    };

    const handleRemoveCategory = (id) => {
        setCategories(categories.filter((category) => category.id !== id));
    };

    const handleAddDepartment = async () => {
        if (newDepartmentName.trim() === "") {
            toast.error("Please enter a department name");
            return;
        }
        try {
            const postRes = await apiClient.post("/auth/departments/", {
                name: newDepartmentName.trim(),
            });
            const res = await apiClient.get("/auth/departments/");
            setDepartments(Array.isArray(res.data) ? res.data : res.data?.results || []);
            setFormData((prev) => ({
                ...prev,
                department: postRes.data.id.toString(),
            }));
            setNewDepartmentName("");
            setShowDepartmentModal(false);
            toast.success("Department added successfully");
        } catch (error) {
            toast.error("Failed to add department");
        }
    };

    const handleRemoveDepartment = (id) => {
        setDepartments(departments.filter((dept) => dept.id !== id));
    };

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
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            toast.error("Please enter a valid email address");
            return;
        }
        try {
            const postRes = await apiClient.post("/operation/clients/", {
                name,
                email,
                password,
            });
            const res = await apiClient.get("/operation/clients/");
            setClients(Array.isArray(res.data) ? res.data : res.data?.results || []);
            setFormData((prev) => ({
                ...prev,
                client: postRes.data.id.toString(),
            }));
            setNewClientData({ name: "", email: "", password: "" });
            setShowClientModal(false);
            toast.success("Client added successfully");
        } catch (error) {
            toast.error("Failed to add client");
        }
    };

    const handleRemoveClient = (id) => {
        setClients(clients.filter((client) => client.id !== id));
    };


    const handleAddStage = async () => {
        if (!newStageName.trim()) return;
        try {
            const res = await apiClient.post("/operation/stages/", { name: newStageName });
            setStages([...stages, res.data]);
            setFormData(prev => ({ ...prev, stage: res.data.id.toString() }));
            setNewStageName("");
            setShowStageModal(false);
            toast.success("Stage added");
        } catch (err) {
            toast.error("Failed to add stage");
        }
    };

    const handleAddCurrency = async () => {
        if (!newCurrencyValue.trim()) {
            toast.error("Currency is required");
            return;
        }
        try {
            const val = newCurrencyValue.trim();
            const code = val.length <= 3 ? val.toUpperCase() : val.substring(0, 3).toUpperCase();
            
            const postRes = await apiClient.post("/operation/currencies/", {
                code: code,
                name: val,
                symbol: "",
                is_active: true
            });
            const res = await apiClient.get("/operation/currencies/");
            setCurrencies(Array.isArray(res.data) ? res.data : res.data?.results || []);
            setFormData((prev) => ({
                ...prev,
                currency: postRes.data.id.toString(),
            }));
            setNewCurrencyValue("");
            setShowCurrencyModal(false);
            toast.success("Currency added successfully");
        } catch (error) {
            toast.error(error.response?.data?.code?.[0] || error.response?.data?.non_field_errors?.[0] || "Failed to add currency");
        }
    };

    const handleRemoveCurrency = async (id) => {
        try {
            await apiClient.delete(`/operation/currencies/${id}/`);
            setCurrencies(currencies.filter((c) => c.id !== id));
            if (formData.currency === id.toString()) {
                setFormData(prev => ({ ...prev, currency: "" }));
            }
            toast.success("Currency removed");
        } catch (error) {
            toast.error("Failed to remove currency");
        }
    };

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
            <LayoutComponents title="Add New Project" subtitle="Fill in the details to create a new project" variant="card">
                <div className="mb-8">
                    <button
                        onClick={() => window.history.back()}
                        className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 hover:bg-gray-50 transition px-4 py-3 text-sm rounded-xl font-medium"
                    >
                        <MdArrowBack className="w-5 h-5" />
                        Back
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="font-medium text-gray-900 mb-6">Project Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <Input
                                label="Project Name"
                                required
                                placeholder="Enter project name"
                                value={formData.projectName}
                                onChange={(e) => setFormData(prev => ({ ...prev, projectName: e.target.value }))}
                            />
                            <div className="relative top-0 sm:-top-1.5">
                                <div className="flex items-center gap-2 mb-2">
                                    <label className="text-sm font-medium text-black">Project Category</label>
                                    <button
                                        type="button"
                                        onClick={() => setShowCategoryModal(true)}
                                        className="p-1 rounded-full border border-green-600 text-green-600 hover:bg-green-600 hover:text-white transition"
                                    >
                                        <MdAdd className="w-4 h-4" />
                                    </button>
                                </div>
                                <Input
                                    type="select"
                                    options={[{ value: "", label: "Select category" }, ...categories.map(c => ({ value: c.id, label: c.name }))]}
                                    value={formData.projectCategory}
                                    onChange={v => setFormData(prev => ({ ...prev, projectCategory: v }))}
                                />
                            </div>
                            <div className="relative top-0 sm:-top-1.5">
                                <div className="flex items-center gap-2 mb-2">
                                    <label className="text-sm font-medium text-black">Involved Departments <span className="text-red-500">*</span></label>
                                    <button
                                        type="button"
                                        onClick={() => setShowDepartmentModal(true)}
                                        className="p-1 rounded-full border border-green-600 text-green-600 hover:bg-green-600 hover:text-white transition"
                                    >
                                        <MdAdd className="w-4 h-4" />
                                    </button>
                                </div>
                                <Input
                                    type="select"
                                    multiple
                                    required
                                    options={departments.map(d => ({ value: d.id.toString(), label: d.name }))}
                                    value={formData.involvedDepartments}
                                    onChange={v => {
                                        setFormData(prev => ({
                                            ...prev,
                                            involvedDepartments: Array.isArray(v) ? v : [v],
                                            projectMembers: [] // Reset members when department changes
                                        }));
                                    }}
                                />
                            </div>
                            <Input label="Start Date" required type="date" value={formData.startDate} onChange={e => setFormData(prev => ({ ...prev, startDate: e.target.value }))} />
                            {!formData.noDeadline && (
                                <div>
                                    <label className="text-sm font-medium text-black mb-2 block">
                                        Deadline <span className="text-red-500">*</span>
                                    </label>
                                    <div className="items-center gap-4">
                                        <input
                                            type="date"
                                            value={formData.deadline}
                                            onChange={e => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                                            className="w-full flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none"
                                        />
                                    </div>
                                </div>
                            )}
                            <div className="relative top-0 md:top-7">
                                <label className="flex items-center justify-center gap-2 text-sm border border-gray-300 rounded-lg px-4 py-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.noDeadline}
                                        onChange={e =>
                                            setFormData(prev => ({
                                                ...prev,
                                                noDeadline: e.target.checked,
                                                deadline: "",
                                            }))
                                        }
                                    />
                                    No deadline
                                </label>
                            </div>
                        </div>

                        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <Input
                                label="Allocated Hours"
                                type="number"
                                placeholder="0"
                                value={formData.allocatedHours}
                                onChange={e => setFormData(prev => ({ ...prev, allocatedHours: e.target.value }))}
                            />
                            <Input
                                label="Tenor"
                                type="select"
                                options={[
                                    { value: "one_time", label: "One Time" },
                                    { value: "monthly", label: "Monthly" },
                                ]}
                                value={formData.tenor}
                                onChange={v => setFormData(prev => ({ ...prev, tenor: v }))}
                            />
                        </div>

                        <div className="mt-6 flex flex-wrap gap-8 items-center bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input type="checkbox" checked={formData.amc} onChange={e => setFormData(prev => ({ ...prev, amc: e.target.checked }))} className="w-5 h-5 rounded" />
                                <span className="font-medium text-sm">AMC</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input type="checkbox" checked={formData.allowManualTimeLogs} onChange={e => setFormData(prev => ({ ...prev, allowManualTimeLogs: e.target.checked }))} className="w-5 h-5 rounded" />
                                <span className="font-medium text-sm">Memo/Note</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input type="checkbox" checked={formData.renewalOnly} onChange={e => setFormData(prev => ({ ...prev, renewalOnly: e.target.checked }))} className="w-5 h-5 rounded" />
                                <span className="font-medium text-sm">Renewal only</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input type="checkbox" checked={formData.dm} onChange={e => setFormData(prev => ({ ...prev, dm: e.target.checked }))} className="w-5 h-5 rounded" />
                                <span className="font-medium text-sm">DM</span>
                            </label>
                        </div>

                        {formData.amc && (
                            <div className="mt-6">
                                <Input label="AMC Date" type="date" value={formData.amcDate} onChange={e => setFormData(prev => ({ ...prev, amcDate: e.target.value }))} />
                            </div>
                        )}

                        <div className="mt-6">
                            <label className="text-sm font-medium text-black mb-2 block">Project Members</label>
                            <Input
                                type="select"
                                multiple
                                disabled={formData.involvedDepartments.length === 0}
                                options={users
                                    .filter(u => formData.involvedDepartments.some(deptId => u.department?.id?.toString() === deptId.toString()))
                                    .map(u => ({ value: u.id.toString(), label: u.name || u.email }))
                                }
                                value={formData.projectMembers}
                                onChange={v => setFormData(prev => ({ ...prev, projectMembers: v }))}
                                placeholder={formData.involvedDepartments.length > 0 ? "Select members" : "Please select Involved Departments first to choose members"}
                            />
                            {formData.involvedDepartments.length === 0 && (
                                <p className="text-xs text-amber-600 mt-2 font-medium">Select Involved Departments above to display available members.</p>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="font-medium text-gray-900 mb-6">Client Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <label className="text-sm font-medium text-black">Client</label>
                                    <button
                                        type="button"
                                        onClick={() => setShowClientModal(true)}
                                        className="p-1 rounded-full border border-green-600 text-green-600 hover:bg-green-600 hover:text-white transition"
                                    >
                                        <MdAdd className="w-4 h-4" />
                                    </button>
                                </div>
                                <Input
                                    type="select"
                                    options={[{ value: "", label: "Select client" }, ...clients.map(c => ({ value: c.id, label: `${c.name} (${c.email})` }))]}
                                    value={formData.client}
                                    onChange={v => setFormData(prev => ({ ...prev, client: v }))}
                                />
                            </div>
                            <div className="space-y-4 relative top-0 sm:top-5">
                                <label className="flex items-center gap-3">
                                    <input type="checkbox" checked={formData.clientCanManageTasks} onChange={e => setFormData(prev => ({ ...prev, clientCanManageTasks: e.target.checked }))} className="w-5 h-5 rounded" />
                                    <span className="font-medium">Client can manage tasks</span>
                                </label>
                                {formData.clientCanManageTasks && (
                                    <label className="flex items-center gap-3">
                                        <input type="checkbox" checked={formData.sendTaskNotification} onChange={e => setFormData(prev => ({ ...prev, sendTaskNotification: e.target.checked }))} className="w-5 h-5 rounded" />
                                        <span className="font-medium">Send task notifications to client</span>
                                    </label>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="font-medium text-gray-900 mb-6">Budget & Status</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <Input label="Budget" type="number" placeholder="0.00" value={formData.budget} onChange={e => setFormData(prev => ({ ...prev, budget: e.target.value }))} />
                            <div className="relative top-0 sm:-top-1.5">
                                <div className="flex items-center gap-2 mb-2">
                                    <label className="text-sm font-medium text-black">Currency</label>
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrencyModal(true)}
                                        className="p-1 rounded-full border border-green-600 text-green-600 hover:bg-green-600 hover:text-white transition"
                                    >
                                        <MdAdd className="w-4 h-4" />
                                    </button>
                                </div>
                                <Input
                                    type="select"
                                    options={[{ value: "", label: "Select currency" }, ...currencies.map(c => ({ value: c.id, label: c.name }))]}
                                    value={formData.currency}
                                    onChange={v => setFormData(prev => ({ ...prev, currency: v }))}
                                />
                            </div>
                             <div className="relative top-0 sm:-top-1.5">
                                <label className="text-sm font-medium text-black mb-2 block">Status</label>
                                <Input
                                    type="select"
                                    options={[{ value: "", label: "Select status" }, ...statuses.map(s => ({ value: s.id.toString(), label: s.name }))]}
                                    value={formData.status}
                                    onChange={v => setFormData(prev => ({ ...prev, status: v }))}
                                />
                            </div>
                            <div className="relative top-0 sm:-top-1.5">
                                <div className="flex items-center gap-2 mb-2">
                                    <label className="text-sm font-medium text-black">Stage</label>
                                    <button type="button" onClick={() => setShowStageModal(true)} className="p-1 rounded-full border border-green-600 text-green-600 hover:bg-green-600 hover:text-white transition">
                                        <MdAdd className="w-4 h-4" />
                                    </button>
                                </div>
                                <Input
                                    type="select"
                                    options={[{ value: "", label: "Select stage" }, ...stages.map(s => ({ value: s.id, label: s.name }))]}
                                    value={formData.stage}
                                    onChange={v => setFormData(prev => ({ ...prev, stage: v }))}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="font-medium text-gray-900 mb-6">Attachments</h3>
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
                            <input
                                type="file"
                                id="files"
                                multiple
                                className="hidden"
                                onChange={(e) => setFiles(Array.from(e.target.files || []))}
                            />
                            <label htmlFor="files" className="cursor-pointer">
                                <p className="text-gray-600">Drop files here or click to upload</p>
                                <p className="text-sm text-gray-500 mt-2">Any file type supported</p>
                            </label>
                            {files.length > 0 && (
                                <div className="mt-6 space-y-2 text-left">
                                    {files.map((f, i) => (
                                        <div key={i} className="flex items-center gap-2 text-sm">
                                            <span>{f.name}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="font-medium text-gray-900 mb-6">Project Summary</h3>
                        <textarea
                            rows={6}
                            placeholder="Enter project summary..."
                            value={formData.summary}
                            onChange={e => setFormData(prev => ({ ...prev, summary: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none resize-none"
                        />
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="font-medium text-gray-900 mb-6">Internal Note</h3>
                        <textarea
                            rows={5}
                            placeholder="Add internal notes..."
                            value={formData.note}
                            onChange={e => setFormData(prev => ({ ...prev, note: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none resize-none"
                        />
                    </div>

                    <div className="flex justify-end gap-4">
                        <button
                            type="button"
                            onClick={handleReset}
                            className="border border-gray-300 text-gray-700 hover:bg-gray-50 transition px-4 py-3 text-sm rounded-xl font-medium"
                        >
                            Reset
                        </button>
                        <button
                            type="submit"
                            className="bg-black text-white hover:bg-gray-900 transition px-4 py-3 text-sm rounded-xl font-medium"
                        >
                            Create Project
                        </button>
                    </div>
                </form>
            </LayoutComponents>

            {showCategoryModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
                        <div className="flex justify-between items-center p-6 border-b border-gray-200">
                            <h3 className="text-xl font-medium">Manage Categories</h3>
                            <button onClick={() => setShowCategoryModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                <MdClose className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            {categories.map(c => (
                                <div key={c.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                                    <span className="font-medium">{c.name}</span>
                                    <button onClick={() => handleRemoveCategory(c.id)} className="text-red-600 hover:text-red-800">Remove</button>
                                </div>
                            ))}
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    placeholder="New category name"
                                    value={newCategoryName}
                                    onChange={e => setNewCategoryName(e.target.value)}
                                    onKeyDown={e => e.key === "Enter" && handleAddCategory()}
                                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none"
                                />
                                <button onClick={handleAddCategory} className="transition-colors bg-black text-white hover:bg-gray-900 px-4 py-3 text-sm rounded-xl font-medium">
                                    Add
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showDepartmentModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
                        <div className="flex justify-between items-center p-6 border-b border-gray-200">
                            <h3 className="text-xl font-medium">Manage Departments</h3>
                            <button onClick={() => setShowDepartmentModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                <MdClose className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            {departments.map(d => (
                                <div key={d.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                                    <span className="font-medium">{d.name}</span>
                                    <button onClick={() => handleRemoveDepartment(d.id)} className="text-red-600 hover:text-red-800">Remove</button>
                                </div>
                            ))}
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    placeholder="New department name"
                                    value={newDepartmentName}
                                    onChange={e => setNewDepartmentName(e.target.value)}
                                    onKeyDown={e => e.key === "Enter" && handleAddDepartment()}
                                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none"
                                />
                                <button onClick={handleAddDepartment} className="transition-colors bg-black text-white hover:bg-gray-900 px-4 py-3 text-sm rounded-xl font-medium">
                                    Add
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showClientModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
                        <div className="flex justify-between items-center p-6 border-b border-gray-200">
                            <h3 className="text-xl font-medium">Manage Clients</h3>
                            <button onClick={() => setShowClientModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                <MdClose className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="space-y-3">
                                {clients.map(c => (
                                    <div key={c.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                                        <div>
                                            <div className="font-medium">{c.name}</div>
                                            <div className="text-sm text-gray-500">{c.email}</div>
                                        </div>
                                        <button onClick={() => handleRemoveClient(c.id)} className="text-red-600 hover:text-red-800">Remove</button>
                                    </div>
                                ))}
                            </div>
                            <div className="space-y-4">
                                <Input label="Client Name" required value={newClientData.name} onChange={e => setNewClientData(prev => ({ ...prev, name: e.target.value }))} />
                                <Input label="Email" type="email" required value={newClientData.email} onChange={e => setNewClientData(prev => ({ ...prev, email: e.target.value }))} />
                                <div>
                                    <label className="text-sm font-medium text-black mb-2 block">Password <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            required
                                            value={newClientData.password}
                                            onChange={e => setNewClientData(prev => ({ ...prev, password: e.target.value }))}
                                            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2"
                                        >
                                            {showPassword ? <MdVisibilityOff className="w-5 h-5 text-gray-500" /> : <MdVisibility className="w-5 h-5 text-gray-500" />}
                                        </button>
                                    </div>
                                </div>
                                <button onClick={handleAddClient} className="transition-colors w-full bg-black text-white hover:bg-gray-900 px-4 py-3 text-sm rounded-xl font-medium">
                                    Add Client
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}


            {showStageModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
                        <div className="flex justify-between items-center p-6 border-b border-gray-200">
                            <h3 className="text-xl font-medium">Add New Stage</h3>
                            <button onClick={() => setShowStageModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                <MdClose className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <input
                                type="text"
                                placeholder="Stage name (e.g. Proposal Sent)"
                                value={newStageName}
                                onChange={e => setNewStageName(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none"
                            />
                            <button onClick={handleAddStage} className="transition-colors w-full bg-black text-white hover:bg-gray-900 px-4 py-3 text-sm rounded-xl font-medium">
                                Save Stage
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showCurrencyModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
                        <div className="flex justify-between items-center p-6 border-b border-gray-200">
                            <h3 className="text-xl font-medium">Manage Currencies</h3>
                            <button onClick={() => setShowCurrencyModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                <MdClose className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="space-y-3">
                                {currencies.map(c => (
                                    <div key={c.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                                        <div>
                                            <div className="font-medium">{c.name}</div>
                                        </div>
                                        <button onClick={() => handleRemoveCurrency(c.id)} className="text-red-600 hover:text-red-800">Remove</button>
                                    </div>
                                ))}
                            </div>
                             <div className="space-y-4 border-t pt-6">
                                <Input
                                    label="Currency"
                                    required
                                    placeholder="e.g. USD or US Dollar"
                                    value={newCurrencyValue}
                                    onChange={e => setNewCurrencyValue(e.target.value)}
                                />
                                <button
                                    onClick={handleAddCurrency}
                                    className="transition-colors w-full bg-black text-white hover:bg-gray-900 px-4 py-3 text-sm rounded-xl font-medium"
                                >
                                    Add Currency
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CreateProjectPage;
