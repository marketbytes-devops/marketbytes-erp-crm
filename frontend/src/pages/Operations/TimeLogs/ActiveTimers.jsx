import React, { useState } from "react";
import LayoutComponents from "../../../components/LayoutComponents";
import {
  MdFilterList,
  MdKeyboardArrowDown,
  MdClose,
  MdDownload,
  MdTimerOff,
} from "react-icons/md";
import { FiSearch } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import Input from "../../../components/Input";

const ActiveTimers = () => {
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Filters
  const [project, setProject] = useState("");
  const [task, setTask] = useState("");
  const [employee, setEmployee] = useState("");
  const [approved, setApproved] = useState("");

  const activeFilterCount = [project, task, employee, approved].filter(Boolean)
    .length;

  const resetFilters = () => {
    setProject("");
    setTask("");
    setEmployee("");
    setApproved("");
    setSearch("");
  };

  // Dummy data (UI only)
  const timers = [
    {
      id: 1,
      task: "Works",
      project: "MarketBytes",
      subTask: "Support Works",
      employee: "Sreepoorna",
      startTime: "03-02-2026 02:26 PM",
      status: "Active",
      hours: "0 hrs",
      earnings: "₹0 (INR)",
    },
  ];

  return (
    <div className="p-6">
    <LayoutComponents
      title="Active Timers"
      subtitle="Track currently running employee timers"
      variant="table"
      
    >
      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 ">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-2xl">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
              <input
                type="text"
                placeholder="Search active timers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black outline-none"
              />
            </div>

            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="flex items-center gap-3 px-5 py-4 border border-gray-300 rounded-xl hover:bg-gray-50 font-semibold"
            >
              <MdFilterList className="w-5 h-5" />
              Filters
              {activeFilterCount > 0 && (
                <span className="bg-black text-white text-xs w-6 h-6 flex items-center justify-center rounded-full">
                  {activeFilterCount}
                </span>
              )}
              <MdKeyboardArrowDown
                className={`w-5 h-5 transition-transform ${
                  filtersOpen ? "rotate-180" : ""
                }`}
              />
            </button>
          </div>

          <button className="flex items-center gap-2 px-5 py-4 border border-gray-300 rounded-xl hover:bg-gray-100 font-semibold">
            <MdDownload className="w-5 h-5" /> Export
          </button>
        </div>
      </div>

      {/* Collapsible Filters (HIDDEN BY DEFAULT) */}
      <AnimatePresence>
        {filtersOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden mb-6"
          >
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 ">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium">Advanced Filters</h3>
                <button
                  onClick={() => setFiltersOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <MdClose className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <Input
                  label="Project"
                  type="select"
                  value={project}
                  onChange={setProject}
                  options={[{ label: "All Projects", value: "" }]}
                />
                <Input
                  label="Task"
                  type="select"
                  value={task}
                  onChange={setTask}
                  options={[{ label: "All Tasks", value: "" }]}
                />
                <Input
                  label="Employee"
                  type="select"
                  value={employee}
                  onChange={setEmployee}
                  options={[{ label: "All Employees", value: "" }]}
                />
                <Input
                  label="Approved"
                  type="select"
                  value={approved}
                  onChange={setApproved}
                  options={[
                    { label: "All", value: "" },
                    { label: "Approved", value: "approved" },
                    { label: "Pending", value: "pending" },
                  ]}
                />
              </div>

              <div className="flex justify-end mt-8">
                <button
                  onClick={resetFilters}
                  className="px-6 py-3 border-2 border-gray-300 rounded-xl font-semibold hover:bg-gray-50"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden ">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase">#</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase">Task</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase">Employee</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase">Start Time</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase">End Time</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase">Total Hours</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase">Earnings</th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-600 uppercase">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {timers.map((t, i) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-6 py-5">{i + 1}</td>
                  <td className="px-6 py-5">
                    <div className="font-medium">{t.task}</div>
                    <div className="text-sm text-gray-500">
                      {t.project} · {t.subTask}
                    </div>
                  </td>
                  <td className="px-6 py-5">{t.employee}</td>
                  <td className="px-6 py-5">{t.startTime}</td>
                  <td className="px-6 py-5">
                    <span className="px-3 py-1 text-xs rounded-full bg-green-100 text-green-700">
                      Active
                    </span>
                  </td>
                  <td className="px-6 py-5 text-green-600 font-medium">
                    {t.hours}
                  </td>
                  <td className="px-6 py-5">{t.earnings}</td>
                  <td className="px-6 py-5 text-right">
                    <button className="px-4 py-2 border border-red-400 text-red-500 rounded-lg hover:bg-red-50 flex items-center gap-2 ml-auto">
                      <MdTimerOff /> Stop
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

export default ActiveTimers;
