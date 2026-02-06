import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MdFilterList,
  MdClose,
  MdKeyboardArrowDown,
  MdDownload,
  MdAdd,
  MdEdit,
  MdDelete,
  MdVisibility,
  MdPushPin,
  MdWarning,
  MdCalendarToday,
  MdGroup,
  MdOutlineAccessTime,
} from "react-icons/md";
import { FiSearch, FiCheck } from "react-icons/fi";
import LayoutComponents from "../../../components/LayoutComponents";
import { useNavigate, useLocation, Link } from "react-router-dom";
import apiClient from "../../../helpers/apiClient";
import Loading from "../../../components/Loading";
import toast from "react-hot-toast";
import Input from "../../../components/Input";

const TasksPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [pinnedTasks, setPinnedTasks] = useState([]);
  const [isPinnedModalOpen, setIsPinnedModalOpen] = useState(false);
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
      const response = await apiClient.get("/operation/tasks/");
      const data = Array.isArray(response.data) ? response.data : response.data.results || [];
      setTasks(data);
      setFilteredTasks(data);

      // Extract unique projects and members for filters
      const projs = [...new Set(data.map(t => t.project_name).filter(Boolean))].sort();
      const members = [...new Set(data.flatMap(t => (t.assignees || []).map(a => a.name || a.username)).filter(Boolean))].sort();

      setProjectsList(projs);
      setMembersList(members);
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [location.state?.refetch]);

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

    if (filters.status) {
      result = result.filter((t) => t.status === filters.status);
    }

    if (filters.project) {
      result = result.filter((t) => t.project_name === filters.project);
    }

    if (filters.assignee) {
      result = result.filter((t) =>
        t.assignees?.some((a) => (a.name || a.username) === filters.assignee)
      );
    }

    if (filters.priority) {
      result = result.filter((t) => t.priority === filters.priority);
    }

    setFilteredTasks(result);
  }, [search, filters, tasks]);

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await apiClient.patch(`/operation/tasks/${taskId}/`, { status: newStatus });
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
      toast.success("Status updated");
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const togglePinTask = (task) => {
    const isPinned = pinnedTasks.some((t) => t.id === task.id);
    if (isPinned) {
      setPinnedTasks((prev) => prev.filter((t) => t.id !== task.id));
      toast.success("Task unpinned");
    } else {
      setPinnedTasks((prev) => [...prev, task]);
      toast.success("Task pinned");
    }
  };

  const renderAvatars = (assignees = []) => {
    const memberCount = assignees.length;
    if (memberCount === 0) return <span className="text-sm text-gray-500">—</span>;
    return (
      <div className="flex -space-x-2">
        {assignees.slice(0, 3).map((a, i) => {
          const name = a.name || a.username || "Unknown";
          const initial = name[0]?.toUpperCase() || "?";
          return (
            <div key={i} className="relative group">
              <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-purple-600 border-2 border-white flex items-center justify-center text-white text-sm font-medium shadow-md">
                {initial}
              </div>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-black text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                {name}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-black"></div>
              </div>
            </div>
          );
        })}
        {memberCount > 3 && (
          <div className="w-10 h-10 rounded-full bg-gray-600 border-2 border-white flex items-center justify-center text-white text-sm font-medium shadow-md">
            +{memberCount - 3}
          </div>
        )}
      </div>
    );
  };

  const stats = useMemo(() => ({
    total: tasks.length,
    todo: tasks.filter(t => t.status === "todo").length,
    inProgress: tasks.filter(t => t.status === "in_progress").length,
    done: tasks.filter(t => t.status === "done").length,
  }), [tasks]);

  const taskDetailContent = selectedTask && (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-medium text-gray-900 mb-1">{selectedTask.name}</h2>
          <p className="text-sm font-medium text-gray-500">{selectedTask.project_name || "No Project"}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => togglePinTask(selectedTask)}
            className={`p-2 rounded-xl transition ${pinnedTasks.some(p => p.id === selectedTask.id) ? 'bg-yellow-50 text-yellow-600' : 'bg-gray-50 text-gray-400 hover:text-black'}`}
          >
            <MdPushPin className="w-6 h-6" />
          </button>
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
            {selectedTask.due_date ? new Date(selectedTask.due_date).toLocaleDateString("en-GB") : "—"}
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
              <div className="w-6 h-6 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-medium">
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
        <Link
          to={`/operations/tasks/edit/${selectedTask.id}`}
          className="px-6 py-2.5 bg-black text-white rounded-xl hover:bg-gray-900 transition font-medium text-sm flex items-center gap-2"
        >
          <MdEdit className="w-4 h-4" /> Edit Task
        </Link>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loading />
      </div>
    );
  }

  return (
    <div className="p-6">
      <LayoutComponents title="Tasks" subtitle="Manage and track project tasks" variant="table">
        <div className="max-w-full mx-auto">
          {/* Stats Row */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div className="text-center">
                  <div className="text-4xl font-medium text-black mb-2">{stats.total}</div>
                  <p className="text-sm text-gray-600">Total Tasks</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-medium text-blue-600 mb-2">{stats.todo}</div>
                  <p className="text-sm text-gray-600">To Do</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-medium text-amber-600 mb-2">{stats.inProgress}</div>
                  <p className="text-sm text-gray-600">In Progress</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-medium text-green-600 mb-2">{stats.done}</div>
                  <p className="text-sm text-gray-600">Completed</p>
                </div>
              </div>
              <Link
                to="/operations/tasks/newtask"
                className="flex items-center gap-3 px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-900 transition text-sm font-medium"
              >
                <MdAdd className="w-5 h-5" /> New Task
              </Link>
            </div>
          </div>

          {/* Search & Filters Bar */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex items-center gap-4 flex-1">
                <div className="relative flex-1 max-w-2xl">
                  <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search tasks, projects, or team..."
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
                  <MdKeyboardArrowDown
                    className={`w-5 h-5 transition-transform ${filtersOpen ? "rotate-180" : ""}`}
                  />
                </button>

                <span className="text-sm font-medium text-gray-600 hidden lg:block">
                  {filteredTasks.length} {filteredTasks.length === 1 ? "task" : "tasks"}
                </span>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setIsPinnedModalOpen(true)}
                  className="flex items-center gap-2 px-5 py-4 border border-gray-300 rounded-xl hover:bg-gray-50 transition text-sm font-medium"
                >
                  <MdPushPin className="w-5 h-5 text-yellow-600" />
                  Pinned ({pinnedTasks.length})
                </button>
                <button
                  onClick={() => navigate("/operations/tasks/archive")}
                  className="px-5 py-4 border border-gray-300 rounded-xl hover:bg-gray-50 transition text-sm font-medium"
                >
                  View Archive
                </button>
                <button className="flex items-center gap-2 px-5 py-4 border border-gray-300 rounded-xl hover:bg-gray-50 transition text-sm font-medium">
                  <MdDownload className="w-5 h-5" /> Export
                </button>
              </div>
            </div>
          </div>

          {/* Advanced Filters Panel */}
          <AnimatePresence>
            {filtersOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden mb-6"
              >
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-medium text-gray-900">Advanced Filters</h3>
                    <button
                      onClick={() => setFiltersOpen(false)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition"
                    >
                      <MdClose className="w-6 h-6 text-gray-600" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                    <Input
                      label="Status"
                      type="select"
                      value={filters.status}
                      onChange={(v) => handleFilterChange("status", v)}
                      options={[{ label: "All Statuses", value: "" }, ...statusOptions]}
                    />
                    <Input
                      label="Project"
                      type="select"
                      value={filters.project}
                      onChange={(v) => handleFilterChange("project", v)}
                      options={[{ label: "All Projects", value: "" }, ...projectsList.map(p => ({ label: p, value: p }))]}
                    />
                    <Input
                      label="Assignee"
                      type="select"
                      value={filters.assignee}
                      onChange={(v) => handleFilterChange("assignee", v)}
                      options={[{ label: "All Members", value: "" }, ...membersList.map(m => ({ label: m, value: m }))]}
                    />
                    <Input
                      label="Priority"
                      type="select"
                      value={filters.priority}
                      onChange={(v) => handleFilterChange("priority", v)}
                      options={[{ label: "All Priorities", value: "" }, ...priorityOptions]}
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 mt-8 pt-6 border-t border-gray-200">
                    <button
                      onClick={resetFilters}
                      className="px-6 py-3.5 border-2 border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition"
                    >
                      Reset All Filters
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tasks Table */}
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
                            <MdFilterList className="w-10 h-10 text-gray-400" />
                          </div>
                          <p className="text-xl font-medium text-gray-700">No tasks found</p>
                          <p className="text-gray-500 mt-2">Try adjusting your search or filters</p>
                          {(search || activeFilterCount > 0) && (
                            <button
                              onClick={resetFilters}
                              className="mt-5 px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-900 transition font-medium"
                            >
                              Clear all filters
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredTasks.map((task, i) => {
                      const isPinned = pinnedTasks.some((t) => t.id === task.id);
                      return (
                        <motion.tr
                          key={task.id}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className="hover:bg-gray-50 transition"
                        >
                          <td className="px-6 py-5 text-sm font-medium text-gray-900 whitespace-nowrap">
                            {i + 1}
                            {isPinned && <MdPushPin className="inline ml-2 text-yellow-600" />}
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap">
                            <div>
                              <button
                                onClick={() => {
                                  setSelectedTask(task);
                                  setIsTaskDetailOpen(true);
                                }}
                                className="font-medium text-gray-900 hover:text-blue-600 transition text-left"
                              >
                                {task.name}
                              </button>
                              {task.priority && (
                                <p className={`text-[10px] font-medium uppercase mt-1 ${task.priority === 'high' || task.priority === 'critical' ? 'text-red-600' : 'text-gray-500'}`}>
                                  {task.priority} Priority
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap">
                            <span className="px-3 py-1 bg-purple-50 text-purple-700 text-[10px] font-medium rounded-lg border border-purple-100 uppercase tracking-wide">
                              {task.project_name || "General"}
                            </span>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap">{renderAvatars(task.assignees)}</td>
                          <td className="px-6 py-5 text-sm text-gray-700 whitespace-nowrap">
                            {task.due_date ? new Date(task.due_date).toLocaleDateString("en-GB") : "No due date"}
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap min-w-[180px]">
                            <Input
                              type="select"
                              value={task.status}
                              onChange={(val) => handleStatusChange(task.id, val)}
                              options={statusOptions}
                              className="text-xs font-medium"
                            />
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap">
                            <div className="flex items-center justify-end gap-3">
                              <button
                                onClick={() => {
                                  setSelectedTask(task);
                                  setIsTaskDetailOpen(true);
                                }}
                                className="p-2 hover:bg-blue-50 rounded-lg transition group"
                              >
                                <MdVisibility className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
                              </button>
                              <Link
                                to={`/operations/tasks/edit/${task.id}`}
                                className="p-2 hover:bg-amber-50 rounded-lg transition group"
                              >
                                <MdEdit className="w-5 h-5 text-gray-600 group-hover:text-amber-600" />
                              </Link>
                              <button
                                onClick={() => togglePinTask(task)}
                                className="p-2 hover:bg-yellow-50 rounded-lg transition group"
                              >
                                <MdPushPin
                                  className={`w-5 h-5 ${isPinned ? "text-yellow-600" : "text-gray-600"
                                    } group-hover:text-yellow-600`}
                                />
                              </button>
                              <button
                                onClick={async () => {
                                  if (window.confirm("Permanently delete this task?")) {
                                    try {
                                      await apiClient.delete(`/operation/tasks/${task.id}/`);
                                      toast.success("Task deleted");
                                      fetchTasks();
                                    } catch (err) { toast.error("Delete failed"); }
                                  }
                                }}
                                className="p-2 hover:bg-red-50 rounded-lg transition group"
                              >
                                <MdDelete className="w-5 h-5 text-gray-600 group-hover:text-red-600" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {filteredTasks.length > 0 && (
              <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-3 text-sm text-gray-600">
                <span>Showing {filteredTasks.length} of {tasks.length} tasks</span>
                {activeFilterCount > 0 && (
                  <button onClick={resetFilters} className="text-blue-600 hover:text-blue-800 font-medium">
                    Clear all filters
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </LayoutComponents>

      {/* Modals */}
      <AnimatePresence>
        {isPinnedModalOpen && (
          <LayoutComponents
            title={`Pinned Tasks (${pinnedTasks.length})`}
            variant="modal"
            onCloseModal={() => setIsPinnedModalOpen(false)}
            modal={
              <div className="space-y-4">
                {pinnedTasks.length === 0 ? (
                  <p className="text-center py-10 text-gray-500 italic">No pinned tasks yet.</p>
                ) : (
                  pinnedTasks.map(task => (
                    <div key={task.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-white transition group shadow-xs">
                      <div className="overflow-hidden">
                        <p className="font-medium text-gray-900 truncate">{task.name}</p>
                        <p className="text-[10px] font-medium text-gray-400 uppercase">{task.project_name || "Project"}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedTask(task);
                            setIsTaskDetailOpen(true);
                            setIsPinnedModalOpen(false);
                          }}
                          className="p-3 bg-white text-blue-600 rounded-xl shadow-xs hover:bg-blue-600 hover:text-white transition"
                        >
                          <MdVisibility className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => togglePinTask(task)}
                          className="p-3 bg-white text-red-600 rounded-xl shadow-xs hover:bg-red-600 hover:text-white transition"
                        >
                          <MdClose className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            }
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isTaskDetailOpen && (
          <LayoutComponents
            title="Task Details"
            variant="modal"
            onCloseModal={() => setIsTaskDetailOpen(false)}
            modal={taskDetailContent}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default TasksPage;