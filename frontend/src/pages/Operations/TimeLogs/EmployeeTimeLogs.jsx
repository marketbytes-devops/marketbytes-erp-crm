import React, { useState } from "react";

const employeesData = [
  { name: "Ajay Renjith", role: "Stack Engineer", time: 50, earnings: 0 },
  { name: "Akshay Anilkumar", role: "Junior Full Stack Developer", time: 40, earnings: 0 },
  { name: "Akshay AS", role: "Developer", time: 0, earnings: 0 },
  { name: "Akshay Prakash", role: "Creative Designer", time: 41, earnings: 0 },
  { name: "Ananthakrishnan P", role: "COO", time: 0, earnings: 0 },
  { name: "Ansha Neslin", role: "Visibility Engineer", time: 47, earnings: 0 },
  { name: "Aravind N", role: "Digital Marketing Executive", time: 63, earnings: 0 },
];

const EmployeeTimeLogs = () => {
  const [filters, setFilters] = useState({
    from: "",
    to: "",
    project: "All",
    task: "All",
    employee: "All",
  });

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleApply = () => {
    console.log("Filters applied:", filters);
    // You can filter the employeesData here based on filters
  };

  const handleReset = () => {
    setFilters({ from: "", to: "", project: "All", task: "All", employee: "All" });
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

        <div>
          <label className="block text-sm font-medium mb-1">Select Project</label>
          <select
            name="project"
            value={filters.project}
            onChange={handleFilterChange}
            className="border rounded px-3 py-2"
          >
            <option>All</option>
            <option>Project A</option>
            <option>Project B</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Select Task</label>
          <select
            name="task"
            value={filters.task}
            onChange={handleFilterChange}
            className="border rounded px-3 py-2"
          >
            <option>All</option>
            <option>Task 1</option>
            <option>Task 2</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Select Employee</label>
          <select
            name="employee"
            value={filters.employee}
            onChange={handleFilterChange}
            className="border rounded px-3 py-2"
          >
            <option>All</option>
            {employeesData.map((emp, i) => (
              <option key={i}>{emp.name}</option>
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
            {employeesData.map((emp, i) => (
              <tr
                key={i}
                className="border-b hover:bg-gray-50 transition-colors"
              >
                <td className="px-4 py-3 flex items-center gap-3">
                  <img
                    src={`https://via.placeholder.com/40x40.png?text=👤`}
                    alt={emp.name}
                    className="w-8 h-8 rounded-full"
                  />
                  <span>{emp.name}</span>
                </td>
                <td className="px-4 py-3">{emp.role}</td>
                <td className="px-4 py-3 text-blue-500 font-medium">{emp.time} Time</td>
                <td className="px-4 py-3 text-green-500 font-medium">₹{emp.earnings} Earnings</td>
                <td className="px-4 py-3 text-center cursor-pointer text-gray-500">+</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EmployeeTimeLogs;
