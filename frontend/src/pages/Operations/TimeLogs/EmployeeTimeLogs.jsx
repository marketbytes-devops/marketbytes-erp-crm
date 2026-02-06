import React, { useEffect, useState } from "react";
import apiClient from "../../../helpers/apiClient"


const EmployeeTimeLogs = () => {
 const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
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
if (filters.to)   params.end_date = filters.to;
if (filters.project)  params.project = filters.project;
if (filters.task)     params.task = filters.task;
if (filters.employee) params.employee = filters.employee;


    const response = await apiClient.get(
      "/hr/attendance/clockin-counts/",
      { params }
    );

    const clockinData = response.data.results || [];
    setEmployees(clockinData);

    // Get unique employees from clock-in data for dropdown
    const uniqueEmployees = [];
    const seen = new Set();

    clockinData.forEach((record) => {
      const emp = record;
      if (emp && emp.id && !seen.has(emp.id)) {
        seen.add(emp.id);
        uniqueEmployees.push(emp);
      }
    });

    // Sort by name (optional but nice)
    uniqueEmployees.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

    setAllEmployees(uniqueEmployees);

  } catch (error) {
    console.error("Error fetching clock-in counts:", error);
    setEmployees([]);
    setAllEmployees([]); // clear dropdown if error
  } finally {
    setLoading(false);
  }
};

//dropdown fetching
useEffect(() => {
  const fetchDropdownData = async () => {
    try {
      const projRes = await apiClient.get("/operation/projects/");
      setProjects(projRes.data.results || []);

      const taskRes = await apiClient.get("/operation/tasks/");
      setTasks(taskRes.data.results || []);
    } catch (err) {
      console.error("Error loading dropdown data:", err);
      setProjects([]);
      setTasks([]);
      setAllEmployees([]); // clear employees too
    }
  };

  fetchDropdownData();
}, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleReset = () => {
    setFilters({ from: "", to: "",project: "", task: "", employee: "", });
  };

  const handleApply = () => {
  fetchClockinCounts();
};

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Time Logs</h2>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6 items-end">
        <div>
          <label className="block text-sm font-medium mb-1">Select Date Range</label>
          <div className="flex gap-2">
            <input
              type="date"
              name="from"
              value={filters.from}
              onChange={handleFilterChange}
              className="border rounded px-3 py-2"
            />
            <span className="flex items-center px-2 text-gray-500">To</span>
            <input
              type="date"
              name="to"
              value={filters.to}
              onChange={handleFilterChange}
              className="border rounded px-3 py-2"
            />
          </div>
        </div>

               {/* Project Dropdown – REAL DATA */}
        <div>
          <label className="block text-sm font-medium mb-1">Select Project</label>
          <select
            name="project"
            value={filters.project}
            onChange={handleFilterChange}
            className="border rounded px-3 py-2 min-w-[180px]"
          >
            <option value="">All Projects</option>
            {projects.map((proj) => (
              <option key={proj.id} value={proj.id}>
                {proj.name || proj.title || "Unnamed Project"}
              </option>
            ))}
          </select>
        </div>

        {/* Task Dropdown – REAL DATA */}
        <div>
          <label className="block text-sm font-medium mb-1">Select Task</label>
          <select
            name="task"
            value={filters.task}
            onChange={handleFilterChange}
            className="border rounded px-3 py-2 min-w-[180px]"
          >
            <option value="">All Tasks</option>
            {tasks.map((task) => (
              <option key={task.id} value={task.id}>
                {task.title || task.name || "Unnamed Task"}
              </option>
            ))}
          </select>
        </div>

        {/* Employee Dropdown – REAL DATA */}
        <div>
          <label className="block text-sm font-medium mb-1">Select Employee</label>
          <select
            name="employee"
            value={filters.employee}
            onChange={handleFilterChange}
            className="border rounded px-3 py-2 min-w-[220px]"
          >
            <option value="">All Employees</option>
            {allEmployees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name || emp.username || emp.email?.split('@')[0]}
                {emp.role?.name && ` (${emp.role.name})`}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleApply}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Apply
          </button>
          <button
            onClick={handleReset}
            className="bg-gray-600 text-white px-4 py-2 rounded"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
  <div className="text-center py-10 text-gray-600 font-medium">
    Loading employee clock-in records...
  </div>
) : employees.length === 0 ? (
  <div className="text-center py-10 text-gray-500">
    No clock-in records found for the selected date range.
    <br />
    Try changing the dates or resetting filters.
  </div>
) : (
      <div className="bg-white border rounded-lg overflow-hidden shadow">
        <table className="w-full">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Earnings</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
  {employees.map((emp) => (           // ← changed to employees
    <tr
      key={emp.id}                      // ← better key (use id from backend)
      className="border-b hover:bg-gray-50 transition-colors"
    >
      <td className="px-4 py-3 flex items-center gap-3">
        {/* Avatar / Initial – simple version without external image */}
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
          {emp.name?.charAt(0).toUpperCase() || '?'}
        </div>
        <span>{emp.name}</span>
      </td>
      <td className="px-4 py-3">{emp.role || '—'}</td>
      <td className="px-4 py-3 text-blue-600 font-medium">
        {emp.clockin_count} Times         {/* ← this is what you want! */}
      </td>
      <td className="px-4 py-3 text-green-600 font-medium">
        ₹{emp.earnings || 0} Earnings     {/* placeholder – later calculate real */}
      </td>
      <td className="px-4 py-3 text-center cursor-pointer text-gray-500">
        +
      </td>
    </tr>
  ))}
</tbody>
        </table>
      </div>
      )}
    </div>
  );
};

export default EmployeeTimeLogs;