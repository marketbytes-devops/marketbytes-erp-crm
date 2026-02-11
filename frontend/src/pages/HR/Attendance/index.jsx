import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import LayoutComponents from "../../../components/LayoutComponents";
import apiClient from "../../../helpers/apiClient";
import { MdDownload, MdRefresh, MdClose, MdAccessTime } from "react-icons/md";
import { usePermission } from "../../../context/PermissionContext";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  addMonths,
  subMonths,
} from "date-fns";
import Dropdown from "../../../components/Dropdown";
import { createPortal } from "react-dom";

const AttendanceModal = ({ record, date, onClose }) => {
  if (!record) return null;

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  const formatTime = (time) => (!time ? "Nil" : time);
  const formatHours = (hours) => {
    if (!hours || hours <= 0) return "Nil";
    const h = Math.floor(hours);
    const m = Math.round((hours % 1) * 60);
    return h === 0 ? `${m}m` : m === 0 ? `${h}h` : `${h}h ${m}m`;
  };

  const firstCheckIn = record.first_clock_in || record.clock_in;
  const lastCheckOut = record.last_clock_out || record.clock_out;
  const hasHistory = record.check_in_out_history && record.check_in_out_history.length > 0;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h3 className="text-2xl font-medium">Attendance Details</h3>
          <button
            onClick={onClose}
            className="p-3 hover:bg-gray-100 rounded-xl transition"
          >
            <MdClose className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        <div className="p-8 space-y-8">
          <div className="text-center">
            <h4 className="text-2xl font-medium">{formatDate(date)}</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Employee</span>
                <span className="font-medium">{record.employee?.name || "Unknown"}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Status</span>
                <span className="capitalize font-medium">{record.status.replace(/_/g, " ")}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">First Clock In</span>
                <span className="font-mono text-green-600 font-medium">{formatTime(firstCheckIn)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Last Clock Out</span>
                <span className="font-mono text-red-600 font-medium">
                  {lastCheckOut ? formatTime(lastCheckOut) : "Still Working"}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Total Hours</span>
                <span className="font-mono">{formatHours(record.total_hours)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Productive Hours</span>
                <span className="font-mono text-blue-600 font-medium">{formatHours(record.productive_hours)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Break Hours</span>
                <span className="font-mono text-orange-600">{formatHours(record.break_hours)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Work From</span>
                <span className={record.working_from !== "Office" ? "text-indigo-600 font-medium" : ""}>
                  {record.working_from || "Office"}
                </span>
              </div>
            </div>
          </div>

          {record.notes && (
            <div className="pt-4 border-t border-gray-200">
              <p className="font-medium text-gray-600 mb-2">Notes</p>
              <p className="text-gray-700 italic">"{record.notes}"</p>
            </div>
          )}

          {hasHistory && (
            <div className="mt-8">
              <h4 className="text-lg font-medium mb-4 flex items-center justify-center gap-2">
                <MdAccessTime className="w-5 h-5" />
                Check-In & Check-Out History
              </h4>

              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-700 uppercase text-xs">
                    <tr>
                      <th className="px-4 py-3">Session</th>
                      <th className="px-4 py-3">Project</th>
                      <th className="px-4 py-3">Check In</th>
                      <th className="px-4 py-3">Check Out</th>
                      <th className="px-4 py-3">Task</th>
                      <th className="px-4 py-3">Memo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {record.check_in_out_history.map((session, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{idx + 1}</td>
                        <td className="px-4 py-3">
                          {session.project ? (
                            <span className="inline-block px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-700 rounded">
                              {session.project}
                            </span>
                          ) : "No project selected"}
                        </td>
                        <td className="px-4 py-3 font-mono text-green-600">{formatTime(session.check_in)}</td>
                        <td className="px-4 py-3 font-mono">
                          <span className={session.check_out === "Still Working" ? "text-orange-600" : "text-red-600"}>
                            {session.check_out === "Still Working" ? session.check_out : formatTime(session.check_out)}
                          </span>
                        </td>
                        <td className="px-4 py-3 max-w-xs truncate">{session.task || "No task selected"}</td>
                        <td className="px-4 py-3 text-gray-600 italic max-w-xs truncate">{session.memo || "No memo written"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>,
    document.body
  );
};

const Attendance = () => {
  const { hasPermission } = usePermission();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [attendances, setAttendances] = useState([]);
  const [summary, setSummary] = useState({
    present: 0,
    late: 0,
    absent: 0,
    half_day: 0,
    leave: 0,
    holiday: 0,
  });
  const [loading, setLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);


  const [showFilters, setShowFilters] = useState(false);
  const [filterEmployeeName, setFilterEmployeeName] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");

  const month = selectedDate.getMonth() + 1;
  const year = selectedDate.getFullYear();

  useEffect(() => {
    fetchAttendance();
  }, [month, year]);

  const fetchAttendance = () => {
    setLoading(true);
    apiClient
      .get("/hr/attendance/", { params: { month, year } })
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data.results || [];
        setAttendances(data);
      })
      .catch(() => setAttendances([]));

    apiClient
      .get("/hr/attendance/summary/", { params: { month, year } })
      .then((res) => setSummary(res.data))
      .catch(() =>
        setSummary({ present: 0, late: 0, absent: 0, half_day: 0, leave: 0, holiday: 0 })
      )
      .finally(() => setLoading(false));
  };

  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const startDate = new Date(monthStart);
  startDate.setDate(startDate.getDate() - getDay(monthStart));
  const endDate = new Date(monthEnd);
  endDate.setDate(endDate.getDate() + (6 - getDay(monthEnd)));

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });


  const employeesMap = attendances.reduce((acc, att) => {
    const empId = att.employee?.id || att.employee_id || "unknown";
    const empName = att.employee?.name || "Unknown Employee";
    const dept = att.employee?.department || "Unknown"; 


    const nameMatch = filterEmployeeName === "" || 
      empName.toLowerCase().includes(filterEmployeeName.toLowerCase());

    const deptMatch = filterDepartment === "" || 
      dept.toLowerCase().includes(filterDepartment.toLowerCase());

 

    if (nameMatch && deptMatch) {
      if (!acc[empId]) {
        acc[empId] = { employee: { id: empId, name: empName }, records: [] };
      }
      acc[empId].records.push(att);
    }
    return acc;
  }, {});

  const employeeList = Object.values(employeesMap);

  const indexOfLastEmployee = currentPage * itemsPerPage;
  const indexOfFirstEmployee = indexOfLastEmployee - itemsPerPage;
  const currentEmployees = employeeList.slice(indexOfFirstEmployee, indexOfLastEmployee);
  const totalPages = Math.ceil(employeeList.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  useEffect(() => {
    setCurrentPage(1);
  }, [month, year, filterEmployeeName, filterDepartment]); // reset page when filters change

  const getRecordForDate = (records, date) => {
    const formatted = format(date, "yyyy-MM-dd");
    return records.find(
      (r) => r.date === formatted || format(new Date(r.date), "yyyy-MM-dd") === formatted
    );
  };

  const getStatusBadge = (status) => {
    const badges = {
      present: { label: "P", bg: "bg-black text-white", border: "" },
      late: { label: "L", bg: "bg-white text-black", border: "border-2 border-black" },
      absent: { label: "A", bg: "bg-white text-black", border: "border-2 border-black" },
      half_day: { label: "H", bg: "bg-white text-black", border: "border-2 border-black" },
      leave: { label: "LV", bg: "bg-white text-black", border: "border-2 border-black" },
      half_day_late: { label: "HL", bg: "bg-white text-black", border: "border-2 border-black" },
      holiday: { label: "HD", bg: "bg-gray-200 text-black", border: "" },
    };
    return badges[status] || { label: "-", bg: "bg-gray-100 text-gray-500", border: "" };
  };

  const exportData = (format) => {
    alert(`Exporting as ${format}...`);
  };

  const openModal = (record, date) => {
    setSelectedRecord(record);
    setSelectedDay(date);
  };

  const closeModal = () => {
    setSelectedRecord(null);
    setSelectedDay(null);
  };

  const resetFilters = () => {
    setFilterEmployeeName("");
    setFilterDate("");
    setFilterDepartment("");
    setShowFilters(false);
  };

  return (
    <div className="p-6">
      <LayoutComponents
        title="Attendance"
        subtitle="Monthly attendance overview with productive hours tracking"
        variant="card"
      >
        <div className="grid grid-cols-2 md:grid-cols-6 gap-6 mb-8">
          {[
            { label: "Present", value: summary.present, color: "bg-black", desc: "On time" },
            { label: "Late", value: summary.late, color: "bg-black", desc: "After 9:30 AM" },
            { label: "Absent", value: summary.absent, color: "bg-black", desc: "No check-in" },
            { label: "Half Day", value: summary.half_day, color: "bg-black", desc: "Left early" },
            { label: "Leave", value: summary.leave, color: "bg-black", desc: "Approved" },
            { label: "Holiday", value: summary.holiday, color: "bg-black", desc: "Public holiday" },
          ].map((item, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.05 }}
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
            >
              <p className="text-gray-600 text-sm">{item.label}</p>
              <p className="text-4xl font-medium mt-3">{item.value}</p>
              <p className="text-xs text-gray-500 mt-2">{item.desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex flex-wrap gap-4 justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSelectedDate(subMonths(selectedDate, 1))}
                className="p-2 bg-gray-100 hover:bg-white text-black border border-gray-100 hover:border-black transition-all duration-300 rounded-xl text-sm font-medium"
              >
                Previous
              </button>
              <h2 className="text-2xl font-medium text-black">
                {format(selectedDate, "MMMM yyyy")}
              </h2>
              <button
                onClick={() => setSelectedDate(addMonths(selectedDate, 1))}
                className="p-2 bg-gray-100 hover:bg-white text-black border border-gray-100 hover:border-black transition-all duration-300 rounded-xl text-sm font-medium"
              >
                Next
              </button>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-5 py-3 border border-gray-400 rounded-xl hover:bg-gray-50 transition font-medium"
              >
                <span>Filters {showFilters ? "▲" : "▼"}</span>
              </button>
              <button
                onClick={fetchAttendance}
                className="flex items-center gap-3 px-6 py-3.5 bg-black text-white rounded-xl hover:bg-black transition font-medium"
              >
                <MdRefresh className="w-5 h-5" />
                Refresh
              </button>
              {hasPermission("attendance", "view") && (
                <Dropdown
                  trigger={
                    <button className="flex items-center gap-3 px-6 py-3.5 border border-gray-400 rounded-xl hover:bg-gray-50 transition font-medium">
                      <MdDownload className="w-5 h-5" /> Export
                    </button>
                  }
                  dropdownId="export-attendance"
                  align="right"
                >
                  <Dropdown.Item onClick={() => exportData("CSV")}>Export as CSV</Dropdown.Item>
                  <Dropdown.Item onClick={() => exportData("Excel")}>Export as Excel</Dropdown.Item>
                  <Dropdown.Item onClick={() => exportData("PDF")}>Export as PDF</Dropdown.Item>
                </Dropdown>
              )}
            </div>
          </div>
        </div>


        {showFilters && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-gray-200">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-medium">Advanced Filters</h3>
              <button
                onClick={() => setShowFilters(false)}
                className="text-gray-500 hover:text-gray-800"
              >
                <MdClose className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Employee Name</label>
                <input
                  type="text"
                  value={filterEmployeeName}
                  onChange={(e) => setFilterEmployeeName(e.target.value)}
                  placeholder="Search employee..."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/30"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/30"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Department</label>
                <input
                  type="text"
                  value={filterDepartment}
                  onChange={(e) => setFilterDepartment(e.target.value)}
                  placeholder="e.g. Development, HR..."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/30"
                />
              </div>

              {/* Month is already controlled by calendar → disabled or informational */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Month</label>
                <div className="px-4 py-2.5 bg-gray-100 border border-gray-300 rounded-lg text-gray-600">
                  {format(selectedDate, "MMMM yyyy")}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={resetFilters}
                className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Reset All Filters
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="px-6 py-2.5 bg-black text-white rounded-lg hover:bg-gray-900 transition"
              >
                Apply & Close
              </button>
            </div>
          </div>
        )}

     
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-16 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-black border-t-transparent"></div>
              <p className="mt-6 text-gray-600">Loading attendance...</p>
            </div>
          ) : employeeList.length === 0 ? (
            <div className="p-16 text-center text-gray-500">
              <p className="text-xl font-medium">No records found</p>
              <p className="text-sm mt-2">Try selecting a different month or adjusting filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[1000px] p-6">
                <div className="grid grid-cols-[60px_250px_1fr] gap-0 border border-gray-400">
                  <div className="sticky left-0 bg-white border-r border-b border-gray-400 px-4 py-5 text-sm font-medium text-black text-center whitespace-nowrap">
                    SL No
                  </div>
                  <div className="sticky left-[60px] bg-white border-r border-b border-gray-400 px-6 py-5 text-sm font-medium text-black whitespace-nowrap">
                    Employee
                  </div>
                  <div className="grid grid-cols-7 border-b border-gray-400">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                      <div
                        key={day}
                        className="py-4 text-center text-xs font-medium text-gray-700 border-r border-gray-400 last:border-r-0 whitespace-nowrap"
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  {currentEmployees.map((emp, index) => (
                    <div key={emp.employee.id} className="contents">
                      <div className="sticky left-0 z-10 bg-white border-r border-b border-gray-400 px-4 py-5 text-sm text-center text-gray-600 whitespace-nowrap">
                        {index + 1 + (currentPage - 1) * itemsPerPage}
                      </div>
                      <div className="sticky left-[60px] z-10 bg-white border-r border-b border-gray-400 px-6 py-5 text-sm font-medium text-black whitespace-nowrap">
                        {emp.employee.name}
                      </div>
                      <div className="grid grid-cols-7">
                        {calendarDays.map((date, idx) => {
                          const isCurrentMonth = date.getMonth() === selectedDate.getMonth();
                          const record = isCurrentMonth ? getRecordForDate(emp.records, date) : null;
                          const badge = getStatusBadge(record?.status);

                          return (
                            <div
                              key={idx}
                              onClick={() => record && openModal(record, date)}
                              className={`border-r border-b border-gray-400 h-24 p-3 flex flex-col items-center justify-center gap-2 transition cursor-pointer whitespace-nowrap
                                ${!isCurrentMonth ? "bg-gray-50 text-gray-400" : "bg-white hover:bg-gray-50"}
                                ${getDay(date) === 0 || getDay(date) === 6 ? "bg-gray-50" : ""}
                              `}
                            >
                              <div className={`text-sm font-medium ${!isCurrentMonth ? "text-gray-400" : "text-gray-800"}`}>
                                {format(date, "d")}
                              </div>
                              {record && (
                                <div
                                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${badge.bg} ${badge.border}`}
                                >
                                  {badge.label}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center mt-6 pb-4">
            <nav className="flex items-center space-x-1">
              <button
                onClick={() => paginate(1)}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                «
              </button>
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ‹
              </button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => paginate(pageNum)}
                    className={`px-3 py-1 rounded-lg border ${currentPage === pageNum
                      ? 'bg-black text-white border-black'
                      : 'border-gray-300 hover:bg-gray-50'
                      }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ›
              </button>
              <button
                onClick={() => paginate(totalPages)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                »
              </button>
            </nav>
            <div className="ml-4 text-sm text-gray-600">
              {indexOfFirstEmployee + 1}-{Math.min(indexOfLastEmployee, employeeList.length)} of {employeeList.length} employees
            </div>
          </div>
        )}
      </LayoutComponents>

      {selectedRecord && (
        <AttendanceModal
          record={selectedRecord}
          date={selectedDay}
          onClose={closeModal}
        />
      )}
    </div>
  );
};

export default Attendance;