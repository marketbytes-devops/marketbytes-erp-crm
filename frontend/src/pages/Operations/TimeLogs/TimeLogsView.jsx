import React, { useState, useEffect } from 'react';
import LayoutComponents from '../../../components/LayoutComponents';
import { MdFilterList, MdClose, MdKeyboardArrowDown, MdDownload, MdAdd, MdTimer,  MdCalendarToday, MdPerson, } from 'react-icons/md';
import { FiSearch } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import Input from '../../../components/Input';
import { Link } from "react-router-dom";


const TimeLogs = () => {
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Filter states
  const [dateRange, setDateRange] = useState({ start: '15-12-2025', end: '22-12-2025' });
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedTask, setSelectedTask] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [approvedStatus, setApprovedStatus] = useState("");

  const activeFilterCount = [
    dateRange.start !== '15-12-2025' || dateRange.end !== '22-12-2025',
    selectedProject,
    selectedTask,
    selectedEmployee,
    approvedStatus
  ].filter(Boolean).length;

  const resetFilters = () => {
    setDateRange({ start: '15-12-2025', end: '22-12-2025' });
    setSelectedProject("");
    setSelectedTask("");
    setSelectedEmployee("");
    setApprovedStatus("");
    setSearch("");
  };

  // Your hardcoded data
  const timeEntries = [/* ... your data ... */];

  const filteredEntries = timeEntries.filter(entry =>
    (search === "" ||
      entry.task.toLowerCase().includes(search.toLowerCase()) ||
      entry.employee.toLowerCase().includes(search.toLowerCase()))
    // Add more filter logic here when applying
  );

  return (
    <div className="p-6">
      <LayoutComponents
        title="Time Logs"
        subtitle="Manage and track employee time entries"
        variant="table"
      >
        {/* Top Action Buttons (like Add New Project) */}
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-8 flex flex-wrap justify-between items-center gap-6">
          <div className="flex gap-6">
            <Link to="/operations/timelogs/active-timers" >
              <button className="flex items-center gap-3 px-6 py-3 cursor-pointer bg-black text-white rounded-xl hover:bg-gray-900 transition font-semibold">
              <MdTimer className="w-5 h-5" />Active Timers
              </button>
            </Link>
            <Link to="/operations/timelogs/calendar-view">
            <button className="flex items-center gap-3 px-6 py-3 cursor-pointer bg-black text-white rounded-xl hover:bg-gray-900 transition font-semibold">
              < MdCalendarToday className="w-5 h-5" />Calendar View
            </button>
            </Link>
            <Link to='/operations/timelogs/emplyees-time'>
            <button className="flex items-center gap-3 px-6 py-3 cursor-pointer bg-black text-white rounded-xl hover:bg-gray-900 transition font-semibold">
              <MdPerson className="w-5 h-5" />Employee Time Logs
            </button>
            </Link>
             <button className="flex items-center gap-2 px-6 py-3 cursor-pointer bg-black text-white rounded-xl hover:bg-gray-900 transition font-semibold">
              <MdAdd className="w-5 h-5" />Create Invoice
            </button>
            <button className="flex items-center gap-3 px-6 py-3 cursor-pointer bg-black text-white rounded-xl hover:bg-gray-900 transition font-semibold">
              <MdTimer className="w-5 h-5" /> Log Time
            </button>
          </div>
        </div>

        {/* Search & Filters Bar - EXACT SAME AS PROJECTS */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-2xl">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search time logs..."
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
                {filteredEntries.length} {filteredEntries.length === 1 ? "entry" : "entries"}
              </span>
            </div>

            {/* Action Buttons on Right */}
            <div className="flex flex-wrap items-center gap-3">
              <button className="flex items-center gap-2 px-5 py-4 border border-gray-300 rounded-xl hover:bg-gray-100 transition font-semibold">
                <MdDownload className="w-5 h-5" /> Export
              </button>
            </div>
          </div>
        </div>

        {/* Collapsible Advanced Filters - SAME AS PROJECTS */}
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
                  {/* Date Range - Custom two inputs */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={dateRange.start}
                        onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                        placeholder="Start Date"
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black outline-none"
                      />
                      <span className="self-center text-gray-500">to</span>
                      <input
                        type="text"
                        value={dateRange.end}
                        onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                        placeholder="End Date"
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black outline-none"
                      />
                    </div>
                  </div>

                  <Input label="Project" type="select" value={selectedProject} onChange={setSelectedProject}
                    options={[{ label: "All Projects", value: "" }, /* dynamic */]}
                  />
                  <Input label="Task" type="select" value={selectedTask} onChange={setSelectedTask}
                    options={[{ label: "All Tasks", value: "" }]}
                  />
                  <Input label="Employee" type="select" value={selectedEmployee} onChange={setSelectedEmployee}
                    options={[{ label: "All Employees", value: "" }]}
                  />
                  <Input label="Approved Status" type="select" value={approvedStatus} onChange={setApprovedStatus}
                    options={[{ label: "All", value: "" }, { label: "Approved", value: "approved" }, { label: "Pending", value: "pending" }]}
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

        {/* Table - Same styling as Projects */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">#</th>
                  <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Task</th>
                  <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Start Time</th>
                  <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">End Time</th>
                  <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Total Hours</th>
                  <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Productive Hours</th>
                  <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Billable</th>
                  <th className="px-6 py-5 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredEntries.map((entry, i) => (
                  <tr key={entry.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-5 text-sm font-medium text-gray-900">{i + 1}</td>
                    <td className="px-6 py-5 text-sm text-gray-900">{entry.task}</td>
                    <td className="px-6 py-5 text-sm text-gray-900">{entry.employee}</td>
                    <td className="px-6 py-5 text-sm text-gray-700">{entry.startTime}</td>
                    <td className="px-6 py-5 text-sm text-gray-700">{entry.endTime}</td>
                    <td className="px-6 py-5 text-sm text-green-600 font-medium">{entry.totalHours}</td>
                    <td className="px-6 py-5 text-sm text-gray-900">{entry.billable}</td>
                    <td className="px-6 py-5 text-right">
                      <button className="p-2 rounded-lg hover:bg-gray-100">
                        <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </LayoutComponents>
    </div>
  );
};

export default TimeLogs;