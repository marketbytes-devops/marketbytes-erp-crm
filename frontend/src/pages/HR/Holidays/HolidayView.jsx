import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  format,
  isSameDay,
  startOfMonth,
  endOfMonth,
  eachWeekOfInterval,
  addDays,
  isToday,
  isWeekend,
  startOfWeek,
} from "date-fns";
import LayoutComponents from "../../../components/LayoutComponents";
import apiClient from "../../../helpers/apiClient";
import Input from "../../../components/Input";
import {
  MdAdd,
  MdDownload,
  MdCalendarToday,
  MdOutlineEdit,
  MdOutlineDelete,
  MdStar,
  MdStarBorder,
  MdChevronLeft,
  MdChevronRight,
  MdClose,
  MdArrowDropDown,
} from "react-icons/md";
import { usePermission } from "../../../context/PermissionContext";

const HolidayView = () => {
  const { hasPermission } = usePermission();
  const [holidays, setHolidays] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState(null);
  const [isCalendarView, setIsCalendarView] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [loading, setLoading] = useState(true);

  const [newHoliday, setNewHoliday] = useState({ date: "", occasion: "", is_default: false });

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);
  const months = Array.from({ length: 12 }, (_, i) =>
    new Date(0, i).toLocaleString("en-US", { month: "long" })
  );
  const monthOptions = months.map((month, index) => ({
    value: index,
    label: month,
  }));
  const yearOptions = years.map((year) => ({
    value: year,
    label: String(year),
  }));

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  useEffect(() => {
    fetchHolidays();
  }, [selectedYear]);

  const fetchHolidays = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/hr/holidays/?year=${selectedYear}`);
      setHolidays(Array.isArray(response.data) ? response.data : response.data?.results || []);
    } catch (error) {
      console.error("Error fetching holidays:", error);
      setHolidays([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddHoliday = async () => {
    if (!newHoliday.date || !newHoliday.occasion) {
      alert("Please fill in date and occasion.");
      return;
    }
    try {
      await apiClient.post("/hr/holidays/", newHoliday);
      setIsAddModalOpen(false);
      setNewHoliday({ date: "", occasion: "", is_default: false });
      fetchHolidays();
    } catch (error) {
      console.error("Error adding holiday:", error);
      alert("Failed to add holiday.");
    }
  };

  const handleEditHoliday = async () => {
    if (!editingHoliday || !newHoliday.date || !newHoliday.occasion) return;
    try {
      await apiClient.patch(`/hr/holidays/${editingHoliday.id}/`, newHoliday);
      setIsEditModalOpen(false);
      setEditingHoliday(null);
      setNewHoliday({ date: "", occasion: "", is_default: false });
      fetchHolidays();
    } catch (error) {
      console.error("Error editing holiday:", error);
    }
  };

  const openEditModal = (holiday) => {
    setEditingHoliday(holiday);
    setNewHoliday({
      date: holiday.date,
      occasion: holiday.occasion,
      is_default: holiday.is_default || false,
    });
    setIsEditModalOpen(true);
  };

  const toggleDefaultStatus = async (id) => {
    try {
      await apiClient.patch(`/hr/holidays/${id}/toggle_default/`);
      fetchHolidays();
    } catch (error) {
      console.error("Error toggling default status:", error);
    }
  };

  const deleteHoliday = async (id) => {
    if (!window.confirm("Are you sure you want to delete this holiday?")) return;
    try {
      await apiClient.delete(`/hr/holidays/${id}/`);
      fetchHolidays();
    } catch (error) {
      console.error("Error deleting holiday:", error);
    }
  };

  const handleExport = async (type) => {
    try {
      const response = await apiClient.get(`/hr/holidays/export_${type}/?year=${selectedYear}`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      const ext = type === "excel" ? "xlsx" : type;
      link.setAttribute("download", `Holidays_${selectedYear}.${ext}`);

      document.body.appendChild(link);
      link.click();
      link.remove();
      setShowExportMenu(false);
    } catch (error) {
      console.error(`Error exporting ${type}:`, error);
      alert(`Failed to export to ${type.toUpperCase()}`);
    }
  };

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const getHolidayForDay = (day) => {
    return holidays.find((h) => isSameDay(new Date(h.date), day));
  };

  const renderCalendar = () => {
    const monthStart = startOfMonth(new Date(selectedYear, selectedMonth));
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
    const weeks = eachWeekOfInterval({ start: startDate, end: monthEnd }, { weekStartsOn: 0 });

    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handlePrevMonth}
              className="p-2 rounded-lg hover:bg-gray-100 transition"
            >
              <MdChevronLeft className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-medium">
              {months[selectedMonth]} {selectedYear}
            </h3>
            <button
              onClick={handleNextMonth}
              className="p-2 rounded-lg hover:bg-gray-100 transition"
            >
              <MdChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {weekdays.map((day) => (
              <div key={day} className="py-3 text-sm font-medium text-gray-600">
                {day}
              </div>
            ))}
          </div>

          {weeks.map((weekStart, i) => (
            <div key={i} className="grid grid-cols-7 gap-1">
              {Array.from({ length: 7 }, (_, d) => {
                const day = addDays(weekStart, d);
                const isCurrentMonth = day.getMonth() === selectedMonth;
                const holiday = getHolidayForDay(day);
                const isTodayDate = isToday(day);

                return (
                  <div
                    key={d}
                    className={`min-h-20 p-2 rounded-lg border border-transparent transition ${isCurrentMonth ? "" : "text-gray-400"
                      } ${isTodayDate ? "bg-blue-50" : ""} ${isWeekend(day) ? "bg-gray-50" : ""
                      } hover:bg-gray-100`}
                  >
                    <div className="text-sm font-medium text-right">{format(day, "d")}</div>
                    {holiday && (
                      <div className="mt-1 text-xs text-red-700 font-medium truncate">
                        {holiday.occasion}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderMonthTable = (monthIndex) => {
    const monthHolidays = holidays
      .filter((h) => new Date(h.date).getMonth() === monthIndex)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    if (monthHolidays.length === 0) return null;

    return (
      <div key={monthIndex} className="mb-12">
        <h3 className="text-lg font-medium mb-4">
          {months[monthIndex]} {selectedYear}
        </h3>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    SL No
                  </th>
                  <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Occasion
                  </th>
                  <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Day
                  </th>
                  <th className="px-6 py-5 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {monthHolidays.map((holiday, idx) => (
                  <motion.tr
                    key={holiday.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="hover:bg-gray-50 transition"
                  >
                    <td className="px-6 py-5 text-sm text-gray-900">{idx + 1}</td>
                    <td className="px-6 py-5 text-sm text-gray-900">
                      {format(new Date(holiday.date), "MMMM d, yyyy")}
                    </td>
                    <td className="px-6 py-5 text-sm font-medium text-gray-900">
                      <div className="flex items-center gap-2">
                        {holiday.occasion}
                        {holiday.is_default && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Default
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm text-gray-600">
                      {format(new Date(holiday.date), "EEEE")}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-3">
                        {hasPermission("holidays", "edit") && (
                          <button
                            onClick={() => toggleDefaultStatus(holiday.id)}
                            className="p-2 hover:bg-yellow-50 rounded-lg transition group"
                            title={holiday.is_default ? "Remove default" : "Set as default"}
                          >
                            {holiday.is_default ? (
                              <MdStar className="w-5 h-5 text-yellow-600 group-hover:text-yellow-700" />
                            ) : (
                              <MdStarBorder className="w-5 h-5 text-gray-500 group-hover:text-yellow-600" />
                            )}
                          </button>
                        )}
                        {hasPermission("holidays", "edit") && (
                          <button
                            onClick={() => openEditModal(holiday)}
                            className="p-2 hover:bg-amber-50 rounded-lg transition group"
                          >
                            <MdOutlineEdit className="w-5 h-5 text-gray-600 group-hover:text-amber-600" />
                          </button>
                        )}
                        {hasPermission("holidays", "delete") && (
                          <button
                            onClick={() => deleteHoliday(holiday.id)}
                            className="p-2 hover:bg-red-50 rounded-lg transition group"
                          >
                            <MdOutlineDelete className="w-5 h-5 text-gray-600 group-hover:text-red-600" />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      <LayoutComponents title="Holidays" subtitle="Manage company holidays" variant="table">
        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex flex-wrap items-center gap-6">
              <Input
                type="select"
                value={selectedMonth}
                onChange={setSelectedMonth}
                options={monthOptions}
                placeholder="Select month"
              />

              <Input
                type="select"
                value={selectedYear}
                onChange={setSelectedYear}
                options={yearOptions}
                placeholder="Select year"
              />

              <button
                onClick={() => setIsCalendarView(!isCalendarView)}
                className="flex items-center gap-3 px-5 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition font-medium"
              >
                <MdCalendarToday className="w-5 h-5" />
                {isCalendarView ? "Table View" : "Calendar View"}
              </button>
            </div>

            <div className="flex gap-3">
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="flex items-center gap-2 px-5 py-4 border border-gray-300 rounded-xl hover:bg-gray-50 transition font-medium"
                >
                  <MdDownload className="w-5 h-5" />
                  Export
                  <MdArrowDropDown className="w-5 h-5" />
                </button>

                <AnimatePresence>
                  {showExportMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-20"
                    >
                      <button
                        onClick={() => handleExport("pdf")}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm font-medium text-gray-700"
                      >
                        Export as PDF
                      </button>
                      <button
                        onClick={() => handleExport("excel")}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm font-medium text-gray-700"
                      >
                        Export as Excel
                      </button>
                      <button
                        onClick={() => handleExport("csv")}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm font-medium text-gray-700"
                      >
                        Export as CSV
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {hasPermission("holidays", "add") && (
                <button
                  onClick={() => {
                    setNewHoliday({ date: "", occasion: "", is_default: false });
                    setIsAddModalOpen(true);
                  }}
                  className="flex items-center gap-3 px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-900 transition font-medium"
                >
                  <MdAdd className="w-5 h-5" />
                  Add Holiday
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-black border-t-transparent"></div>
          </div>
        ) : isCalendarView ? (
          renderCalendar()
        ) : holidays.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-16 text-center">
            <MdCalendarToday className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-xl font-medium text-gray-700">
              No holidays found for {selectedYear}
            </p>
          </div>
        ) : (
          <div>{months.map((_, i) => renderMonthTable(i))}</div>
        )}

        {/* Add Modal */}
        <AnimatePresence>
          {isAddModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 backdrop-brightness-50 flex items-center justify-center p-4 z-50"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-medium">Add New Holiday</h3>
                  <button
                    onClick={() => setIsAddModalOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                  >
                    <MdClose className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                    <input
                      type="date"
                      value={newHoliday.date}
                      onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Occasion</label>
                    <input
                      type="text"
                      placeholder="e.g. Christmas Day"
                      value={newHoliday.occasion}
                      onChange={(e) => setNewHoliday({ ...newHoliday, occasion: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black outline-none transition"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="default-add"
                      checked={newHoliday.is_default}
                      onChange={(e) => setNewHoliday({ ...newHoliday, is_default: e.target.checked })}
                      className="w-5 h-5 rounded border-gray-400 text-black focus:ring-black"
                    />
                    <label htmlFor="default-add" className="text-sm font-medium text-gray-700">
                      Set as default holiday (recurring annually)
                    </label>
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-8">
                  <button
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddHoliday}
                    className="px-6 py-3 bg-black text-white font-medium rounded-xl hover:bg-gray-900 transition"
                  >
                    Save Holiday
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Edit Modal */}
        <AnimatePresence>
          {isEditModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 backdrop-brightness-50 flex items-center justify-center p-4 z-50"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-medium">Edit Holiday</h3>
                  <button
                    onClick={() => {
                      setIsEditModalOpen(false);
                      setEditingHoliday(null);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                  >
                    <MdClose className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                    <input
                      type="date"
                      value={newHoliday.date}
                      onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Occasion</label>
                    <input
                      type="text"
                      value={newHoliday.occasion}
                      onChange={(e) => setNewHoliday({ ...newHoliday, occasion: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black outline-none transition"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="default-edit"
                      checked={newHoliday.is_default}
                      onChange={(e) => setNewHoliday({ ...newHoliday, is_default: e.target.checked })}
                      className="w-5 h-5 rounded border-gray-400 text-black focus:ring-black"
                    />
                    <label htmlFor="default-edit" className="text-sm font-medium text-gray-700">
                      Set as default holiday (recurring annually)
                    </label>
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-8">
                  <button
                    onClick={() => {
                      setIsEditModalOpen(false);
                      setEditingHoliday(null);
                    }}
                    className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEditHoliday}
                    className="px-6 py-3 bg-black text-white font-medium rounded-xl hover:bg-gray-900 transition"
                  >
                    Update Holiday
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </LayoutComponents>
    </div>
  );
};

export default HolidayView;