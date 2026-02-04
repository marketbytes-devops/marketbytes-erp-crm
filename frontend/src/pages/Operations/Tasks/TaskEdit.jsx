import React, { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import LayoutComponents from "../../../components/LayoutComponents";
import { MdArrowBack } from "react-icons/md";
import toast from "react-hot-toast";
import apiClient from "../../../helpers/apiClient";
import Loading from "../../../components/Loading";
import Input from "../../../components/Input";

const EditTaskPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formLoading, setFormLoading] = useState(true);

    const [projects, setProjects] = useState([]);
    const [users, setUsers] = useState([]);

    const [formData, setFormData] = useState({
        project: "",
        name: "",
        description: "",
        status: "todo",
        priority: "medium",
        start_date: "",
        due_date: "",
        allocated_hours: "",
        assignees: [],
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                setFormLoading(true);

                const [taskRes, projectsRes, usersRes] = await Promise.all([
                    apiClient.get(`/operation/tasks/${id}/`),
                    apiClient.get("/operation/projects/"),
                    apiClient.get("/auth/users/"),
                ]);

                const extractData = (response) => {
                    const data = response?.data;
                    if (Array.isArray(data)) return data;
                    if (data?.results && Array.isArray(data.results)) return data.results;
                    return [];
                };

                const taskData = taskRes.data;
                setProjects(extractData(projectsRes));
                setUsers(extractData(usersRes));

                setFormData({
                    project: taskData.project || "",
                    name: taskData.name || "",
                    description: taskData.description || "",
                    status: taskData.status || "todo",
                    priority: taskData.priority || "medium",
                    start_date: taskData.start_date || "",
                    due_date: taskData.due_date || "",
                    allocated_hours: taskData.allocated_hours || "",
                    assignees: taskData.assignees?.map(u => u.id.toString()) || [],
                });
            } catch (err) {
                toast.error("Failed to load task data");
                console.error(err);
            } finally {
                setFormLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                project: formData.project ? Number(formData.project) : null,
                name: formData.name ? formData.name.trim() : null,
                description: formData.description?.trim() || null,
                status: formData.status,
                priority: formData.priority,
                start_date: formData.start_date || null,
                due_date: formData.due_date || null,
                allocated_hours: formData.allocated_hours ? parseFloat(formData.allocated_hours) : null,
                assignee_ids: formData.assignees || [],
            };

            await apiClient.put(`/operation/tasks/${id}/`, payload);

            toast.success("Task updated successfully!");
            navigate("/operations/tasks");
        } catch (err) {
            console.error(err);
            toast.error("Failed to update task");
        } finally {
            setLoading(false);
        }
    };

    if (formLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loading />
            </div>
        );
    }

    const projectOptions = projects.map((proj) => ({
        value: proj.id,
        label: proj.name,
    }));

    const statusOptions = [
        { value: "todo", label: "To Do" },
        { value: "in_progress", label: "In Progress" },
        { value: "review", label: "Review" },
        { value: "done", label: "Done" },
    ];

    const assigneeOptions = users.map((user) => ({
        value: user.id.toString(),
        label: user.name || user.username || user.email,
    }));

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
            <LayoutComponents title="Edit Task" subtitle={`Updating: ${formData.name}`} variant="card">
                <div className="mb-8">
                    <Link
                        to="/operations/tasks"
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
                    >
                        <MdArrowBack className="w-5 h-5" />
                        Back to Tasks
                    </Link>
                </div>

                <form onSubmit={handleSubmit} className="space-y-10">
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden p-8">
                        <div className="mb-8">
                            <Input
                                label="Project"
                                type="select"
                                required
                                placeholder="Select Project"
                                options={[{ value: "", label: "Select Project" }, ...projectOptions]}
                                value={formData.project}
                                onChange={(val) => setFormData({ ...formData, project: val })}
                            />
                        </div>

                        <div className="mb-8">
                            <Input
                                label="Title"
                                type="text"
                                required
                                placeholder="Enter task title"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div className="mb-8">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                            <textarea
                                rows={6}
                                placeholder="Write description here..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            <div>
                                <Input
                                    label="Status"
                                    type="select"
                                    required
                                    options={statusOptions}
                                    value={formData.status}
                                    onChange={(val) => setFormData({ ...formData, status: val })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                                <div className="flex flex-wrap items-center gap-6">
                                    {["urgent", "high", "medium", "low"].map((level) => (
                                        <label key={level} className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="priority"
                                                value={level}
                                                checked={formData.priority === level}
                                                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                                className="w-4 h-4 text-black focus:ring-black border-gray-300"
                                            />
                                            <span className="capitalize">{level}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                            <div>
                                <Input
                                    label="Start Date"
                                    type="date"
                                    value={formData.start_date}
                                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                />
                            </div>

                            <div>
                                <Input
                                    label="Due Date"
                                    type="date"
                                    value={formData.due_date}
                                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                                />
                            </div>

                            <div>
                                <Input
                                    label="Allocated Hours"
                                    type="number"
                                    step="0.5"
                                    placeholder="e.g., 8.5"
                                    value={formData.allocated_hours}
                                    onChange={(e) => setFormData({ ...formData, allocated_hours: e.target.value })}
                                />
                            </div>
                        </div>


                        <div className="mb-8">
                            <Input
                                label="Assigned To"
                                type="select"
                                multiple
                                placeholder="Choose Assignee(s)"
                                options={assigneeOptions}
                                value={formData.assignees}
                                onChange={(val) => setFormData({ ...formData, assignees: val })}
                            />
                        </div>

                        <div className="flex justify-end gap-4">
                            <Link
                                to="/operations/tasks"
                                className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-900 transition font-medium"
                            >
                                {loading ? "Updating Task..." : "Update Task"}
                            </button>
                        </div>
                    </div>
                </form>
            </LayoutComponents>
        </div>
    );
};

export default EditTaskPage;
