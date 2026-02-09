import React, { useEffect, useState, useMemo, useRef } from "react";
import apiClient from "../../../helpers/apiClient";
import LayoutComponents from "../../../components/LayoutComponents";
import {
  MdFilterList,
  MdClose,
  MdKeyboardArrowDown,
  MdDownload,
  MdRefresh,
  MdPerson,
  MdAttachMoney,
  MdAccessTime,
  MdDelete
} from "react-icons/md";
import { FiArrowLeft, FiSearch } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import Input from "../../../components/Input";
import Loading from "../../../components/Loading";
import { Link } from "react-router-dom";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const EmployeeTimeLogs = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [search, setSearch] = useState("");

  const [filters, setFilters] = useState({
    from: "",
    to: "",
    project: "",
    task: "",
    employee: "",
  });

  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);

  // Expanded Row State
  const [expandedEmployeeId, setExpandedEmployeeId] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  
  // Export dropdown state
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const exportDropdownRef = useRef(null);

  // Fetch data when component loads OR filters change
  useEffect(() => {
    fetchClockinCounts();
  }, [filters.from, filters.to, filters.project, filters.task, filters.employee]);

  const fetchClockinCounts = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.from) params.start_date = filters.from;
      if (filters.to) params.end_date = filters.to;
      if (filters.project) params.project = filters.project;
      if (filters.task) params.task = filters.task;
      if (filters.employee) params.employee = filters.employee;

      const response = await apiClient.get(
        "/hr/attendance/clockin-counts/",
        { params }
      );

      const clockinData = response.data.results || [];
      setEmployees(clockinData);

      // Get unique employees from clock-in data for dropdown if not already populated
      if (allEmployees.length === 0) {
        const uniqueEmployees = [];
        const seen = new Set();
        clockinData.forEach((record) => {
          if (record && record.id && !seen.has(record.id)) {
            seen.add(record.id);
            uniqueEmployees.push(record);
          }
        });
        uniqueEmployees.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        setAllEmployees(uniqueEmployees);
      }
    } catch (error) {
      console.error("Error fetching clock-in counts:", error);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  // Dropdown fetching
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [projRes, taskRes] = await Promise.all([
          apiClient.get("/operation/projects/"),
          apiClient.get("/operation/tasks/")
        ]);
        setProjects(projRes.data.results || []);
        setTasks(taskRes.data.results || []);
      } catch (err) {
        console.error("Error loading dropdown data:", err);
      }
    };
    fetchDropdownData();
  }, []);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({ from: "", to: "", project: "", task: "", employee: "" });
    setSearch("");
    setExpandedEmployeeId(null);
    setSessions([]);
  };

  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm("Are you sure you want to delete this work session?")) return;
    try {
      await apiClient.delete(`/hr/work-sessions/${sessionId}/`);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      // Optionally refresh parent stats
      fetchClockinCounts();
    } catch (error) {
      console.error("Error deleting session:", error);
      alert("Failed to delete session");
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text("Employee Time Logs Report", 14, 20);
    
    // Add filters info
    doc.setFontSize(10);
    let yPos = 30;
    if (filters.from || filters.to) {
      doc.text(`Date Range: ${filters.from || 'N/A'} to ${filters.to || 'N/A'}`, 14, yPos);
      yPos += 6;
    }
    if (filters.project) {
      const proj = projects.find(p => p.id.toString() === filters.project);
      doc.text(`Project: ${proj?.name || 'N/A'}`, 14, yPos);
      yPos += 6;
    }
    if (filters.task) {
      const task = tasks.find(t => t.id.toString() === filters.task);
      doc.text(`Task: ${task?.name || 'N/A'}`, 14, yPos);
      yPos += 6;
    }
    
    // Prepare table data
    const tableData = filteredEmployees.map(emp => [
      emp.name || 'Unknown',
      emp.role || 'Employee',
      `${emp.clockin_count} Sessions`,
      `₹${emp.earnings || 0}`
    ]);
    
    // Add table
    doc.autoTable({
      startY: yPos + 5,
      head: [['Employee', 'Role', 'Work Frequency', 'Est. Earnings']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [0, 0, 0] },
      styles: { fontSize: 9 }
    });
    
    // Add footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `Page ${i} of ${pageCount} | Generated on ${new Date().toLocaleString()}`,
        14,
        doc.internal.pageSize.height - 10
      );
    }
    
    doc.save(`employee-time-logs-${new Date().toISOString().split('T')[0]}.pdf`);
    setExportDropdownOpen(false);
  };

  const handleExportExcel = () => {
    // Prepare data
    const data = filteredEmployees.map(emp => ({
      'Employee Name': emp.name || 'Unknown',
      'Email': emp.email || 'No Email',
      'Role': emp.role || 'Employee',
      'Work Frequency': `${emp.clockin_count} Sessions`,
      'Est. Earnings': `₹${emp.earnings || 0}`
    }));
    
    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(data);
    
    // Set column widths
    ws['!cols'] = [
      { wch: 20 }, // Employee Name
      { wch: 25 }, // Email
      { wch: 15 }, // Role
      { wch: 18 }, // Work Frequency
      { wch: 15 }  // Est. Earnings
    ];
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Employee Time Logs');
    
    // Save file
    XLSX.writeFile(wb, `employee-time-logs-${new Date().toISOString().split('T')[0]}.xlsx`);
    setExportDropdownOpen(false);
  };

  // Close export dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target)) {
        setExportDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExpand = async (employeeId) => {
    if (expandedEmployeeId === employeeId) {
      setExpandedEmployeeId(null);
      setSessions([]);
      return;
    }

    setExpandedEmployeeId(employeeId);
    setSessionsLoading(true);
    try {
      const params = { employee: employeeId };
      if (filters.from) params.start_date = filters.from;
      if (filters.to) params.end_date = filters.to;
      if (filters.project) params.project = filters.project;
      if (filters.task) params.task = filters.task;

      const response = await apiClient.get("/hr/work-sessions/", { params });
      setSessions(response.data.results || []);
    } catch (error) {
      console.error("Error fetching sessions:", error);
    } finally {
      setSessionsLoading(false);
    }
  };

  const formatTimeRange = (start, end) => {
      if (!start) return "-";
      const startDate = new Date(start);
      const endDate = end ? new Date(end) : null;
      
      const timeStr = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (!endDate) return `${timeStr} - Active`;
      
      const endTimeStr = endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return `${timeStr} - ${endTimeStr}`;
  };

  // Filter employees based on search
  const filteredEmployees = useMemo(() => {
    if (!search.trim()) return employees;
    const term = search.toLowerCase();
    return employees.filter(emp =>
      emp.name?.toLowerCase().includes(term) ||
      emp.role?.toLowerCase().includes(term) ||
      emp.email?.toLowerCase().includes(term)
    );
  }, [employees, search]);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const stats = useMemo(() => {
    const totalClockins = filteredEmployees.reduce((acc, curr) => acc + (parseInt(curr.clockin_count) || 0), 0);
    const totalEarnings = filteredEmployees.reduce((acc, curr) => acc + (parseFloat(curr.earnings) || 0), 0);
    return {
      count: filteredEmployees.length,
      clockins: totalClockins,
      earnings: totalEarnings.toFixed(2)
    }
  }, [filteredEmployees]);

  const renderAvatar = (name) => {
    const initial = name ? name.charAt(0).toUpperCase() : "?";
    return (
      <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium shadow-sm border-2 border-white">
        {initial}
      </div>
    );
  };

  if (loading && employees.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loading />
      </div>
    );
  }

  return (
    <div className="p-6">
      <LayoutComponents
        title="Employee View"
        subtitle="Performance and attendance overview"
        variant="table"
      >
        <div className="max-w-full mx-auto">
          {/* Navigation */}
          <div className="mb-6">
            <Link to="/operations/time-logs" className="group inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-black transition-colors">
              <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" /> Back to Time Logs
            </Link>
          </div>

          {/* Stats Row */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div className="text-center">
                  <div className="text-4xl font-medium text-black mb-2">{stats.count}</div>
                  <p className="text-sm text-gray-600">Employees Active</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-medium text-blue-600 mb-2">{stats.clockins}</div>
                  <p className="text-sm text-gray-600">Total Clock-Ins</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-medium text-green-600 mb-2">₹{stats.earnings}</div>
                  <p className="text-sm text-gray-600">Total Earnings</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={fetchClockinCounts}
                  className="p-3 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition active:scale-95 text-gray-600"
                  title="Refresh"
                >
                  <MdRefresh className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <div className="relative" ref={exportDropdownRef}>
                  <button 
                    onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
                    className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-900 transition text-sm font-medium whitespace-nowrap"
                  >
                    <MdDownload className="w-5 h-5" /> Export Report
                    <MdKeyboardArrowDown className={`w-4 h-4 transition-transform ${exportDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {exportDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                      <button
                        onClick={handleExportPDF}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition flex items-center gap-2"
                      >
                        <MdDownload className="w-4 h-4" />
                        Export as PDF
                      </button>
                      <button
                        onClick={handleExportExcel}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition flex items-center gap-2"
                      >
                        <MdDownload className="w-4 h-4" />
                        Export as Excel
                      </button>
                    </div>
                  )}
                </div>
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
                    placeholder="Search employee by name, role..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black outline-none text-base transition"
                  />
                </div>

                <button
                  onClick={() => setFiltersOpen(!filtersOpen)}
                  className="flex items-center gap-3 px-5 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition text-sm font-medium whitespace-nowrap"
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

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-700 uppercase tracking-wide ml-1">Date Range</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="date"
                          value={filters.from}
                          onChange={(e) => handleFilterChange("from", e.target.value)}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none text-sm transition"
                        />
                        <span className="text-gray-400">-</span>
                        <input
                          type="date"
                          value={filters.to}
                          onChange={(e) => handleFilterChange("to", e.target.value)}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none text-sm transition"
                        />
                      </div>
                    </div>

                    <Input
                      label="Project"
                      type="select"
                      value={filters.project}
                      onChange={(v) => handleFilterChange("project", v)}
                      options={[
                        { label: "All Projects", value: "" },
                        ...projects.map((p) => ({ label: p.name, value: p.id.toString() })),
                      ]}
                    />
                    <Input
                      label="Task"
                      type="select"
                      value={filters.task}
                      onChange={(v) => handleFilterChange("task", v)}
                      options={[
                        { label: "All Tasks", value: "" },
                        ...tasks.map((t) => ({ label: t.name, value: t.id.toString() })),
                      ]}
                    />
                    <Input
                      label="Employee"
                      type="select"
                      value={filters.employee}
                      onChange={(v) => handleFilterChange("employee", v)}
                      options={[
                        { label: "All Employees", value: "" },
                        ...allEmployees.map((e) => ({
                          label: e.name || e.email,
                          value: e.id.toString(),
                        })),
                      ]}
                    />
                  </div>

                  <div className="flex justify-end mt-8 pt-6 border-t border-gray-200">
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

          {/* Data Table */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">Employee</th>
                    <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">Role</th>
                    <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">Work Frequency</th>
                    <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">Est. Earnings</th>
                    <th className="px-6 py-5 text-right text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-24">
                        <div className="flex flex-col items-center">
                          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-5">
                            <MdPerson className="w-10 h-10 text-gray-400" />
                          </div>
                          <p className="text-xl font-medium text-gray-700">No records found</p>
                          <p className="text-gray-500 mt-2">Try adjusting your range or filters</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((emp, i) => (
                      <React.Fragment key={emp.id}>
                      <motion.tr
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className={`hover:bg-gray-50 transition font-medium ${expandedEmployeeId === emp.id ? "bg-gray-50" : ""}`}
                      >
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="flex items-center gap-4">
                            {renderAvatar(emp.name)}
                            <div>
                              <p className="text-sm font-medium text-gray-900">{emp.name || "Unknown"}</p>
                              <p className="text-xs text-gray-500">{emp.email || "No Email"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                            {emp.role || "Employee"}
                          </span>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <MdAccessTime className="w-5 h-5 text-blue-500" />
                            <span className="text-sm text-gray-900">{emp.clockin_count} Sessions</span>
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="flex items-center gap-1 text-green-600">
                            <MdAttachMoney className="w-5 h-5" />
                            <span className="text-sm font-medium">₹{emp.earnings || 0}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap text-right">
                          <button 
                            onClick={() => handleExpand(emp.id)}
                            className="p-2 rounded-full hover:bg-gray-200 transition text-gray-600"
                          >
                             {expandedEmployeeId === emp.id ? <MdClose className="w-5 h-5" /> : <span className="text-xl font-bold">+</span>}
                          </button>
                        </td>
                      </motion.tr>
                      {expandedEmployeeId === emp.id && (
                        <tr>
                          <td colSpan="5" className="p-0 border-b border-gray-200 bg-gray-50/50">
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="p-6 pl-20"
                            >
                                {sessionsLoading ? (
                                    <div className="flex justify-center py-4"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div></div>
                                ) : sessions.length === 0 ? (
                                    <p className="text-sm text-gray-500 text-center py-4">No detailed sessions found for this filter.</p>
                                ) : (
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-gray-500 border-b border-gray-200">
                                                <th className="text-left font-medium py-2 uppercase text-xs tracking-wider">Date</th>
                                                <th className="text-left font-medium py-2 uppercase text-xs tracking-wider">Task</th>
                                                <th className="text-left font-medium py-2 uppercase text-xs tracking-wider">Time</th>
                                                <th className="text-left font-medium py-2 uppercase text-xs tracking-wider">Total Hours</th>
                                                <th className="text-left font-medium py-2 uppercase text-xs tracking-wider">Earnings</th>
                                                <th className="text-right font-medium py-2 uppercase text-xs tracking-wider">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {sessions.slice(0, 5).map((session) => (
                                                <tr key={session.id}>
                                                    <td className="py-3 text-gray-600 font-medium">
                                                        {new Date(session.start_time).toLocaleDateString()}
                                                    </td>
                                                    <td className="py-3 text-gray-900 font-medium">
                                                      <div>
                                                        <p className="text-sm font-semibold">{session.project_name || "No Project"}</p>
                                                        <p className="text-xs text-gray-500">{session.task_name || session.memo || "No Task"}</p>
                                                      </div>
                                                    </td>
                                                    <td className="py-3 text-gray-600">{formatTimeRange(session.start_time, session.end_time)}</td>
                                                    <td className="py-3 text-gray-600">{session.duration || "-"}</td>
                                                    <td className="py-3 text-green-600 font-medium">₹0</td>
                                                    <td className="py-3 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button 
                                                                onClick={() => handleDeleteSession(session.id)}
                                                                className="p-1 text-red-600 hover:bg-red-50 rounded transition"
                                                                title="Delete"
                                                            >
                                                                <MdDelete className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </motion.div>
                          </td>
                        </tr>
                      )}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {filteredEmployees.length > 0 && (
              <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-3 text-sm text-gray-600">
                <span>Showing {filteredEmployees.length} records</span>
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
    </div>
  );
};

export default EmployeeTimeLogs;