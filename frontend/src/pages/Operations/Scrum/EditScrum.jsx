import { useState, useEffect } from 'react';
import { MdArrowBack, MdClose } from 'react-icons/md';
import LayoutComponents from '../../../components/LayoutComponents';
import Input from '../../../components/Input';
import toast from 'react-hot-toast';
import apiClient from '../../../helpers/apiClient';
import { useParams, useNavigate } from 'react-router-dom';
import Loading from '../../../components/Loading';

const EditScrumPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        project: "",
        task: "",
        employeeName: "",
        status: "",
        morning_memo: "",
        evening_memo: "",
        date: "",
    });

    const [projects, setProjects] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [employees, setEmployees] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [scrumRes, projRes, empRes, tasksRes] = await Promise.all([
                    apiClient.get(`/operation/scrum/${id}/`),
                    apiClient.get("/operation/projects/"),
                    apiClient.get("/auth/users/"),
                    apiClient.get("/operation/tasks/")
                ]);

                const scrum = scrumRes.data;
                const extract = (d) => (Array.isArray(d) ? d : d.results || []);

                setProjects(extract(projRes.data));
                setEmployees(extract(empRes.data));
                setTasks(extract(tasksRes.data));

                setFormData({
                    project: scrum.project?.id?.toString() || scrum.project?.toString() || "",
                    task: scrum.task?.id?.toString() || scrum.task?.toString() || "",
                    employeeName: scrum.employee?.id?.toString() || scrum.employee?.toString() || "",
                    status: scrum.reported_status || "todo",
                    morning_memo: scrum.morning_memo || "",
                    evening_memo: scrum.evening_memo || "",
                    date: scrum.date || new Date().toISOString().split("T")[0],
                });

            } catch (error) {
                console.error(error);
                toast.error("Failed to load scrum details");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        if (!formData.project || !formData.task || !formData.employeeName) {
            toast.error("Please fill required fields");
            setSubmitting(false);
            return;
        }

        try {
            const payload = {
                project: formData.project,
                task: formData.task,
                employee_id: formData.employeeName,
                reported_status: formData.status,
                morning_memo: formData.morning_memo,
                evening_memo: formData.evening_memo,
                date: formData.date,
            };

            await apiClient.patch(`/operation/scrum/${id}/`, payload);
            toast.success("Scrum updated successfully!");
            navigate("/operations/scrum");
        } catch (error) {
            console.error(error);
            toast.error("Failed to update scrum");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loading /></div>;

    const statusOptions = [
        { value: "todo", label: "To Do" },
        { value: "in_progress", label: "In Progress" },
        { value: "review", label: "Review" },
        { value: "done", label: "Done" },
    ];

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
            <LayoutComponents title="Edit Scrum" subtitle="Update daily standup details" variant="card">
                <div className="mb-8">
                    <button
                        onClick={() => navigate("/operations/scrum")}
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
                    >
                        <MdArrowBack className="w-5 h-5" />
                        Back to Scrum Board
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Information Section */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-6">Scrum Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <Input
                                label="Project"
                                type="select"
                                required
                                value={formData.project}
                                onChange={(v) => setFormData({ ...formData, project: v })}
                                options={[{ label: "Select Project", value: "" }, ...projects.map(p => ({ label: p.name, value: String(p.id) }))]}
                            />
                            <Input
                                label="Task"
                                type="select"
                                required
                                value={formData.task}
                                onChange={(v) => setFormData({ ...formData, task: v })}
                                options={[{ label: "Select Task", value: "" }, ...tasks.map(t => ({ label: t.name, value: String(t.id) }))]}
                            />
                            <Input
                                label="Employee"
                                type="select"
                                required
                                value={formData.employeeName}
                                onChange={(v) => setFormData({ ...formData, employeeName: v })}
                                options={[{ label: "Select Employee", value: "" }, ...employees.map(e => ({ label: e.name || "Unknown", value: String(e.id) }))]}
                            />
                            <Input
                                label="Date"
                                type="date"
                                required
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            />
                            <Input
                                label="Status"
                                type="select"
                                value={formData.status}
                                onChange={(v) => setFormData({ ...formData, status: v })}
                                options={statusOptions}
                            />
                        </div>
                    </div>

                    {/* Memos Section */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-6">Memos & Notes</h3>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Morning Memo</label>
                                <textarea
                                    rows={4}
                                    value={formData.morning_memo}
                                    onChange={e => setFormData({ ...formData, morning_memo: e.target.value })}
                                    className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black outline-none resize-none"
                                    placeholder="Enter plans for the day..."
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Evening Memo</label>
                                <textarea
                                    rows={4}
                                    value={formData.evening_memo}
                                    onChange={e => setFormData({ ...formData, evening_memo: e.target.value })}
                                    className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black outline-none resize-none"
                                    placeholder="Enter daily recap..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-5">
                        <button type="button" onClick={() => navigate("/operations/scrum")} className="px-8 py-3.5 border-2 border-gray-300 rounded-2xl font-medium text-gray-700 hover:bg-gray-100 transition">Cancel</button>
                        <button type="submit" disabled={submitting} className="px-10 py-3.5 bg-black text-white rounded-2xl font-medium hover:bg-gray-800 transition disabled:bg-gray-400">
                            {submitting ? "Updating..." : "Update Scrum"}
                        </button>
                    </div>
                </form>
            </LayoutComponents>
        </div>
    );
};

export default EditScrumPage;
