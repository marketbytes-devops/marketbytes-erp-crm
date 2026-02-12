import React, { useState, useEffect, useMemo } from "react";
import {
  MdClose,
  MdFilterList,
  MdAdd,
  MdKeyboardArrowDown,
  MdPushPin,
  MdDelete,
  MdEdit,
  MdDownload,
  MdVisibility
} from "react-icons/md";
import { FiSearch } from "react-icons/fi";
import { Toaster, toast } from "react-hot-toast";
import apiClient from "../../../helpers/apiClient";
import LayoutComponents from "../../../components/LayoutComponents";
import Input from "../../../components/Input";
import Loading from "../../../components/Loading";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { usePermission } from "../../../context/PermissionContext";

const Scrum = () => {
  const { hasPermission } = usePermission();
  const navigate = useNavigate();
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [pinnedModalOpen, setPinnedModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Data States
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [scrumData, setScrumData] = useState([]);

  // Selection & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [pinnedItems, setPinnedItems] = useState([]);

  const [filters, setFilters] = useState({
    project: "",
    task: "",
    employees: "",
    startDate: "",
    status: "",
  });

  const [formData, setFormData] = useState({
    project: "",
    task: "",
    employeeName: "",
    status: "",
    morning_memo: "",
    evening_memo: "",
    project_name: "",
    task_name: "",
  });

  // Helper to safely extract array from response
  const extractData = (data) => Array.isArray(data) ? data : (data?.results || []);

  const formatScrumItem = (s) => ({
    id: s.id,
    project_id: s.project || "",
    project_name: s.project_name || "—",
    task_id: s.task || "",
    task_name: s.task_name || "—",
    employee_id: s.employee?.id || "",
    employee_name: s.employee_name || "—",
    morning_memo: s.morning_memo || "",
    evening_memo: s.evening_memo || "",
    status: s.reported_status || "todo",
    date: s.date,
  });

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [projRes, empRes, tasksRes, scrumRes] = await Promise.allSettled([
          apiClient.get("/operation/projects/"),
          apiClient.get("/auth/users/"),
          apiClient.get("/operation/tasks/"),
          apiClient.get("/operation/scrum/"),
        ]);

        if (!isMounted) return;

        if (projRes.status === "fulfilled") setProjects(extractData(projRes.value.data));
        if (empRes.status === "fulfilled") setEmployees(extractData(empRes.value.data));
        if (tasksRes.status === "fulfilled") setTasks(extractData(tasksRes.value.data));

        if (scrumRes.status === "fulfilled") {
          const scrumList = extractData(scrumRes.value.data);
          const formatted = scrumList.map(formatScrumItem);
          setScrumData(formatted);
        }
      } catch (err) {
        console.error("Fetch error:", err);
        toast.error("Failed to load data");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();

    // Load pinned items from local storage
    const savedPins = localStorage.getItem("pinnedScrums");
    if (savedPins) setPinnedItems(JSON.parse(savedPins));

    return () => { isMounted = false; };
  }, []);

  // --- Handlers ---

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => {
      const updates = { [field]: value };
      if (field === 'project') {
        const p = projects.find(x => String(x.id) === value);
        updates.project_name = p?.name || "";
      }
      if (field === 'task') {
        const t = tasks.find(x => String(x.id) === value);
        updates.task_name = t?.name || "";
      }
      return { ...prev, ...updates };
    });
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const resetFilters = () => {
    setFilters({ project: "", task: "", employees: "", startDate: "", status: "" });
    setSearchQuery("");
  };

  const togglePin = (id) => {
    const newPins = pinnedItems.includes(id)
      ? pinnedItems.filter(p => p !== id)
      : [...pinnedItems, id];
    setPinnedItems(newPins);
    localStorage.setItem("pinnedScrums", JSON.stringify(newPins));
    toast.success(pinnedItems.includes(id) ? "Unpinned" : "Pinned");
  };

  // --- Actions ---

  const prepareCreate = () => {
    setFormData({
      project: "",
      task: "",
      employeeName: "",
      status: "todo",
      morning_memo: "",
      evening_memo: "",
      project_name: "",
      task_name: "",
    });
    setShowCreateModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.project || !formData.task || !formData.employeeName) {
      toast.error("Please fill required fields");
      return;
    }

    try {
      const payload = {
        task: formData.task,
        employee_id: formData.employeeName,
        reported_status: formData.status,
        morning_memo: formData.morning_memo,
        evening_memo: formData.evening_memo,
        date: new Date().toISOString().split("T")[0],
        project: formData.project
      };

      const response = await apiClient.post("/operation/scrum/", payload);
      toast.success("Scrum created");

      // Optimistic update
      const newItem = formatScrumItem({
        ...response.data,
        project_name: formData.project_name,
        task_name: formData.task_name,
        employee_name: employees.find(e => String(e.id) === String(formData.employeeName))?.name || "User"
      });

      setScrumData(prev => [newItem, ...prev]);
      setShowCreateModal(false);
    } catch (err) {
      console.error(err);
      toast.error("Creation failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Permanently delete this scrum entry?")) return;
    try {
      await apiClient.delete(`/operation/scrum/${id}/`);
      setScrumData(prev => prev.filter(item => item.id !== id));
      toast.success("Deleted successfully");
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  const updateField = async (id, field, value) => {
    // Optimistic update
    const previousData = [...scrumData];
    setScrumData(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));

    try {
      const apiField = field === 'status' ? 'reported_status' : field;
      await apiClient.patch(`/operation/scrum/${id}/`, { [apiField]: value });
      if (field === 'status') toast.success("Status updated");
    } catch (err) {
      setScrumData(previousData); // Revert
      toast.error("Update failed");
    }
  };

  // --- Filtering Logic ---

  const filteredData = useMemo(() => {
    return scrumData.filter(item => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const match =
          item.project_name.toLowerCase().includes(q) ||
          item.task_name.toLowerCase().includes(q) ||
          item.employee_name.toLowerCase().includes(q);
        if (!match) return false;
      }

      if (filters.project && String(item.project_id) !== filters.project) return false;
      if (filters.task && String(item.task_id) !== filters.task) return false;
      if (filters.employees && String(item.employee_id) !== filters.employees) return false;
      if (filters.status && item.status !== filters.status) return false;
      if (filters.startDate && item.date !== filters.startDate) return false;

      return true;
    });
  }, [scrumData, searchQuery, filters]);

  const stats = useMemo(() => ({
    total: filteredData.length,
    todo: filteredData.filter(s => s.status === 'todo').length,
    inProgress: filteredData.filter(s => s.status === 'in_progress').length,
    done: filteredData.filter(s => s.status === 'done').length
  }), [filteredData]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loading /></div>;
  }

  const statusOptions = [
    { value: "todo", label: "To Do" },
    { value: "in_progress", label: "In Progress" },
    { value: "review", label: "Review" },
    { value: "done", label: "Done" },
  ];

  return (
    <div className="p-6">
      <Toaster position="top-right" />
      <LayoutComponents title="Scrum Board" subtitle="Manage daily standups and sprint progress" variant="table">
        <div className="max-w-full mx-auto">

          {/* Stats Row */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div className="text-center">
                  <div className="text-4xl font-medium text-black mb-2">{stats.total}</div>
                  <p className="text-sm text-gray-600">Total Scrums</p>
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

              <div className="flex gap-3">
                {hasPermission("scrum", "add") && (
                  <button
                    onClick={prepareCreate}
                    className="flex items-center gap-3 px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-900 transition text-sm font-medium whitespace-nowrap"
                  >
                    <MdAdd className="w-5 h-5" /> New Scrum
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex items-center gap-4 flex-1">
                <div className="relative flex-1 max-w-2xl">
                  <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search scrums, projects, or tasks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black outline-none text-base transition"
                  />
                </div>

                <button
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="flex items-center gap-3 px-5 py-4 border border-gray-300 rounded-xl hover:bg-gray-50 transition text-sm font-medium whitespace-nowrap"
                >
                  <MdFilterList className="w-5 h-5" />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="ml-2 bg-black text-white text-xs font-medium rounded-full w-6 h-6 flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                  <MdKeyboardArrowDown className={`w-5 h-5 transition-transform ${showAdvancedFilters ? "rotate-180" : ""}`} />
                </button>

                <div className="hidden lg:flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-600">
                    {filteredData.length} records
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setPinnedModalOpen(true)}
                  className="flex items-center gap-2 px-5 py-4 border border-gray-300 rounded-xl hover:bg-gray-50 transition text-sm font-medium"
                >
                  <MdPushPin className="w-5 h-5 text-yellow-600" />
                  Pinned ({pinnedItems.length})
                </button>
                <button className="flex items-center gap-2 px-5 py-4 border border-gray-300 rounded-xl hover:bg-gray-50 transition text-sm font-medium">
                  <MdDownload className="w-5 h-5" /> Export
                </button>
              </div>
            </div>
          </div>

          {/* Advanced Filters Panel */}
          <AnimatePresence>
            {showAdvancedFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mb-6"
              >
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-medium text-gray-900">Advanced Filters</h3>
                    <button onClick={() => setShowAdvancedFilters(false)} className="p-2 hover:bg-gray-100 rounded-lg transition">
                      <MdClose className="w-6 h-6 text-gray-600" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                    <Input label="Status" type="select" value={filters.status} onChange={(v) => handleFilterChange("status", v)}
                      options={[{ label: "All Statuses", value: "" }, ...statusOptions]}
                    />
                    <Input label="Project" type="select" value={filters.project} onChange={(v) => handleFilterChange("project", v)}
                      options={[{ label: "All Projects", value: "" }, ...projects.map(p => ({ label: p.name, value: String(p.id) }))]}
                    />
                    <Input label="Task" type="select" value={filters.task} onChange={(v) => handleFilterChange("task", v)}
                      options={[{ label: "All Tasks", value: "" }, ...tasks.map(t => ({ label: t.name, value: String(t.id) }))]}
                    />
                    <Input label="Employee" type="select" value={filters.employees} onChange={(v) => handleFilterChange("employees", v)}
                      options={[{ label: "All Members", value: "" }, ...employees.map(e => ({ label: [e.first_name || "", e.last_name || ""].join(" ").trim() || e.username || "Unknown", value: String(e.id) }))]}
                    />
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

          {/* Table */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1200px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">Project / Task</th>
                    <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">Employee</th>
                    <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">Date</th>
                    <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap w-1/5">Morning Memo</th>
                    <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap w-1/5">Evening Memo</th>
                    <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">Status</th>
                    <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-24">
                        <div className="flex flex-col items-center">
                          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-5">
                            <MdFilterList className="w-10 h-10 text-gray-400" />
                          </div>
                          <p className="text-xl font-medium text-gray-700">No scrums found</p>
                          <p className="text-gray-500 mt-2">Try adjusting your search or filters</p>
                          {(searchQuery || activeFilterCount > 0) && (
                            <button onClick={resetFilters} className="mt-5 px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-900 transition font-medium">
                              Clear all filters
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((item, i) => (
                      <motion.tr
                        key={item.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="hover:bg-gray-50 transition group"
                      >
                        <td className="px-6 py-5">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              {pinnedItems.includes(item.id) && <MdPushPin className="w-3 h-3 text-orange-500" />}
                              <span className="font-medium text-gray-900 truncate max-w-[200px]" title={item.project_name}>{item.project_name}</span>
                            </div>
                            <span className="text-xs text-gray-500 mt-1 truncate max-w-[200px]" title={item.task_name}>{item.task_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium whitespace-nowrap">
                              {item.employee_name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm text-gray-700 font-medium whitespace-nowrap">{item.employee_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-sm text-gray-700 whitespace-nowrap">
                          {item.date ? new Date(item.date).toLocaleDateString() : "—"}
                        </td>
                        <td className="px-6 py-5">
                          <p className="text-sm text-gray-600 line-clamp-2" title={item.morning_memo}>{item.morning_memo || "—"}</p>
                        </td>
                        <td className="px-6 py-5">
                          <textarea
                            className={`w-full text-sm bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:bg-white focus:outline-none transition-colors resize-none overflow-hidden h-8 focus:h-20 ${!hasPermission("scrum", "edit") ? "opacity-50 cursor-not-allowed" : ""}`}
                            placeholder={hasPermission("scrum", "edit") ? "Add memo..." : "No memo"}
                            defaultValue={item.evening_memo}
                            readOnly={!hasPermission("scrum", "edit")}
                            onBlur={(e) => {
                              if (e.target.value !== item.evening_memo && hasPermission("scrum", "edit")) {
                                updateField(item.id, 'evening_memo', e.target.value);
                              }
                            }}
                          />
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap min-w-[180px]">
                          <Input
                            type="select"
                            value={item.status}
                            onChange={(v) => updateField(item.id, 'status', v)}
                            options={statusOptions}
                            className="text-xs font-medium"
                            disabled={!hasPermission("scrum", "edit")}
                          />
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="flex items-center justify-end gap-3">
                            {hasPermission("scrum", "edit") && (
                              <button onClick={() => navigate(`/operations/scrum/edit/${item.id}`)} className="p-2 hover:bg-amber-50 rounded-lg transition group">
                                <MdEdit className="w-5 h-5 text-gray-600 group-hover:text-amber-600" />
                              </button>
                            )}
                            <button onClick={() => togglePin(item.id)} className="p-2 hover:bg-yellow-50 rounded-lg transition group">
                              <MdPushPin className={`w-5 h-5 ${pinnedItems.includes(item.id) ? 'text-yellow-600' : 'text-gray-600'} group-hover:text-yellow-600`} />
                            </button>
                            {hasPermission("scrum", "delete") && (
                              <button onClick={() => handleDelete(item.id)} className="p-2 hover:bg-red-50 rounded-lg transition group">
                                <MdDelete className="w-5 h-5 text-gray-600 group-hover:text-red-600" />
                              </button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {filteredData.length > 0 && (
              <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-3 text-sm text-gray-600">
                <span>Showing {filteredData.length} entries</span>
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

      {/* PINNED MODAL */}
      <AnimatePresence>
        {pinnedModalOpen && (
          <LayoutComponents
            title={`Pinned Scrums (${pinnedItems.length})`}
            variant="modal"
            onCloseModal={() => setPinnedModalOpen(false)}
            modal={
              <div className="space-y-4">
                {pinnedItems.length === 0 ? (
                  <p className="text-center py-10 text-gray-500 italic">No pinned scrums yet.</p>
                ) : (
                  scrumData.filter(i => pinnedItems.includes(i.id)).map(item => (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-white transition group shadow-xs">
                      <div className="overflow-hidden">
                        <p className="font-medium text-gray-900 truncate">{item.project_name}</p>
                        <p className="text-[10px] font-medium text-gray-400 uppercase">{item.task_name || "Task"}</p>
                      </div>
                      <div className="flex gap-2">
                        {hasPermission("scrum", "edit") && (
                          <button
                            onClick={() => {
                              setPinnedModalOpen(false);
                              navigate(`/operations/scrum/edit/${item.id}`);
                            }}
                            className="p-3 bg-white text-amber-600 rounded-xl shadow-xs hover:bg-amber-600 hover:text-white transition"
                          >
                            <MdEdit className="w-5 h-5" />
                          </button>
                        )}
                        <button
                          onClick={() => togglePin(item.id)}
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

      {/* CREATE MODAL ONLY */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-xl font-medium text-gray-900">New Scrum</h3>
                <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <MdClose className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                <Input label="Project" type="select" value={formData.project} onChange={(v) => handleFormChange("project", v)}
                  options={[{ label: "Select Project", value: "" }, ...projects.map(p => ({ label: p.name, value: String(p.id) }))]}
                />

                <div className="grid grid-cols-2 gap-5">
                  <Input label="Task" type="select" value={formData.task} onChange={(v) => handleFormChange("task", v)}
                    options={[{ label: "Select Task", value: "" }, ...tasks.map(t => ({ label: t.name, value: String(t.id) }))]}
                  />
                  <Input label="Status" type="select" value={formData.status} onChange={(v) => handleFormChange("status", v)}
                    options={statusOptions}
                  />
                </div>

                <Input label="Employee" type="select" value={formData.employeeName} onChange={(v) => handleFormChange("employeeName", v)}
                  options={[
                    { label: "Select Employee", value: "" },
                    ...employees.map(e => ({
                      label: [e.first_name || "", e.last_name || ""].join(" ").trim() || e.username || "Unknown",
                      value: String(e.id),
                    }))
                  ]}
                />

                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700 uppercase tracking-wide ml-1">Morning Memo</label>
                  <textarea
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black outline-none text-sm transition resize-none"
                    placeholder="Plan for the day..."
                    value={formData.morning_memo}
                    onChange={(e) => handleFormChange("morning_memo", e.target.value)}
                  />
                </div>
              </div>

              <div className="px-6 py-5 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                <button onClick={() => setShowCreateModal(false)} className="px-5 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-white transition">
                  Cancel
                </button>
                <button onClick={handleSubmit} className="px-6 py-2.5 bg-black text-white font-medium rounded-xl hover:bg-gray-900 transition shadow-lg">
                  Create Scrum
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Scrum;