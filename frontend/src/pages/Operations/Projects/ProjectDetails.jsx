import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
    MdArrowBack,
    MdEdit,
    MdCalendarToday,
    MdPerson,
    MdWork,
    MdAttachMoney,
    MdDescription,
    MdNotes,
    MdAccessTime,
    MdCheckCircle,
    MdWarning,
    MdGroup,
    MdInsertDriveFile,
    MdAdd,
} from "react-icons/md";
import { motion } from "framer-motion";
import apiClient from "../../../helpers/apiClient";
import LayoutComponents from "../../../components/LayoutComponents";
import Loading from "../../../components/Loading";
import toast from "react-hot-toast";

const ProjectDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProjectDetails = async () => {
            try {
                setLoading(true);
                const [projRes, tasksRes] = await Promise.all([
                    apiClient.get(`/operation/projects/${id}/`),
                    apiClient.get(`/operation/tasks/?project=${id}`),
                ]);
                setProject(projRes.data);
                setTasks(Array.isArray(tasksRes.data) ? tasksRes.data : tasksRes.data.results || []);
            } catch (error) {
                console.error("Failed to fetch project details:", error);
                toast.error("Failed to load project details");
            } finally {
                setLoading(false);
            }
        };

        fetchProjectDetails();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loading />
            </div>
        );
    }

    if (!project) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
                <div className="text-center">
                    <MdWarning className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-medium text-gray-900 mb-2">Project Not Found</h2>
                    <p className="text-gray-600 mb-6">The project you're looking for doesn't exist or you don't have permission to view it.</p>
                    <button
                        onClick={() => navigate("/operations/projects")}
                        className="px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-900 transition font-medium"
                    >
                        Back to Projects
                    </button>
                </div>
            </div>
        );
    }

    const getStatusColor = (status) => {
        const name = (status?.name || "").toLowerCase();
        if (name.includes("completed") || name.includes("done")) return "bg-green-100 text-green-700 border-green-200";
        if (name.includes("progress")) return "bg-blue-100 text-blue-700 border-blue-200";
        if (name.includes("hold")) return "bg-amber-100 text-amber-700 border-amber-200";
        if (name.includes("cancelled")) return "bg-red-100 text-red-700 border-red-200";
        return "bg-gray-100 text-gray-700 border-gray-200";
    };

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
            <LayoutComponents title="Project Details" subtitle={project.name} variant="card">
                {/* Header Actions */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <button
                        onClick={() => navigate("/operations/projects")}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition font-medium"
                    >
                        <MdArrowBack className="w-5 h-5" />
                        Back to Projects
                    </button>
                    <div className="flex gap-3 w-full sm:w-auto">
                        <Link
                            to={`/operations/projects/edit/${id}`}
                            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-black text-white rounded-xl hover:bg-gray-900 transition font-medium shadow-sm"
                        >
                            <MdEdit className="w-5 h-5" />
                            Edit Project
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Info Column */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Project Overview Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h1 className="text-3xl font-medium text-gray-900 mb-2">{project.name}</h1>
                                    <div className="flex flex-wrap gap-2">
                                        <span className={`px-4 py-1.5 rounded-full text-xs font-medium border ${getStatusColor(project.status)} uppercase tracking-wider`}>
                                            {project.status?.name || "No Status"}
                                        </span>
                                        <span className="px-4 py-1.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100 uppercase tracking-wider">
                                            {project.category?.name || "General"}
                                        </span>
                                        {project.department && (
                                            <span className="px-4 py-1.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100 uppercase tracking-wider">
                                                {project.department.name}
                                            </span>
                                        )}
                                        {project.stage && (
                                            <span className="px-4 py-1.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase tracking-wider">
                                                {project.stage?.name}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-6 border-y border-gray-100">
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                        <MdCalendarToday className="w-4 h-4" /> Start Date
                                    </p>
                                    <p className="text-sm font-medium text-gray-900">
                                        {project.start_date ? new Date(project.start_date).toLocaleDateString("en-GB") : "—"}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                        <MdCalendarToday className="w-4 h-4" /> Deadline
                                    </p>
                                    <p className="text-sm font-medium text-gray-900">
                                        {project.no_deadline ? "No Deadline" : (project.deadline ? new Date(project.deadline).toLocaleDateString("en-GB") : "—")}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                        <MdAttachMoney className="w-4 h-4" /> Budget
                                    </p>
                                    <p className="text-sm font-medium text-gray-900">
                                        {project.currency?.symbol || "₹"}{project.budget || "0.00"}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                        <MdWork className="w-4 h-4" /> Hours
                                    </p>
                                    <p className="text-sm font-medium text-gray-900">
                                        {project.hours_allocated || "Not Set"}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-8">
                                <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                                    <MdDescription className="w-5 h-5 text-gray-400" /> Project Summary
                                </h3>
                                <div className="bg-gray-50 rounded-2xl p-6 text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                                    {project.summary || "No summary provided for this project."}
                                </div>
                            </div>

                            {project.notes && (
                                <div className="mt-8">
                                    <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                                        <MdNotes className="w-5 h-5 text-gray-400" /> Internal Notes
                                    </h3>
                                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 text-gray-700 text-sm leading-relaxed whitespace-pre-wrap italic">
                                        {project.notes}
                                    </div>
                                </div>
                            )}
                        </motion.div>

                        {/* Project Tasks Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden"
                        >
                            <div className="p-8 border-b border-gray-100 flex justify-between items-center">
                                <h3 className="text-xl font-medium text-gray-900 flex items-center gap-2">
                                    <MdCheckCircle className="w-6 h-6 text-blue-500" /> Project Tasks
                                </h3>
                                <Link
                                    to="/operations/tasks/newtask"
                                    state={{ projectId: id }}
                                    className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition text-sm font-medium flex items-center gap-1"
                                >
                                    <MdAdd className="w-4 h-4" /> Add Task
                                </Link>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 text-gray-400 text-[10px] uppercase font-medium tracking-widest">
                                        <tr>
                                            <th className="px-8 py-4 text-left">Task Name</th>
                                            <th className="px-8 py-4 text-left">Assignees</th>
                                            <th className="px-8 py-4 text-left">Due Date</th>
                                            <th className="px-8 py-4 text-left">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {tasks.length === 0 ? (
                                            <tr>
                                                <td colSpan="4" className="px-8 py-12 text-center text-gray-500 italic">
                                                    No tasks associated with this project.
                                                </td>
                                            </tr>
                                        ) : (
                                            tasks.map((task) => (
                                                <tr key={task.id} className="hover:bg-gray-50 transition group">
                                                    <td className="px-8 py-5">
                                                        <Link to={`/operations/tasks/edit/${task.id}`} className="font-medium text-gray-900 hover:text-blue-600 transition">
                                                            {task.name}
                                                        </Link>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <div className="flex -space-x-2">
                                                            {task.assignees?.slice(0, 3).map((a, i) => (
                                                                <div key={i} className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-[10px] font-medium text-gray-600 shadow-sm" title={a.name || a.username}>
                                                                    {(a.name || a.username || "?")[0].toUpperCase()}
                                                                </div>
                                                            ))}
                                                            {task.assignees?.length > 3 && (
                                                                <div className="w-8 h-8 rounded-full bg-gray-600 border-2 border-white flex items-center justify-center text-[10px] font-medium text-white shadow-sm">
                                                                    +{task.assignees.length - 3}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5 text-sm text-gray-600">
                                                        {task.due_date ? new Date(task.due_date).toLocaleDateString("en-GB") : "—"}
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <span className="px-3 py-1 bg-gray-100 rounded-full text-[10px] font-medium text-gray-600 uppercase">
                                                            {task.status || "Todo"}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    </div>

                    {/* Sidebar Column */}
                    <div className="space-y-8">
                        {/* Client Info Card */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8"
                        >
                            <h3 className="text-sm font-medium text-gray-900 mb-6 flex items-center gap-2">
                                <MdPerson className="w-5 h-5 text-gray-400" /> Client Details
                            </h3>
                            {project.client ? (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                                        <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center text-white text-xl font-medium shadow-lg">
                                            {project.client.name[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 leading-tight">{project.client.name}</p>
                                            <p className="text-xs text-gray-500">{project.client.email}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 gap-3">
                                        {project.client.phone && (
                                            <div className="p-3 border border-gray-100 rounded-2xl">
                                                <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest mb-1">Phone</p>
                                                <p className="text-sm font-medium text-gray-900">{project.client.phone}</p>
                                            </div>
                                        )}
                                        {project.client.address && (
                                            <div className="p-3 border border-gray-100 rounded-2xl">
                                                <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest mb-1">Address</p>
                                                <p className="text-sm font-medium text-gray-900">{project.client.address}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 italic">No client associated with this project.</p>
                            )}
                        </motion.div>

                        {/* Team Members Card */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8"
                        >
                            <h3 className="text-sm font-medium text-gray-900 mb-6 flex items-center gap-2">
                                <MdGroup className="w-5 h-5 text-gray-400" /> Project Team
                            </h3>
                            <div className="space-y-3">
                                {project.members?.length > 0 ? (
                                    project.members.map((member) => (
                                        <div key={member.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-2xl transition group">
                                            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm shadow-md transition group-hover:scale-110">
                                                {(member.name || member.email)[0].toUpperCase()}
                                            </div>
                                            <div className="overflow-hidden">
                                                <p className="text-sm font-medium text-gray-900 truncate">{member.name || "Unnamed User"}</p>
                                                <p className="text-[10px] text-gray-500 truncate">{member.email}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-500 italic text-center py-4">No team members assigned.</p>
                                )}
                            </div>
                        </motion.div>

                        {/* Attachments Card */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8"
                        >
                            <h3 className="text-sm font-medium text-gray-900 mb-6 flex items-center gap-2">
                                <MdInsertDriveFile className="w-5 h-5 text-gray-400" /> Project Files
                            </h3>
                            <div className="space-y-2">
                                {project.project_files?.length > 0 ? (
                                    project.project_files.map((file) => (
                                        <a
                                            key={file.id}
                                            href={file.file}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 transition group"
                                        >
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition">
                                                    <MdInsertDriveFile className="w-5 h-5" />
                                                </div>
                                                <p className="text-sm font-medium text-gray-700 truncate">{file.original_name}</p>
                                            </div>
                                            <span className="text-[10px] font-medium text-blue-600 uppercase group-hover:underline whitespace-nowrap">View</span>
                                        </a>
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-500 italic text-center py-4">No files attached.</p>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </LayoutComponents>
        </div>
    );
};

export default ProjectDetails;
