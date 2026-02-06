import { useState, useEffect } from "react";
import {
    MdAdd,
    MdClose,
    MdVisibility,
    MdVisibilityOff,
    MdArrowBack,
} from "react-icons/md";
import LayoutComponents from "../../../components/LayoutComponents";
import Input from "../../../components/Input";
import toast from "react-hot-toast";
import apiClient from "../../../helpers/apiClient";
import { useParams, useNavigate } from "react-router-dom";
import Loading from "../../../components/Loading";

const EditProjectPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

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
        clientCanManageTasks: true,
        sendTaskNotification: false,
        budget: "",
        currency: "",
        status: "",
        stage: "",
        summary: "",
        note: "",
    });

    const [users, setUsers] = useState([]);
    const [files, setFiles] = useState([]);
    const [existingFiles, setExistingFiles] = useState([]);

    const [categories, setCategories] = useState([]);
    const [statuses, setStatuses] = useState([]);
    const [stages, setStages] = useState([]);
    const [clients, setClients] = useState([]);
    const [currencies, setCurrencies] = useState([]);
    const [departments, setDepartments] = useState([]);

    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");

    const [showDepartmentModal, setShowDepartmentModal] = useState(false);
    const [newDepartmentName, setNewDepartmentName] = useState("");

    const [showClientModal, setShowClientModal] = useState(false);
    const [newClientData, setNewClientData] = useState({
        name: "",
        email: "",
        password: "",
    });
    const [showPassword, setShowPassword] = useState(false);

    const [showStatusModal, setShowStatusModal] = useState(false);
    const [newStatusName, setNewStatusName] = useState("");

    const [showStageModal, setShowStageModal] = useState(false);
    const [newStageName, setNewStageName] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [
                    projRes,
                    catRes,
                    clientRes,
                    statusRes,
                    stageRes,
                    currencyRes,
                    deptRes,
                    userRes,
                ] = await Promise.all([
                    apiClient.get(`/operation/projects/${id}/`),
                    apiClient.get("/operation/categories/"),
                    apiClient.get("/operation/clients/"),
                    apiClient.get("/operation/statuses/"),
                    apiClient.get("/operation/stages/"),
                    apiClient.get("/operation/currencies/"),
                    apiClient.get("/auth/departments/"),
                    apiClient.get("/auth/users/"),
                ]);

                const project = projRes.data;
                const extract = (d) => (Array.isArray(d) ? d : d.results || []);

                setCategories(extract(catRes.data));
                setClients(extract(clientRes.data));
                setStatuses(extract(statusRes.data));
                setStages(extract(stageRes.data));
                setCurrencies(extract(currencyRes.data));
                setDepartments(extract(deptRes.data));
                setUsers(extract(userRes.data));

                setFormData({
                    projectName: project.name || "",
                    projectCategory: project.category?.id?.toString() || project.category_id?.toString() || "",
                    department: project.department?.id?.toString() || project.department_id?.toString() || "",
                    startDate: project.start_date || "",
                    deadline: project.deadline || "",
                    noDeadline: project.no_deadline || false,
                    amc: project.amc || false,
                    amcDate: project.amc_date || "",
                    allowManualTimeLogs: project.allow_manual_timelogs || false,
                    allocatedHours: project.hours_allocated || "",
                    renewalOnly: project.renewal_only || false,
                    dm: project.dm || false,
                    projectMembers: project.members?.map((m) => m.id.toString()) || [],
                    client: project.client?.id?.toString() || project.client_id?.toString() || "",
                    clientCanManageTasks: project.client_can_manage_tasks || false,
                    sendTaskNotification: project.send_task_notifications_to_client || false,
                    budget: project.budget || "",
                    currency: project.currency?.id?.toString() || project.currency_id?.toString() || "",
                    status: project.status?.id?.toString() || project.status_id?.toString() || "",
                    stage: project.stage?.id?.toString() || project.stage_id?.toString() || "",
                    summary: project.summary || "",
                    note: project.notes || "",
                });

                setExistingFiles(project.project_files || []);
            } catch (error) {
                console.error(error);
                toast.error("Failed to load project details");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const formDataToSend = new FormData();
            formDataToSend.append("name", formData.projectName);
            formDataToSend.append("department_id", formData.department);
            formDataToSend.append("start_date", formData.startDate);
            formDataToSend.append("no_deadline", formData.noDeadline);
            if (!formData.noDeadline && formData.deadline) {
                formDataToSend.append("deadline", formData.deadline);
            } else {
                formDataToSend.append("deadline", "");
            }

            formDataToSend.append("category_id", formData.projectCategory);
            formDataToSend.append("status_id", formData.status);
            formDataToSend.append("stage_id", formData.stage);
            formDataToSend.append("client_id", formData.client);
            formDataToSend.append("currency_id", formData.currency);
            formDataToSend.append("amc", formData.amc);
            formDataToSend.append("amc_date", formData.amc && formData.amcDate ? formData.amcDate : "");
            formDataToSend.append("renewal_only", formData.renewalOnly);
            formDataToSend.append("dm", formData.dm);
            formDataToSend.append("allow_manual_timelogs", formData.allowManualTimeLogs);
            formDataToSend.append("hours_allocated", formData.allocatedHours || "");
            formDataToSend.append("client_can_manage_tasks", formData.clientCanManageTasks);
            formDataToSend.append("send_task_notifications_to_client", formData.sendTaskNotification);
            formDataToSend.append("budget", formData.budget || "");
            formDataToSend.append("summary", formData.summary);
            formDataToSend.append("notes", formData.note);

            formData.projectMembers.forEach((mId) => {
                formDataToSend.append("members_ids", mId);
            });

            files.forEach((file) => {
                formDataToSend.append("files", file);
            });

            await apiClient.put(`/operation/projects/${id}/`, formDataToSend);
            toast.success("Project updated successfully!");
            navigate("/operations/projects");
        } catch (error) {
            console.error(error);
            toast.error("Failed to update project");
        } finally {
            setSubmitting(false);
        }
    };

    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) return;
        try {
            const res = await apiClient.post("/operation/categories/", { name: newCategoryName });
            setCategories([...categories, res.data]);
            setFormData({ ...formData, projectCategory: res.data.id.toString() });
            setNewCategoryName("");
            setShowCategoryModal(false);
            toast.success("Category added");
        } catch (err) {
            toast.error("Failed to add category");
        }
    };

    const handleAddDepartment = async () => {
        if (!newDepartmentName.trim()) return;
        try {
            const res = await apiClient.post("/auth/departments/", { name: newDepartmentName });
            setDepartments([...departments, res.data]);
            setFormData({ ...formData, department: res.data.id.toString() });
            setNewDepartmentName("");
            setShowDepartmentModal(false);
            toast.success("Department added");
        } catch (err) {
            toast.error("Failed to add department");
        }
    };

    const handleAddClient = async () => {
        if (!newClientData.name || !newClientData.email || !newClientData.password) return;
        try {
            const res = await apiClient.post("/operation/clients/", newClientData);
            setClients([...clients, res.data]);
            setFormData({ ...formData, client: res.data.id.toString() });
            setNewClientData({ name: "", email: "", password: "" });
            setShowClientModal(false);
            toast.success("Client added");
        } catch (err) {
            toast.error("Failed to add client");
        }
    };

    const handleAddStatus = async () => {
        if (!newStatusName.trim()) return;
        try {
            const res = await apiClient.post("/operation/statuses/", { name: newStatusName });
            setStatuses([...statuses, res.data]);
            setFormData({ ...formData, status: res.data.id.toString() });
            setNewStatusName("");
            setShowStatusModal(false);
            toast.success("Status added");
        } catch (err) {
            toast.error("Failed to add status");
        }
    };

    const handleAddStage = async () => {
        if (!newStageName.trim()) return;
        try {
            const res = await apiClient.post("/operation/stages/", { name: newStageName });
            setStages([...stages, res.data]);
            setFormData({ ...formData, stage: res.data.id.toString() });
            setNewStageName("");
            setShowStageModal(false);
            toast.success("Stage added");
        } catch (err) {
            toast.error("Failed to add stage");
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loading /></div>;

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
            <LayoutComponents title="Edit Project" subtitle={`Updating: ${formData.projectName}`} variant="card">
                <div className="mb-8">
                    <button
                        onClick={() => navigate("/operations/projects")}
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
                    >
                        <MdArrowBack className="w-5 h-5" />
                        Back to Projects
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Project Information Section */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-6">Project Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <Input
                                label="Project Name"
                                required
                                value={formData.projectName}
                                onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                            />
                            <div className="relative top-0 sm:-top-1.5">
                                <div className="flex items-center gap-2 mb-2">
                                    <label className="text-sm font-medium text-black">Project Category</label>
                                    <button type="button" onClick={() => setShowCategoryModal(true)} className="p-1 rounded-full border border-green-600 text-green-600 hover:bg-green-600 hover:text-white transition">
                                        <MdAdd className="w-4 h-4" />
                                    </button>
                                </div>
                                <Input
                                    type="select"
                                    options={[{ value: "", label: "Select category" }, ...categories.map(c => ({ value: c.id, label: c.name }))]}
                                    value={formData.projectCategory}
                                    onChange={v => setFormData({ ...formData, projectCategory: v })}
                                />
                            </div>
                            <div className="relative top-0 sm:-top-1.5">
                                <div className="flex items-center gap-2 mb-2">
                                    <label className="text-sm font-medium text-black">Department <span className="text-red-500">*</span></label>
                                    <button type="button" onClick={() => setShowDepartmentModal(true)} className="p-1 rounded-full border border-green-600 text-green-600 hover:bg-green-600 hover:text-white transition">
                                        <MdAdd className="w-4 h-4" />
                                    </button>
                                </div>
                                <Input
                                    type="select"
                                    required
                                    options={[{ value: "", label: "Select department" }, ...departments.map(d => ({ value: d.id, label: d.name }))]}
                                    value={formData.department}
                                    onChange={v => setFormData({ ...formData, department: v })}
                                />
                            </div>
                            <Input label="Start Date" required type="date" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} />
                            <div>
                                <label className="text-sm font-medium text-black mb-2 block">Deadline</label>
                                <input
                                    type="date"
                                    disabled={formData.noDeadline}
                                    value={formData.deadline}
                                    onChange={e => setFormData({ ...formData, deadline: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none disabled:bg-gray-50"
                                />
                            </div>
                            <div className="flex items-center mt-8">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={formData.noDeadline} onChange={e => setFormData({ ...formData, noDeadline: e.target.checked, deadline: e.target.checked ? "" : formData.deadline })} />
                                    <span className="text-sm font-medium">No deadline</span>
                                </label>
                            </div>
                        </div>

                        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                            {[
                                { label: 'AMC', key: 'amc' },
                                { label: 'Manual Timelogs', key: 'allowManualTimeLogs' },
                                { label: 'Renewal Only', key: 'renewalOnly' },
                                { label: 'DM', key: 'dm' }
                            ].map(item => (
                                <label key={item.key} className="flex items-center gap-2 cursor-pointer hover:bg-white p-2 rounded-lg transition">
                                    <input type="checkbox" checked={formData[item.key]} onChange={e => setFormData({ ...formData, [item.key]: e.target.checked })} />
                                    <span className="text-sm font-medium">{item.label}</span>
                                </label>
                            ))}
                        </div>

                        <div className="mt-6 grid grid-cols-1 gap-6">
                            {formData.amc && <Input label="AMC Date" type="date" value={formData.amcDate} onChange={e => setFormData({ ...formData, amcDate: e.target.value })} />}
                            {formData.allowManualTimeLogs && <Input label="Allocated Hours" type="number" value={formData.allocatedHours} onChange={e => setFormData({ ...formData, allocatedHours: e.target.value })} />}
                        </div>

                        <div className="mt-6">
                            <label className="text-sm font-medium text-black mb-2 block">Project Members</label>
                            <Input
                                type="select"
                                multiple
                                options={users.map(u => ({ value: u.id.toString(), label: u.name || u.email }))}
                                value={formData.projectMembers}
                                onChange={v => setFormData({ ...formData, projectMembers: v })}
                            />
                        </div>
                    </div>

                    {/* Client Information Section */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-6">Client Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <label className="text-sm font-medium text-black">Client</label>
                                    <button type="button" onClick={() => setShowClientModal(true)} className="p-1 rounded-full border border-green-600 text-green-600 hover:bg-green-600 hover:text-white transition">
                                        <MdAdd className="w-4 h-4" />
                                    </button>
                                </div>
                                <Input
                                    type="select"
                                    options={[{ value: "", label: "Select client" }, ...clients.map(c => ({ value: c.id, label: `${c.name} (${c.email})` }))]}
                                    value={formData.client}
                                    onChange={v => setFormData({ ...formData, client: v })}
                                />
                            </div>
                            <div className="space-y-4 pt-8">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input type="checkbox" checked={formData.clientCanManageTasks} onChange={e => setFormData({ ...formData, clientCanManageTasks: e.target.checked })} />
                                    <span className="font-medium text-sm">Client can manage tasks</span>
                                </label>
                                {formData.clientCanManageTasks && (
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input type="checkbox" checked={formData.sendTaskNotification} onChange={e => setFormData({ ...formData, sendTaskNotification: e.target.checked })} />
                                        <span className="font-medium text-sm">Send task notifications to client</span>
                                    </label>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Budget & Status Section */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-6">Budget & Status</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <Input label="Budget" type="number" value={formData.budget} onChange={e => setFormData({ ...formData, budget: e.target.value })} />
                            <Input
                                label="Currency"
                                type="select"
                                options={[{ value: "", label: "Select currency" }, ...currencies.map(c => ({ value: c.id, label: `${c.symbol || ''} ${c.code} - ${c.name}` }))]}
                                value={formData.currency}
                                onChange={v => setFormData({ ...formData, currency: v })}
                            />
                            <div className="relative top-0 sm:-top-1.5">
                                <div className="flex items-center gap-2 mb-2">
                                    <label className="text-sm font-medium text-black">Status</label>
                                    <button type="button" onClick={() => setShowStatusModal(true)} className="p-1 rounded-full border border-green-600 text-green-600 hover:bg-green-600 hover:text-white transition">
                                        <MdAdd className="w-4 h-4" />
                                    </button>
                                </div>
                                <Input
                                    type="select"
                                    options={[{ value: "", label: "Select status" }, ...statuses.map(s => ({ value: s.id, label: s.name }))]}
                                    value={formData.status}
                                    onChange={v => setFormData({ ...formData, status: v })}
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
                                    onChange={v => setFormData({ ...formData, stage: v })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Attachments Section */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-6">File Attachments</h3>
                        {existingFiles.length > 0 && (
                            <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {existingFiles.map((file, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                                        <span className="text-sm font-medium text-gray-700 truncate">{file.original_name}</span>
                                        <a href={file.file} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-xs font-medium hover:underline">View</a>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="border-2 border-dashed border-gray-300 rounded-3xl p-10 text-center hover:bg-gray-50 transition cursor-pointer relative">
                            <input type="file" multiple className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setFiles(Array.from(e.target.files))} />
                            <p className="text-gray-500 font-medium">Click or drag new files here to upload</p>
                            {files.length > 0 && <p className="mt-2 text-indigo-600 font-medium">{files.length} new files selected</p>}
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-6">Summary & Notes</h3>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Project Summary</label>
                                <textarea rows={4} value={formData.summary} onChange={e => setFormData({ ...formData, summary: e.target.value })} className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black outline-none resize-none" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Internal Notes</label>
                                <textarea rows={4} value={formData.note} onChange={e => setFormData({ ...formData, note: e.target.value })} className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black outline-none resize-none" />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-5">
                        <button type="button" onClick={() => navigate("/operations/projects")} className="px-8 py-3.5 border-2 border-gray-300 rounded-2xl font-medium text-gray-700 hover:bg-gray-100 transition">Cancel</button>
                        <button type="submit" disabled={submitting} className="px-10 py-3.5 bg-black text-white rounded-2xl font-medium hover:bg-gray-800 transition disabled:bg-gray-400">
                            {submitting ? "Updating..." : "Update Project"}
                        </button>
                    </div>
                </form>
            </LayoutComponents>

            {/* Modals for Status and Stage */}
            {showStatusModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
                        <div className="flex justify-between items-center p-6 border-b border-gray-200">
                            <h3 className="text-xl font-medium">Add New Status</h3>
                            <button onClick={() => setShowStatusModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                <MdClose className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <input
                                type="text"
                                placeholder="Status name"
                                value={newStatusName}
                                onChange={e => setNewStatusName(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none"
                            />
                            <button onClick={handleAddStatus} className="w-full py-3 bg-black text-white rounded-lg hover:bg-gray-900 font-medium">Save Status</button>
                        </div>
                    </div>
                </div>
            )}

            {showStageModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
                        <div className="flex justify-between items-center p-6 border-b border-gray-200">
                            <h3 className="text-xl font-medium">Add New Stage</h3>
                            <button onClick={() => setShowStageModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                <MdClose className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <input
                                type="text"
                                placeholder="Stage name"
                                value={newStageName}
                                onChange={e => setNewStageName(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none"
                            />
                            <button onClick={handleAddStage} className="w-full py-3 bg-black text-white rounded-lg hover:bg-gray-900 font-medium">Save Stage</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Category Modal */}
            {showCategoryModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
                        <div className="flex justify-between items-center p-6 border-b border-gray-200">
                            <h3 className="text-xl font-medium">Add Category</h3>
                            <button onClick={() => setShowCategoryModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                <MdClose className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <input type="text" placeholder="Category name" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none" />
                            <button onClick={handleAddCategory} className="w-full py-3 bg-black text-white rounded-lg">Save Category</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Department Modal */}
            {showDepartmentModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
                        <div className="flex justify-between items-center p-6 border-b border-gray-200">
                            <h3 className="text-xl font-medium">Add Department</h3>
                            <button onClick={() => setShowDepartmentModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                <MdClose className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <input type="text" placeholder="Department name" value={newDepartmentName} onChange={e => setNewDepartmentName(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none" />
                            <button onClick={handleAddDepartment} className="w-full py-3 bg-black text-white rounded-lg">Save Department</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Client Modal */}
            {showClientModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
                        <div className="flex justify-between items-center p-6 border-b border-gray-200">
                            <h3 className="text-xl font-medium">Add Client</h3>
                            <button onClick={() => setShowClientModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                <MdClose className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <Input label="Name" value={newClientData.name} onChange={e => setNewClientData({ ...newClientData, name: e.target.value })} />
                            <Input label="Email" value={newClientData.email} onChange={e => setNewClientData({ ...newClientData, email: e.target.value })} />
                            <Input label="Password" type="password" value={newClientData.password} onChange={e => setNewClientData({ ...newClientData, password: e.target.value })} />
                            <button onClick={handleAddClient} className="w-full py-3 bg-black text-white rounded-lg">Save Client</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EditProjectPage;
