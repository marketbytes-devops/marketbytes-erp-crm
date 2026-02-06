import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    MdFilterList,
    MdClose,
    MdKeyboardArrowDown,
    MdRestore,
    MdVisibility,
    MdPushPin,
    MdCalendarToday,
    MdGroup,
    MdOutlineAccessTime,
    MdArrowBack
} from "react-icons/md";
import { FiSearch } from "react-icons/fi";
import LayoutComponents from "../../../components/LayoutComponents";
import { useNavigate, useLocation } from "react-router-dom";
import apiClient from "../../../helpers/apiClient";
import Loading from "../../../components/Loading";
import toast from "react-hot-toast";
import Input from "../../../components/Input";
import { format } from 'date-fns';

const TaskArchive = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [tasks, setTasks] = useState([]);
    const [filteredTasks, setFilteredTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);

    const [filters, setFilters] = useState({
        status: "",
        project: "",
        assignee: "",
        priority: "",
    });

    const [projectsList, setProjectsList] = useState([]);
    const [membersList, setMembersList] = useState([]);

    const activeFilterCount = Object.values(filters).filter((v) => v !== "").length;

    const handleFilterChange = (key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    const resetFilters = () => {
        setFilters({
            status: "",
            project: "",
            assignee: "",
            priority: "",
        });
        setSearch("");
    };

    const statusOptions = [
        { value: "todo", label: "To Do" },
        { value: "in_progress", label: "In Progress" },
        { value: "review", label: "Review" },
        { value: "done", label: "Done" },
    ];

    const priorityOptions = [
        { value: "low", label: "Low" },
        { value: "medium", label: "Medium" },
        { value: "high", label: "High" },
        { value: "critical", label: "Critical" },
    ];

    const fetchTasks = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get("/operation/tasks/?is_active=false");
            const data = Array.isArray(response.data) ? response.data : response.data.results || [];

            setTasks(data);
            setFilteredTasks(data);

            const projs = [...new Set(data.map(t => t.project_name).filter(Boolean))].sort();
            const members = [...new Set(data.flatMap(t => (t.assignees || []).map(a => a.name || a.username)).filter(Boolean))].sort();

            setProjectsList(projs);
            setMembersList(members);
        } catch (err) {
            console.error("Failed to fetch archived tasks:", err);
            toast.error("Failed to load archived tasks");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    useEffect(() => {
        let result = tasks;

        if (search.trim()) {
            const term = search.toLowerCase().trim();
            result = result.filter(
                (t) =>
                    t.name?.toLowerCase().includes(term) ||
                    t.project_name?.toLowerCase().includes(term) ||
                    t.description?.toLowerCase().includes(term)
            );
        }

        if (filters.status) result = result.filter((t) => t.status === filters.status);
        if (filters.project) result = result.filter((t) => t.project_name === filters.project);
        if (filters.assignee) {
            result = result.filter((t) =>
                t.assignees?.some((a) => (a.name || a.username) === filters.assignee)
            );
        }
        if (filters.priority) result = result.filter((t) => t.priority === filters.priority);

        setFilteredTasks(result);
    }, [search, filters, tasks]);

    const handleRestore = async (task) => {
        if (!window.confirm("Restore this task to active list?")) return;
        try {
            await apiClient.post(`/operation/tasks/${task.id}/restore/`);
            setTasks(prev => prev.filter(t => t.id !== task.id));
            toast.success("Task restored successfully");
            if (selectedTask?.id === task.id) setIsTaskDetailOpen(false);
        } catch (err) {
            console.error(err);
            toast.error("Failed to restore task");
        }
    };

    const renderAvatars = (assignees = []) => {
        const memberCount = assignees.length;
        if (memberCount === 0) return <span className="text-sm text-gray-400 italic">Unassigned</span>;

        return (
            <div className="flex -space-x-2">
                {assignees.slice(0, 3).map((a, i) => {
                    const name = a.name || a.username || "Unknown";
                    const initial = name[0]?.toUpperCase() || "?";
                    return (
                        <div key={i} className="relative group">
                            <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-gray-600 text-xs font-medium">
                                {initial}
                            </div>
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
                                {name}
                            </div>
                        </div>
                    );
                })}
                {memberCount > 3 && (
                    <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-gray-500 text-xs font-medium">
                        +{memberCount - 3}
                    </div>
                )}
            </div>
        );
    };

    const taskDetailContent = selectedTask && (
        <div className="space-y-8">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-medium text-gray-900 mb-1">{selectedTask.name}</h2>
                    <p className="text-sm font-medium text-gray-500">{selectedTask.project_name || "No Project"}</p>
                </div>
                <div className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full uppercase tracking-wider">
                    Archived
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-6 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="space-y-1">
                    <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">Status</p>
                    <span className="px-3 py-1 rounded-full text-[10px] font-medium uppercase tracking-wider border bg-white text-gray-700">
                        {statusOptions.find(o => o.value === selectedTask.status)?.label || selectedTask.status}
                    </span>
                </div>
                <div className="space-y-1">
                    <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest flex items-center gap-1">
                        <MdCalendarToday className="w-3 h-3" /> Due Date
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                        {selectedTask.due_date ? format(new Date(selectedTask.due_date), 'dd MMM, yyyy') : "—"}
                    </p>
                </div>
                <div className="space-y-1">
                    <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest flex items-center gap-1">
                        <MdOutlineAccessTime className="w-3 h-3" /> Allocated
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                        {selectedTask.allocated_hours || "0"} Hr
                    </p>
                </div>
                <div className="space-y-1">
                    <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">Priority</p>
                    <span className={`text-xs font-medium uppercase ${selectedTask.priority === 'high' || selectedTask.priority === 'critical' ? 'text-red-600' : 'text-gray-900'}`}>
                        {selectedTask.priority || "Normal"}
                    </span>
                </div>
            </div>

            <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    <MdGroup className="w-5 h-5 text-gray-400" /> Assigned Team
                </h3>
                <div className="flex flex-wrap gap-3">
                    {selectedTask.assignees?.map((a, i) => (
                        <div key={i} className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-100 rounded-xl shadow-xs">
                            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-[10px] font-medium">
                                {(a.name || a.username || "?")[0].toUpperCase()}
                            </div>
                            <span className="text-xs font-medium text-gray-700">{a.name || a.username}</span>
                        </div>
                    ))}
                    {(!selectedTask.assignees || selectedTask.assignees.length === 0) && <p className="text-xs text-gray-500 italic">No assignees</p>}
                </div>
            </div>

            <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    <FiSearch className="w-5 h-5 text-gray-400" /> Task Description
                </h3>
                <div className="bg-gray-50 rounded-2xl p-6 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {selectedTask.description || "No description provided."}
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                    onClick={() => setIsTaskDetailOpen(false)}
                    className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition font-medium text-sm"
                >
                    Close
                </button>
                <button
                    onClick={() => handleRestore(selectedTask)}
                    className="px-6 py-2.5 bg-black text-white rounded-xl hover:bg-gray-900 transition font-medium text-sm flex items-center gap-2"
                >
                    <MdRestore className="w-4 h-4" /> Restore Task
                </button>
            </div>
        </div>
    );

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loading /></div>;

    return (
        <div className="p-6">
            <LayoutComponents title="Archived Tasks" subtitle="Restore previously deleted tasks" variant="table">
                <div className="max-w-full mx-auto">

                    {/* Header Actions */}
                    <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                            <div className="flex items-center gap-4 flex-1">
                                <button
                                    onClick={() => navigate("/operations/tasks")}
                                    className="p-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition mr-2"
                                >
                                    <MdArrowBack className="w-5 h-5 text-gray-600" />
                                </button>

                                <div className="relative flex-1 max-w-2xl">
                                    <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                                    <input
                                        type="text"
                                        placeholder="Search archived tasks..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black outline-none text-base transition"
                                    />
                                </div>

                                <button
                                    onClick={() => setFiltersOpen(!filtersOpen)}
                                    className="flex items-center gap-3 px-5 py-4 border border-gray-300 rounded-xl hover:bg-gray-50 transition text-sm font-medium whitespace-nowrap"
                                >
                                    <MdFilterList className="w-5 h-5" />
                                    Filters
                                    {activeFilterCount > 0 && (
                                        <span className="ml-2 bg-black text-white text-xs font-medium rounded-full w-6 h-6 flex items-center justify-center">
                                            {activeFilterCount}
                                        </span>
                                    )}
                                    <MdKeyboardArrowDown className={`w-5 h-5 transition-transform ${filtersOpen ? "rotate-180" : ""}`} />
                                </button>

                                <span className="text-sm font-medium text-gray-600 hidden lg:block">
                                    {filteredTasks.length} archived
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Filters Panel */}
                    <AnimatePresence>
                        {filtersOpen && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden mb-6"
                            >
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-xl font-medium text-gray-900">Advanced Filters</h3>
                                        <button onClick={() => setFiltersOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg transition">
                                            <MdClose className="w-6 h-6 text-gray-600" />
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                                        <Input label="Status" type="select" value={filters.status} onChange={(v) => handleFilterChange("status", v)} options={[{ label: "All Statuses", value: "" }, ...statusOptions]} />
                                        <Input label="Project" type="select" value={filters.project} onChange={(v) => handleFilterChange("project", v)} options={[{ label: "All Projects", value: "" }, ...projectsList.map(p => ({ label: p, value: p }))]} />
                                        <Input label="Assignee" type="select" value={filters.assignee} onChange={(v) => handleFilterChange("assignee", v)} options={[{ label: "All Members", value: "" }, ...membersList.map(m => ({ label: m, value: m }))]} />
                                        <Input label="Priority" type="select" value={filters.priority} onChange={(v) => handleFilterChange("priority", v)} options={[{ label: "All Priorities", value: "" }, ...priorityOptions]} />
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-4 mt-8 pt-6 border-t border-gray-200">
                                        <button onClick={resetFilters} className="px-6 py-3.5 border-2 border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition">
                                            Reset All Filters
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Active Tasks Table */}
                    <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1000px]">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">#</th>
                                        <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">Task</th>
                                        <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">Project</th>
                                        <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">Assignees</th>
                                        <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">Due Date</th>
                                        <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">Status</th>
                                        <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filteredTasks.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="text-center py-24">
                                                <div className="flex flex-col items-center">
                                                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-5">
                                                        <MdRestore className="w-10 h-10 text-gray-400" />
                                                    </div>
                                                    <p className="text-xl font-medium text-gray-700">No archived tasks</p>
                                                    <p className="text-gray-500 mt-2">Deleted tasks will appear here</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredTasks.map((task, i) => (
                                            <motion.tr
                                                key={task.id}
                                                initial={{ opacity: 0, y: 15 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.03 }}
                                                className="hover:bg-gray-50 transition"
                                            >
                                                <td className="px-6 py-5 text-sm font-medium text-gray-500 whitespace-nowrap">{i + 1}</td>
                                                <td className="px-6 py-5 whitespace-nowrap">
                                                    <div>
                                                        <span className="font-medium text-gray-500">{task.name}</span>
                                                        {task.priority && (
                                                            <p className="text-[10px] font-medium text-gray-400 uppercase mt-1">{task.priority} Priority</p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 whitespace-nowrap">
                                                    <span className="px-3 py-1 bg-gray-100 text-gray-600 text-[10px] font-medium rounded-lg border border-gray-200 uppercase tracking-wide">
                                                        {task.project_name || "General"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 whitespace-nowrap">{renderAvatars(task.assignees)}</td>
                                                <td className="px-6 py-5 text-sm text-gray-500 whitespace-nowrap">
                                                    {task.due_date ? format(new Date(task.due_date), 'dd MMM') : "—"}
                                                </td>
                                                <td className="px-6 py-5 whitespace-nowrap">
                                                    <span className="text-xs font-medium px-2 py-1 bg-gray-100 rounded text-gray-500 border border-gray-200">
                                                        {statusOptions.find(s => s.value === task.status)?.label || task.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            onClick={() => { setSelectedTask(task); setIsTaskDetailOpen(true); }}
                                                            className="p-2 hover:bg-gray-100 rounded-lg transition"
                                                            title="View Details"
                                                        >
                                                            <MdVisibility className="w-5 h-5 text-gray-500" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleRestore(task)}
                                                            className="p-2 hover:bg-green-50 rounded-lg transition group"
                                                            title="Restore Task"
                                                        >
                                                            <MdRestore className="w-5 h-5 text-gray-500 group-hover:text-green-600" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </LayoutComponents>

            <AnimatePresence>
                {isTaskDetailOpen && (
                    <LayoutComponents
                        title="Archived Task Details"
                        variant="modal"
                        onCloseModal={() => setIsTaskDetailOpen(false)}
                        modal={taskDetailContent}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default TaskArchive;
