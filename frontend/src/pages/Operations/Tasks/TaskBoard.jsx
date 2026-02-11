import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MdFilterList,
  MdClose,
  MdKeyboardArrowDown,
  MdAdd,
  MdCalendarToday,
  MdSearch,
  MdOutlineAccessTime,
} from "react-icons/md";
import { FiSearch } from "react-icons/fi";
import LayoutComponents from "../../../components/LayoutComponents";
import apiClient from "../../../helpers/apiClient";
import Loading from "../../../components/Loading";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { usePermission } from "../../../context/PermissionContext";

const TaskBoardPage = () => {
  const { hasPermission } = usePermission();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);

  // Data for filters
  const [projectsList, setProjectsList] = useState([]);
  const [membersList, setMembersList] = useState([]);

  // Filter States
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    dueDateFrom: "",
    dueDateTo: "",
    project: "",
    assignee: "",
    client: "", // kept if needed, though TaskView doesn't show it explicitly
  });

  const activeFilterCount = Object.values(filters).filter((v) => v !== "").length;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [tasksRes, projectsRes, usersRes] = await Promise.all([
          apiClient.get("/operation/tasks/"),
          apiClient.get("/operation/projects/"),
          apiClient.get("/auth/users/"),
        ]);

        const tasksData = tasksRes.data?.results || tasksRes.data || [];
        const projectsData = projectsRes.data?.results || projectsRes.data || [];
        const usersData = usersRes.data?.results || usersRes.data || [];

        setTasks(tasksData);
        setProjects(projectsData);
        setUsers(usersData);

        // Extract lists for Selects
        setProjectsList(projectsData.map(p => ({ label: p.name, value: p.id })));
        setMembersList(usersData.map(u => ({ label: u.name || u.username, value: u.id })));

      } catch (err) {
        console.error("Failed to fetch data:", err);
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({
      dueDateFrom: "",
      dueDateTo: "",
      project: "",
      assignee: "",
      client: "",
    });
    setSearch("");
  };

  const filteredTasks = useMemo(() => {
    let result = tasks;

    // Search
    if (search.trim()) {
      const term = search.toLowerCase().trim();
      result = result.filter(
        (t) =>
          t.name?.toLowerCase().includes(term) ||
          t.project?.name?.toLowerCase().includes(term) ||
          t.description?.toLowerCase().includes(term)
      );
    }

    // Date Range
    if (filters.dueDateFrom) {
      result = result.filter((t) => t.due_date && new Date(t.due_date) >= new Date(filters.dueDateFrom));
    }
    if (filters.dueDateTo) {
      result = result.filter((t) => t.due_date && new Date(t.due_date) <= new Date(filters.dueDateTo));
    }

    // Project
    if (filters.project) {
      result = result.filter((t) => t.project && String(t.project.id) === String(filters.project));
    }

    // Assignee
    if (filters.assignee) {
      result = result.filter((t) =>
        t.assignees && t.assignees.some(a => String(a.id) === String(filters.assignee))
      );
    }

    return result;
  }, [tasks, search, filters]);

  const tasksByStatus = {
    todo: filteredTasks.filter(t => t.status === "todo"),
    in_progress: filteredTasks.filter(t => t.status === "in_progress"),
    review: filteredTasks.filter(t => t.status === "review"),
    done: filteredTasks.filter(t => t.status === "done"),
  };

  const stats = useMemo(() => ({
    total: tasks.length,
    todo: tasks.filter(t => t.status === "todo").length,
    inProgress: tasks.filter(t => t.status === "in_progress").length,
    review: tasks.filter(t => t.status === "review").length,
    done: tasks.filter(t => t.status === "done").length,
  }), [tasks]);

  const renderAvatars = (assignees = []) => {
    const memberCount = assignees.length;
    if (memberCount === 0) return null;
    return (
      <div className="flex -space-x-2">
        {assignees.slice(0, 3).map((a, i) => {
          const name = a.name || a.username || "Unknown";
          const initial = name[0]?.toUpperCase() || "?";
          return (
            <div key={i} className="w-6 h-6 rounded-full bg-linear-to-br from-blue-500 to-purple-600 border border-white flex items-center justify-center text-white text-[10px] font-medium shadow-xs">
              {initial}
            </div>
          );
        })}
        {memberCount > 3 && (
          <div className="w-6 h-6 rounded-full bg-gray-600 border border-white flex items-center justify-center text-white text-[10px] font-medium shadow-xs">
            +{memberCount - 3}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loading />
      </div>
    );
  }

  return (
    <div className="p-6">
      <LayoutComponents title="Task Board" subtitle="Kanban view of project tasks" variant="table">
        <div className="max-w-full mx-auto">

          {/* Stats Row */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
                <div className="text-center">
                  <div className="text-4xl font-medium text-black mb-2">{stats.total}</div>
                  <p className="text-sm text-gray-600">Total Tasks</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-medium text-blue-600 mb-2">{stats.todo}</div>
                  <p className="text-sm text-gray-600">To Do</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-medium text-cyan-600 mb-2">{stats.inProgress}</div>
                  <p className="text-sm text-gray-600">In Progress</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-medium text-orange-600 mb-2">{stats.review}</div>
                  <p className="text-sm text-gray-600">Review</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-medium text-green-600 mb-2">{stats.done}</div>
                  <p className="text-sm text-gray-600">Done</p>
                </div>
              </div>

              {hasPermission("tasks", "add") && (
                <Link
                  to="/operations/tasks/new-task"
                  className="flex items-center gap-3 px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-900 transition text-sm font-medium"
                >
                  <MdAdd className="w-5 h-5" /> New Task
                </Link>
              )}
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
                      label="Start Date"
                      type="date"
                      value={filters.dueDateFrom}
                      onChange={(e) => handleFilterChange("dueDateFrom", e.target.value)}
                    />
                    <Input
                      label="End Date"
                      type="date"
                      value={filters.dueDateTo}
                      onChange={(e) => handleFilterChange("dueDateTo", e.target.value)}
                    />
                    <Input
                      label="Project"
                      type="select"
                      value={filters.project}
                      onChange={(v) => handleFilterChange("project", v)}
                      options={[{ label: "All Projects", value: "" }, ...projectsList]}
                    />
                    <Input
                      label="Assignee"
                      type="select"
                      value={filters.assignee}
                      onChange={(v) => handleFilterChange("assignee", v)}
                      options={[{ label: "All Members", value: "" }, ...membersList]}
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

          {/* Kanban Board */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

            {/* Columns */}
            {[
              { id: "todo", label: "To Do", styles: { bg: "bg-blue-50", border: "border-blue-100", text: "text-blue-700" }, items: tasksByStatus.todo },
              { id: "in_progress", label: "In Progress", styles: { bg: "bg-purple-50", border: "border-purple-100", text: "text-purple-700" }, items: tasksByStatus.in_progress },
              { id: "review", label: "Review", styles: { bg: "bg-orange-50", border: "border-orange-100", text: "text-orange-700" }, items: tasksByStatus.review },
              { id: "done", label: "Done", styles: { bg: "bg-green-50", border: "border-green-100", text: "text-green-700" }, items: tasksByStatus.done },
            ].map((column) => (
              <div key={column.id} className="flex flex-col h-full">
                <div className={`flex items-center justify-between p-4 mb-4 rounded-xl ${column.styles.bg} border ${column.styles.border}`}>
                  <h3 className={`font-medium ${column.styles.text}`}>{column.label}</h3>
                  <span className={`bg-white px-2 py-1 rounded-lg text-xs font-medium ${column.styles.text} shadow-xs`}>
                    {column.items.length}
                  </span>
                </div>

                <div className="space-y-4 flex-1">
                  {column.items.length === 0 ? (
                    <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl">
                      <p className="text-gray-400 text-sm">No tasks</p>
                    </div>
                  ) : (
                    column.items.map((task, i) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 hover:shadow-md transition-shadow group"
                      >
                        <div className="flex justify-between items-start mb-2">
                          {task.project ? (
                            <span className="px-2 py-1 bg-gray-50 text-gray-600 text-[10px] font-medium rounded-lg uppercase tracking-wider">
                              {task.project.name}
                            </span>
                          ) : <span />}
                          {task.priority && (
                            <span className={`text-[10px] font-medium uppercase ${task.priority === 'critical' ? 'text-red-600' :
                              task.priority === 'high' ? 'text-orange-600' :
                                'text-gray-400'
                              }`}>
                              {task.priority}
                            </span>
                          )}
                        </div>

                        {hasPermission("tasks", "edit") ? (
                          <Link to={`/operations/tasks/edit/${task.id}`}>
                            <h4 className="font-medium text-gray-900 mb-2 leading-snug hover:text-blue-600 transition">
                              {task.name}
                            </h4>
                          </Link>
                        ) : (
                          <h4 className="font-medium text-gray-900 mb-2 leading-snug">
                            {task.name}
                          </h4>
                        )}

                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                            {task.due_date && (
                              <div className="flex items-center gap-1">
                                <MdCalendarToday className="w-3.5 h-3.5" />
                                {new Date(task.due_date).toLocaleDateString("en-GB")}
                              </div>
                            )}
                          </div>
                          {renderAvatars(task.assignees)}
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            ))}

          </div>

        </div>
      </LayoutComponents>
    </div>
  );
};

export default TaskBoardPage;