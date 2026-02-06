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
  MdMoreVert,
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
      if (viewMode === "daily") {
        setTimeEntries(prev => prev.filter(e => e.id !== id));
      } else {
        setDetailedEntries(prev => prev.filter(e => e.id !== id));
      }
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
    return <div className="min-h-screen flex items-center justify-center"><Loading /></div>;
  }

  return (
    <div className="p-6">
      <LayoutComponents
        title="Time Logs"
        subtitle="Daily aggregated employee time entries"
        variant="table"
      >
        {/* Top Action Buttons */}
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-8 flex flex-wrap justify-between items-center gap-6">
          <div className="flex flex-wrap gap-4">
            <Link to="/operations/time-logs/active-timers" >
              <button className="flex items-center gap-3 px-6 py-3 cursor-pointer bg-black text-white rounded-xl hover:bg-gray-900 transition font-semibold">
                <MdTimer className="w-5 h-5" />Active Timers
              </button>
            </Link>
            <Link to="/operations/time-logs/calendar-view">
              <button className="flex items-center gap-3 px-6 py-3 cursor-pointer bg-black text-white rounded-xl hover:bg-gray-900 transition font-semibold">
                < MdCalendarToday className="w-5 h-5" />Calendar View
              </button>
            </Link>
            <Link to='/operations/time-logs/emplyees-time'>
              <button className="flex items-center gap-3 px-6 py-3 cursor-pointer bg-black text-white rounded-xl hover:bg-gray-900 transition font-semibold">
                <MdPerson className="w-5 h-5" />Employee Time Logs
              </button>
            </Link>
            <button className="flex items-center gap-3 px-6 py-3 cursor-pointer bg-black text-white rounded-xl hover:bg-gray-900 transition font-semibold">
              <MdTimer className="w-5 h-5" /> Log Time
            </button>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-gray-100 p-1.5 rounded-2xl w-fit mb-8 border border-gray-200 shadow-inner">
          <button
            onClick={() => setViewMode("daily")}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${viewMode === "daily"
                ? "bg-white text-black shadow-md translate-y-[-1px]"
                : "text-gray-500 hover:text-gray-900 hover:bg-white/50"
              }`}
          >
            Daily Summary
          </button>
          <button
            onClick={() => setViewMode("detailed")}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${viewMode === "detailed"
                ? "bg-white text-black shadow-md translate-y-[-1px]"
                : "text-gray-500 hover:text-gray-900 hover:bg-white/50"
              }`}
          >
            Detailed History
          </button>
        </div>

        {/* Search & Filters Bar */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-2xl">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                <input
                  type="text"
                  placeholder={viewMode === "daily" ? "Search by date, task, employee..." : "Search by task, project, memo..."}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black outline-none transition"
                />
              </div>

              <button
                onClick={() => setFiltersOpen(!filtersOpen)}
                className="flex items-center gap-3 px-5 py-4 border border-gray-300 rounded-xl hover:bg-gray-50 transition font-semibold whitespace-nowrap"
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
                Showing {filteredEntries.length} entries
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button className="flex items-center gap-2 px-5 py-4 border border-gray-300 rounded-xl hover:bg-gray-100 transition font-semibold">
                <MdDownload className="w-5 h-5" /> Export
              </button>
            </div>
          </div>
        </div>

        {/* Collapsible Advanced Filters */}
        <AnimatePresence>
          {filtersOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
                    label="Approved Status"
                    type="select"
                    value={filters.status}
                    onChange={(v) => handleFilterChange("status", v)}
                    options={[
                      { label: "All", value: "" },
                      { label: "Approved", value: "approved" },
                      { label: "Pending", value: "pending" },
                    ]}
                  />
                </div>

                <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-200">
                  <button
                    onClick={resetFilters}
                    className="px-6 py-3.5 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition"
                  >
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
                  <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">Sl No</th>
                  <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">Task / Projects</th>
                  <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">Employee</th>
                  <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">Start Time</th>
                  <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">End Time</th>
                  <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">Total Hours</th>
                  <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">Productive Hours</th>
                  <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">Billable</th>
                  <th className="px-6 py-5 text-right text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-12 text-center text-gray-500 font-medium">
                      No logs found for the selected mode.
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map((entry, i) => (
                    <motion.tr
                      key={entry.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="hover:bg-gray-50 transition group"
                    >
                      <td className="px-6 py-5 text-sm font-medium text-gray-900 whitespace-nowrap">{i + 1}</td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-gray-900 line-clamp-1">
                            {viewMode === "daily" ? entry.tasks : (entry.task_name || "Daily Work")}
                          </span>
                          <span className="text-[10px] text-gray-500 uppercase font-bold tracking-tight">
                            {viewMode === "daily" ? entry.projects : (entry.project_name || "General")}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs shadow-sm shadow-blue-500/10">
                            {entry.employee?.name?.[0]?.toUpperCase() || "E"}
                          </div>
                          <span className="text-sm text-gray-900 font-medium">{entry.employee?.name || entry.employee?.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm text-gray-700 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {formatDate(viewMode === "daily" ? entry.date : entry.start_time)}
                          </span>
                          <span className="text-xs text-blue-600 font-bold uppercase">
                            {viewMode === "daily" ? (entry.first_clock_in || "N/A") : formatTime(entry.start_time)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm text-gray-700 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {formatDate(viewMode === "daily" ? entry.date : (entry.end_time || entry.start_time))}
                          </span>
                          <span className="text-xs text-amber-600 font-bold uppercase">
                            {viewMode === "daily" ? (entry.last_clock_out || "Running...") : formatTime(entry.end_time)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-bold border border-green-100 shadow-sm">
                          {entry.total_hours} hrs
                        </span>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <span className="text-sm font-bold text-gray-900">
                          {entry.productive_hours} hrs
                        </span>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        {entry.is_billable ? (
                          <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-[10px] uppercase font-black border border-blue-100 italic tracking-wider">Billable</span>
                        ) : (
                          <span className="px-3 py-1 bg-gray-50 text-gray-400 rounded-full text-[10px] uppercase font-bold border border-gray-100 italic tracking-wider">Non-Billable</span>
                        )}
                      </td>
                      <td className="px-6 py-5 text-right whitespace-nowrap">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {viewMode === "daily" && (
                            <button
                              onClick={() => handleView(entry)}
                              className="p-2 hover:bg-white hover:shadow-md rounded-lg transition text-gray-600 hover:text-blue-600"
                              title="View Day Details"
                            >
                              <MdVisibility className="w-5 h-5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(entry.id)}
                            className="p-2 hover:bg-white hover:shadow-md rounded-lg transition text-gray-600 hover:text-red-600"
                            title="Delete Entry"
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
        </div>
      </LayoutComponents>

      {/* View Detail Modal */}
      <AnimatePresence>
        {isViewModalOpen && selectedEntry && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Time Log Details</h2>
                  <p className="text-gray-500 font-medium">{formatDate(selectedEntry.date)}</p>
                </div>
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="p-3 hover:bg-white hover:shadow-md rounded-xl transition text-gray-400 hover:text-gray-900"
                >
                  <MdClose className="w-6 h-6" />
                </button>
              </div>

              <div className="p-8 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-8 mb-8">
                  <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100/50">
                    <p className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-1">Employee</p>
                    <p className="text-lg font-bold text-gray-900">{selectedEntry.employee?.name}</p>
                    <p className="text-sm text-gray-500">{selectedEntry.employee?.email}</p>
                  </div>
                  <div className="bg-green-50/50 p-6 rounded-2xl border border-green-100/50">
                    <p className="text-sm font-bold text-green-600 uppercase tracking-widest mb-1">Total Time</p>
                    <p className="text-2xl font-black text-gray-900">{selectedEntry.total_hours} <span className="text-sm font-bold text-gray-500">hrs</span></p>
                    <p className="text-xs text-green-600 font-bold uppercase mt-1">Productive: {selectedEntry.productive_hours} hrs</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <div className="w-2 h-6 bg-black rounded-full"></div>
                    Session History
                  </h3>

                  {selectedEntry.check_in_out_history && selectedEntry.check_in_out_history.length > 0 ? (
                    <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-600 border-b border-gray-100">
                          <tr>
                            <th className="px-4 py-4 text-left font-bold border-r border-gray-100/50">Check In</th>
                            <th className="px-4 py-4 text-left font-bold border-r border-gray-100/50">Check Out</th>
                            <th className="px-4 py-4 text-left font-bold">Project/Task</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {selectedEntry.check_in_out_history.map((hist, idx) => (
                            <tr key={idx} className="hover:bg-gray-50 transition">
                              <td className="px-4 py-4 font-bold text-blue-600 border-r border-gray-100/50 whitespace-nowrap uppercase">{hist.check_in}</td>
                              <td className="px-4 py-4 font-bold text-amber-600 border-r border-gray-100/50 whitespace-nowrap uppercase">{hist.check_out}</td>
                              <td className="px-4 py-4">
                                <p className="font-bold text-gray-900 leading-tight">{hist.task || "Daily Work"}</p>
                                <p className="text-[10px] text-gray-500 font-black uppercase mt-0.5">{hist.project || "General"}</p>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                      <p className="text-gray-400 font-bold uppercase tracking-widest">No detailed history available</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-8 bg-gray-50 border-t border-gray-100 flex justify-end">
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="px-8 py-3.5 bg-black text-white rounded-xl font-bold hover:bg-gray-900 transition shadow-lg shadow-black/10 active:scale-95"
                >
                  Close Details
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TimeLogs;
