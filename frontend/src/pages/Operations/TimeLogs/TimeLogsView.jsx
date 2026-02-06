import React, { useState, useEffect, useMemo } from 'react';
import LayoutComponents from '../../../components/LayoutComponents';
import {
  MdFilterList,
  MdClose,
  MdKeyboardArrowDown,
  MdDownload,
  MdAdd,
  MdTimer,
  MdCalendarToday,
  MdPerson,
  MdEdit,
  MdDelete,
  MdVisibility
} from 'react-icons/md';
import { FiSearch } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import Input from '../../../components/Input';
import { Link } from "react-router-dom";
import apiClient from "../../../helpers/apiClient";
import toast from "react-hot-toast";
import Loading from "../../../components/Loading";

const TimeLogs = () => {
  const [loading, setLoading] = useState(true);
  const [timeEntries, setTimeEntries] = useState([]);
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Data for filters
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);

  // Filter states
  const [filters, setFilters] = useState({
    project: "",
    task: "",
    employee: "",
    status: "",
    startDate: "",
    endDate: ""
  });

  const [selectedEntry, setSelectedEntry] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({
      project: "",
      task: "",
      employee: "",
      status: "",
      startDate: "",
      endDate: ""
    });
    setSearch("");
  };

  const [viewMode, setViewMode] = useState("daily"); // "daily" or "detailed"
  const [detailedEntries, setDetailedEntries] = useState([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [attendanceRes, sessionRes, projectsRes, tasksRes, employeesRes] = await Promise.all([
        apiClient.get('/hr/attendance/'),
        apiClient.get('/hr/work-sessions/'),
        apiClient.get('/operation/projects/'),
        apiClient.get('/operation/tasks/'),
        apiClient.get('/auth/users/')
      ]);

      const extract = (d) => (Array.isArray(d) ? d : d.results || []);

      setTimeEntries(extract(attendanceRes.data));
      setDetailedEntries(extract(sessionRes.data));
      setProjects(extract(projectsRes.data));
      setTasks(extract(tasksRes.data));
      setEmployees(extract(employeesRes.data));
    } catch (err) {
      console.error(err);
      toast.error("Failed to load time logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this log?")) return;
    try {
      const endpoint = viewMode === "daily" ? `/hr/attendance/${id}/` : `/hr/work-sessions/${id}/`;
      await apiClient.delete(endpoint);
      toast.success("Log deleted successfully");
      fetchData();
    } catch (err) {
      toast.error("Failed to delete log");
    }
  };

  const handleView = (entry) => {
    setSelectedEntry(entry);
    setIsViewModalOpen(true);
  };

  const filteredEntries = useMemo(() => {
    let result = viewMode === "daily" ? timeEntries : detailedEntries;

    if (search.trim()) {
      const term = search.toLowerCase();
      if (viewMode === "daily") {
        result = result.filter(entry =>
          (entry.tasks?.toLowerCase().includes(term)) ||
          (entry.employee?.name?.toLowerCase().includes(term)) ||
          (entry.projects?.toLowerCase().includes(term)) ||
          (entry.date?.includes(term))
        );
      } else {
        result = result.filter(entry =>
          (entry.task_name?.toLowerCase().includes(term)) ||
          (entry.employee?.name?.toLowerCase().includes(term)) ||
          (entry.project_name?.toLowerCase().includes(term)) ||
          (entry.memo?.toLowerCase().includes(term))
        );
      }
    }

    if (filters.employee) {
      result = result.filter(entry => entry.employee?.id === parseInt(filters.employee));
    }

    if (filters.project) {
      if (viewMode === "daily") {
        const projectName = projects.find(p => p.id === parseInt(filters.project))?.name?.toLowerCase();
        if (projectName) result = result.filter(entry => entry.projects?.toLowerCase().includes(projectName));
      } else {
        result = result.filter(entry => entry.project === parseInt(filters.project));
      }
    }

    return result;
  }, [timeEntries, detailedEntries, search, filters, projects, viewMode]);

  const stats = useMemo(() => {
    const activeData = filteredEntries;
    return {
      total: activeData.length,
      productive: activeData.reduce((acc, curr) => acc + parseFloat(curr.productive_hours || 0), 0).toFixed(1),
      billable: activeData.filter(e => e.is_billable).length,
      totalHours: activeData.reduce((acc, curr) => acc + parseFloat(curr.total_hours || 0), 0).toFixed(1),
    };
  }, [filteredEntries]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "Running...";
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-white"><Loading /></div>;
  }

  return (
    <div className="p-6">
      <LayoutComponents
        title="Time Logs"
        subtitle="Manage and analyze employee operational time distribution"
        variant="table"
      >
        {/* Navigation & Action Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 flex-1">
              <div className="text-center">
                <div className="text-4xl font-medium text-black mb-2">{stats.total}</div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Entries</p>
              </div>
              <div className="text-center border-x border-gray-50">
                <div className="text-4xl font-medium text-black mb-2">{stats.productive}h</div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Productive</p>
              </div>
              <div className="text-center border-r border-gray-50">
                <div className="text-4xl font-medium text-black mb-2">{stats.billable}</div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Billable</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-medium text-black mb-2">{stats.totalHours}h</div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Hours</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <Link to="/operations/time-logs/active-timers">
                <button className="flex items-center gap-3 px-6 py-4 bg-white border-2 border-black text-black rounded-xl hover:bg-black hover:text-white transition-all font-bold text-xs uppercase tracking-widest active:scale-95 shadow-xs">
                  <MdTimer className="w-5 h-5" /> Active Nodes
                </button>
              </Link>
              <button className="flex items-center gap-3 px-6 py-4 bg-black text-white rounded-xl hover:opacity-90 transition-all font-bold text-xs uppercase tracking-widest active:scale-95 shadow-xl">
                <MdAdd className="w-5 h-5" /> New Log
              </button>
            </div>
          </div>
        </div>

        {/* View Mode & Secondary Links */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-1 bg-gray-50 p-1.5 rounded-2xl border border-gray-100 shadow-inner">
            <button
              onClick={() => setViewMode("daily")}
              className={`px-8 py-3 rounded-xl text-xs font-bold transition-all duration-300 ${viewMode === "daily"
                ? "bg-white text-black shadow-md"
                : "text-gray-400 hover:text-gray-800"
                }`}
            >
              Daily Summary
            </button>
            <button
              onClick={() => setViewMode("detailed")}
              className={`px-8 py-3 rounded-xl text-xs font-bold transition-all duration-300 ${viewMode === "detailed"
                ? "bg-white text-black shadow-md"
                : "text-gray-400 hover:text-gray-800"
                }`}
            >
              Detailed Thread
            </button>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/operations/time-logs/calendar-view" className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-100 text-gray-800 rounded-xl hover:border-black transition-all font-bold text-[10px] uppercase tracking-widest">
              <MdCalendarToday className="w-4 h-4" /> Calendar
            </Link>
            <Link to="/operations/time-logs/emplyees-time" className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-100 text-gray-800 rounded-xl hover:border-black transition-all font-bold text-[10px] uppercase tracking-widest">
              <MdPerson className="w-4 h-4" /> Associate Registry
            </Link>
          </div>
        </div>

        {/* Search & Utility Bar */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-gray-100">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-2xl group">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-black transition-colors" />
                <input
                  type="text"
                  placeholder={viewMode === "daily" ? "Filter by task, employee, or date..." : "Search granular history thread..."}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none transition-all text-sm font-medium text-gray-800"
                />
              </div>

              <button
                onClick={() => setFiltersOpen(!filtersOpen)}
                className="flex items-center gap-3 px-6 py-4 bg-white border border-gray-200 rounded-xl hover:border-black transition-all font-bold text-xs uppercase tracking-widest text-gray-600"
              >
                <MdFilterList className="w-5 h-5" />
                Parameters
                {activeFilterCount > 0 && (
                  <span className="ml-2 bg-black text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
                <MdKeyboardArrowDown className={`w-5 h-5 transition-transform ${filtersOpen ? "rotate-180" : ""}`} />
              </button>
            </div>

            <button className="flex items-center gap-3 px-6 py-4 bg-white border border-gray-200 rounded-xl hover:bg-black hover:text-white transition-all font-bold text-xs uppercase tracking-widest text-gray-600">
              <MdDownload className="w-5 h-5" /> Export Data
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        <AnimatePresence>
          {filtersOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-6"
            >
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-medium text-gray-900">Advanced Parameters</h3>
                  <button onClick={() => setFiltersOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg transition">
                    <MdClose className="w-6 h-6 text-gray-600" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <Input
                    label="Project"
                    type="select"
                    value={filters.project}
                    onChange={(v) => handleFilterChange("project", v)}
                    options={[
                      { label: "All Projects", value: "" },
                      ...projects.map(p => ({ label: p.name, value: p.id.toString() }))
                    ]}
                  />
                  <Input
                    label="Employee"
                    type="select"
                    value={filters.employee}
                    onChange={(v) => handleFilterChange("employee", v)}
                    options={[
                      { label: "All Employees", value: "" },
                      ...employees.map(e => ({ label: e.name || e.email, value: e.id.toString() }))
                    ]}
                  />
                  <Input
                    label="Verification"
                    type="select"
                    value={filters.status}
                    onChange={(v) => handleFilterChange("status", v)}
                    options={[
                      { label: "All Logs", value: "" },
                      { label: "Verified", value: "approved" },
                      { label: "Pending", value: "pending" },
                    ]}
                  />
                </div>

                <div className="flex justify-end mt-8 pt-8 border-t border-gray-100">
                  <button
                    onClick={resetFilters}
                    className="px-8 py-3.5 border-2 border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition uppercase text-[10px] tracking-widest"
                  >
                    Clear All Filters
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Table Container */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-8 py-5 text-left text-[11px] font-bold text-gray-600 uppercase tracking-[0.2em] whitespace-nowrap">ID</th>
                  <th className="px-8 py-5 text-left text-[11px] font-bold text-gray-600 uppercase tracking-[0.2em] whitespace-nowrap">Operational Node</th>
                  <th className="px-8 py-5 text-left text-[11px] font-bold text-gray-600 uppercase tracking-[0.2em] whitespace-nowrap">Associate</th>
                  <th className="px-8 py-5 text-left text-[11px] font-bold text-gray-600 uppercase tracking-[0.2em] whitespace-nowrap">Initialization</th>
                  <th className="px-8 py-5 text-left text-[11px] font-bold text-gray-600 uppercase tracking-[0.2em] whitespace-nowrap">Termination</th>
                  <th className="px-8 py-5 text-left text-[11px] font-bold text-gray-600 uppercase tracking-[0.2em] whitespace-nowrap">Yield Rate</th>
                  <th className="px-8 py-5 text-left text-[11px] font-bold text-gray-600 uppercase tracking-[0.2em] whitespace-nowrap">Log Status</th>
                  <th className="px-8 py-5 text-right text-[11px] font-bold text-gray-600 uppercase tracking-[0.2em] whitespace-nowrap">Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-8 py-32 text-center text-gray-400">
                      <div className="flex flex-col items-center">
                        <MdTimer className="w-12 h-12 mb-4 opacity-20" />
                        <p className="text-xl font-medium text-gray-500">Zero operational logs recorded</p>
                        <p className="text-xs font-bold uppercase tracking-widest mt-2">Adjust search parameters to intercept data</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map((entry, i) => (
                    <motion.tr
                      key={entry.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="hover:bg-gray-50/50 transition-all duration-200 group border-l-4 border-transparent hover:border-black"
                    >
                      <td className="px-8 py-6 text-xs font-bold text-gray-400 whitespace-nowrap">#{entry.id}</td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-gray-900 line-clamp-1">
                            {viewMode === "daily" ? entry.tasks : (entry.task_name || "Internal Mission")}
                          </span>
                          <span className="text-[10px] text-gray-400 uppercase font-black tracking-tight mt-0.5">
                            {viewMode === "daily" ? entry.projects : (entry.project_name || "Internal Hub")}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center text-[11px] font-black group-hover:scale-110 transition-transform">
                            {entry.employee?.name?.[0]?.toUpperCase() || "N"}
                          </div>
                          <span className="text-[13px] font-bold text-gray-800">{entry.employee?.name || entry.employee?.email}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-sm text-gray-700 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-400 text-[10px] uppercase">
                            {formatDate(viewMode === "daily" ? entry.date : entry.start_time)}
                          </span>
                          <span className="font-black text-blue-600 uppercase text-[11px]">
                            {viewMode === "daily" ? (entry.first_clock_in || "N/A") : formatTime(entry.start_time)}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-sm text-gray-700 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-400 text-[10px] uppercase">
                            {formatDate(viewMode === "daily" ? entry.date : (entry.end_time || entry.start_time))}
                          </span>
                          <span className="font-black text-amber-600 uppercase text-[11px]">
                            {viewMode === "daily" ? (entry.last_clock_out || "Active") : formatTime(entry.end_time)}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-[16px] font-black text-black tabular-nums">{entry.total_hours}h</span>
                          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Yielded Time</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        {entry.is_billable ? (
                          <span className="px-4 py-1.5 bg-black text-white rounded-lg text-[9px] font-black uppercase tracking-widest border border-black shadow-lg">Billable Node</span>
                        ) : (
                          <span className="px-4 py-1.5 bg-white text-gray-400 rounded-lg text-[9px] font-black uppercase tracking-widest border border-gray-100 shadow-xs">Internal Node</span>
                        )}
                      </td>
                      <td className="px-8 py-6 text-right whitespace-nowrap">
                        <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                          {viewMode === "daily" && (
                            <button
                              onClick={() => handleView(entry)}
                              className="p-3 bg-white border border-gray-100 text-gray-400 rounded-xl hover:text-blue-600 hover:shadow-lg transition-all scale-90 hover:scale-100"
                              title="Detailed Analysis"
                            >
                              <MdVisibility className="w-5 h-5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(entry.id)}
                            className="p-3 bg-white border border-gray-100 text-gray-400 rounded-xl hover:text-red-600 hover:shadow-lg transition-all scale-90 hover:scale-100"
                            title="Purge Log"
                          >
                            <MdDelete className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {filteredEntries.length > 0 && (
            <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex justify-between items-center text-[11px] font-bold text-gray-400 uppercase tracking-widest">
              <span>Showing {filteredEntries.length} of {viewMode === "daily" ? timeEntries.length : detailedEntries.length} operational segments</span>
              <div className="flex items-center gap-8">
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  Aggregate Productive: {stats.productive}h
                </span>
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-black rounded-full"></div>
                  Total Resource Allocation: {stats.totalHours}h
                </span>
              </div>
            </div>
          )}
        </div>
      </LayoutComponents>

      {/* Detailed Modal */}
      <AnimatePresence>
        {isViewModalOpen && selectedEntry && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="bg-white rounded-4xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-10 border-b border-gray-100 flex justify-between items-center">
                <div>
                  <h2 className="text-[28px] font-black uppercase tracking-tighter text-black">Section Analysis</h2>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-1">Operational Timeline: {formatDate(selectedEntry.date)}</p>
                </div>
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="p-3 bg-gray-50 border border-transparent hover:border-black rounded-2xl transition-all text-gray-400 hover:text-black"
                >
                  <MdClose className="w-6 h-6" />
                </button>
              </div>

              <div className="p-10 max-h-[70vh] overflow-y-auto space-y-12">
                <div className="grid grid-cols-2 gap-8">
                  <div className="bg-black p-8 rounded-3xl text-white shadow-2xl shadow-black/10">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Associate Node</p>
                    <p className="text-xl font-black">{selectedEntry.employee?.name}</p>
                    <p className="text-xs text-gray-500 mt-1 uppercase font-bold">{selectedEntry.employee?.email}</p>
                  </div>
                  <div className="bg-white border-2 border-black p-8 rounded-3xl shadow-xl">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Segment Total</p>
                    <p className="text-4xl font-black text-black">{selectedEntry.total_hours}<span className="text-sm ml-1">h</span></p>
                    <div className="mt-3 flex items-center gap-3">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[9px] font-black uppercase">{selectedEntry.productive_hours}h Productive</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-sm font-black text-black uppercase tracking-[0.2em] border-l-4 border-black pl-5">Interaction Matrix</h3>

                  {selectedEntry.check_in_out_history && selectedEntry.check_in_out_history.length > 0 ? (
                    <div className="border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
                      <table className="w-full text-xs">
                        <thead className="bg-black text-white">
                          <tr>
                            <th className="px-6 py-5 text-left font-black uppercase tracking-widest">InBound</th>
                            <th className="px-6 py-5 text-left font-black uppercase tracking-widest">OutBound</th>
                            <th className="px-6 py-5 text-left font-black uppercase tracking-widest">Operation Segment</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {selectedEntry.check_in_out_history.map((hist, idx) => (
                            <tr key={idx} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-6 font-black text-blue-600 uppercase tabular-nums">{hist.check_in}</td>
                              <td className="px-6 py-6 font-black text-amber-600 uppercase tabular-nums">{hist.check_out}</td>
                              <td className="px-6 py-6">
                                <p className="font-black text-gray-900 uppercase tracking-tight">{hist.task || "Universal Node"}</p>
                                <p className="text-[9px] text-gray-400 font-bold uppercase mt-1 italic">{hist.project || "General Hub"}</p>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-16 text-center bg-gray-50 rounded-4xl border-2 border-dashed border-gray-100">
                      <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">Matrix empty: zero granular data clusters identified</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-10 bg-white border-t border-gray-100 flex justify-end">
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="px-10 py-4 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:opacity-90 transition-all shadow-2xl shadow-black/20 active:scale-95"
                >
                  Exit Detail
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TimeLogs;