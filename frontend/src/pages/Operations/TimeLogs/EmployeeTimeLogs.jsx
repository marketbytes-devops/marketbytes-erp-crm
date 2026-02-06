import React, { useEffect, useState, useMemo } from "react";
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
  MdAccessTime
} from "react-icons/md";
import { FiArrowLeft, FiSearch } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import Input from "../../../components/Input";
import Loading from "../../../components/Loading";
import { Link } from "react-router-dom";

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
                <button className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-900 transition text-sm font-medium whitespace-nowrap">
                  <MdDownload className="w-5 h-5" /> Export Report
                </button>
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
                      <motion.tr
                        key={emp.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="hover:bg-gray-50 transition font-medium"
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
                          <button className="text-sm font-medium text-blue-600 hover:text-blue-800 transition">
                            View Details
                          </button>
                        </td>
                      </motion.tr>
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