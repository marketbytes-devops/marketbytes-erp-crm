import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  format, 
  startOfYear, 
  endOfYear, 
  eachMonthOfInterval, 
  isSameDay,
  startOfMonth,
  endOfMonth,
  eachWeekOfInterval,
  addDays,
  subMonths,
  addMonths,
  getWeek,
  isToday,
  isWeekend,
  startOfWeek
} from "date-fns";
import { enUS } from "date-fns/locale";
import LayoutComponents from "../../../components/LayoutComponents";
import apiClient from "../../../helpers/apiClient";
import { 
  MdAdd, 
  MdDownload, 
  MdCalendarToday, 
  MdOutlineEdit, 
  MdOutlineDelete,
  MdStar,
  MdStarBorder,
  MdViewWeek,
  MdChevronLeft,
  MdChevronRight
} from "react-icons/md";

const HolidayView = () => {
  const [holidays, setHolidays] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()); // Now used for calendar navigation
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState(null);
  const [isCalendarView, setIsCalendarView] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // NEW: State for add/edit modal form
  const [newHoliday, setNewHoliday] = useState({ date: '', occasion: '', is_default: false });

  // Generate years for dropdown (current year ± 5 years)
  const years = Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i);
  const months = Array.from({ length: 12 }, (_, i) => 
    new Date(0, i).toLocaleString('en-US', { month: 'long' })
  );

  // Weekday headers (FIX: Hardcoded since no 'eachDayOfWeek' in date-fns)
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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

  // NEW: Handle add holiday
  const handleAddHoliday = async () => {
    if (!newHoliday.date || !newHoliday.occasion) {
      alert("Please fill in date and occasion.");
      return;
    }
    try {
      await apiClient.post('/hr/holidays/', {
        ...newHoliday,
        date: newHoliday.date, // Ensure date format (YYYY-MM-DD)
        is_default: newHoliday.is_default
      });
      setIsAddModalOpen(false);
      setNewHoliday({ date: '', occasion: '', is_default: false });
      fetchHolidays(); // REFRESH: Now shows in correct month/table
    } catch (error) {
      console.error("Error adding holiday:", error);
      alert("Failed to add holiday.");
    }
  };

  // NEW: Handle edit holiday (basic stub; expand as needed)
  const handleEditHoliday = async () => {
    if (!editingHoliday || !newHoliday.date || !newHoliday.occasion) return;
    try {
      await apiClient.patch(`/hr/holidays/${editingHoliday.id}/`, {
        ...newHoliday,
        date: newHoliday.date,
        is_default: newHoliday.is_default
      });
      setIsEditModalOpen(false);
      setEditingHoliday(null);
      setNewHoliday({ date: '', occasion: '', is_default: false });
      fetchHolidays();
    } catch (error) {
      console.error("Error editing holiday:", error);
    }
  };

  // NEW: Open edit modal
  const openEditModal = (holiday) => {
    setEditingHoliday(holiday);
    setNewHoliday({
      date: holiday.date,
      occasion: holiday.occasion,
      is_default: holiday.is_default || false
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
    if (window.confirm("Are you sure you want to delete this holiday?")) {
      try {
        await apiClient.delete(`/hr/holidays/${id}/`);
        fetchHolidays();
      } catch (error) {
        console.error("Error deleting holiday:", error);
      }
    }
  };
  const handleExport = () => {
    if (holidays.length === 0) {
      alert("No holidays to export for the selected year.");
      return;
    }

    const sortedHolidays = [...holidays].sort((a, b) => new Date(a.date) - new Date(b.date));

    const headers = "SL No,Date,Day,Occasion,Default Holiday\n";
    const rows = sortedHolidays
      .map((holiday, index) => {
        const date = format(new Date(holiday.date), "MMMM d, yyyy");
        const day = format(new Date(holiday.date), "EEEE");
        const occasion = holiday.occasion.replace(/"/g, '""');
        const isDefault = holiday.is_default ? "Yes" : "No";
        return `${index + 1},"${date}","${day}","${occasion}","${isDefault}"`;
      })
      .join("\n");

    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(headers + rows);

    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", `Holidays_${selectedYear}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // NEW: Calendar navigation
  const handlePrevMonth = () => {
    setSelectedMonth(prev => prev === 0 ? 11 : prev - 1);
    if (selectedMonth === 0) setSelectedYear(prev => prev - 1);
  };

  const handleNextMonth = () => {
    setSelectedMonth(prev => prev === 11 ? 0 : prev + 1);
    if (selectedMonth === 11) setSelectedYear(prev => prev + 1);
  };

  // NEW: Get holidays for a specific day
  const getHolidayForDay = (day) => {
    return holidays.find(h => isSameDay(new Date(h.date), day));
  };

  // NEW: Render calendar grid for selected month/year
  const renderCalendar = () => {
    const monthStart = startOfMonth(new Date(selectedYear, selectedMonth, 1));
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday start
    const weeks = eachWeekOfInterval({ start: startDate, end: monthEnd });

    const monthHolidays = holidays.filter(
      h => new Date(h.date).getMonth() === selectedMonth && new Date(h.date).getFullYear() === selectedYear
    );


  

    return (
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-6">Holiday Calendar - {months[selectedMonth]} {selectedYear}</h2>
        
        {/* NEW: Month navigation */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={handlePrevMonth} className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200">
            <MdChevronLeft className="w-5 h-5" />
          </button>
          <h3 className="text-lg font-medium">{months[selectedMonth]} {selectedYear}</h3>
          <button onClick={handleNextMonth} className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200">
            <MdChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* NEW: Days header (FIX: Use hardcoded weekdays array) */}
        <div className="grid grid-cols-7 gap-1 mb-2 text-center">
          {weekdays.map((day, i) => (
            <div key={i} className="p-2 font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>

        {/* NEW: Weeks and days grid (FIX: Replace eachDayOfWeek with addDays loop) */}
        {weeks.map((weekStart, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 gap-1 mb-2">
            {Array.from({ length: 7 }, (_, dayIndex) => {
              const day = addDays(weekStart, dayIndex);
              const isInMonth = day >= monthStart && day <= monthEnd;
              const holiday = getHolidayForDay(day);
              const dayClass = `p-2 text-center rounded cursor-pointer hover:bg-gray-100 transition-colors ${
                isToday(day) ? 'bg-blue-100 text-blue-800 font-semibold' : 
                isInMonth ? 'text-gray-900' : 'text-gray-300'
              } ${isWeekend(day) ? 'bg-gray-50' : ''}`;

              return (
                <div key={dayIndex} className={dayClass}>
                  <div className="text-sm font-medium">{format(day, 'd')}</div>
                  {holiday && (
                    <div className="mt-1 text-xs text-red-600 font-medium truncate">
                      {holiday.occasion.length > 10 ? `${holiday.occasion.substring(0, 10)}...` : holiday.occasion}
                    </div>
                  )}
                  {holiday && !isInMonth && (
                    <div className="mt-1 w-2 h-2 bg-red-500 rounded-full mx-auto"></div> // Dot for out-of-month holidays
                  )}
                </div>
              );
            })}
          </div>
        ))}

        {/* NEW: Summary of holidays in month */}
        {monthHolidays.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <h4 className="font-medium mb-2">Holidays this month:</h4>
            <ul className="space-y-1">
              {monthHolidays.map(holiday => (
                <li key={holiday.id} className="flex items-center text-sm text-gray-700">
                  <span className="w-20">{format(new Date(holiday.date), 'MMM d')}</span>
                  <span className="flex-1">{holiday.occasion}</span>
                  {holiday.is_default && <MdStar className="w-4 h-4 text-yellow-500 ml-2" />}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const renderMonthTable = (monthIndex) => {
    const monthHolidays = holidays.filter(
      h => new Date(h.date).getMonth() === monthIndex
    ).sort((a, b) => new Date(a.date) - new Date(b.date));

    if (monthHolidays.length === 0) return null;

    return (
      <div key={monthIndex} className="mb-8">
        <h3 className="text-lg font-semibold mb-4">{months[monthIndex]} {selectedYear}</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SL No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Occasion</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Day</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {monthHolidays.map((holiday, index) => (
                <tr key={holiday.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {format(new Date(holiday.date), 'MMMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {holiday.occasion}
                    {holiday.is_default && (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Default
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(holiday.date), 'EEEE')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => toggleDefaultStatus(holiday.id)}
                      className="text-yellow-600 hover:text-yellow-900 mr-3"
                      title={holiday.is_default ? "Remove as default" : "Set as default"}
                    >
                      {/* {holiday.is_default ? <MdStar className="w-5 h-5" /> : <MdStarBorder className="w-5 h-5" />} */}
                    </button>
                    {/* CHANGED: Now functional */}
                    <button 
                      onClick={() => openEditModal(holiday)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      <MdOutlineEdit className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => deleteHoliday(holiday.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <MdOutlineDelete className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      <LayoutComponents 
        title="Holidays" 
        subtitle="Manage company holidays and view calendar"
        variant="card"
      >
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div className="flex items-center space-x-4">
              {/* CHANGED: Added month selector (used in calendar view) */}
              <div className="relative">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {months.map((month, i) => (
                    <option key={i} value={i}>{month}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                  </svg>
                </div>
              </div>
              
              <div className="relative">
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                  </svg>
                </div>
              </div>
              
              <button
                onClick={() => setIsCalendarView(!isCalendarView)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
                  isCalendarView 
                    ? 'bg-blue-100 text-blue-700 border-blue-200' 
                    : 'bg-white text-gray-700 border-gray-300'
                }`}
              >
                <MdCalendarToday className="w-5 h-5" />
                {isCalendarView ? 'Table View' : 'Calendar View'}
              </button>
            </div>
            
            <div className="flex gap-3">
             <button 
  onClick={handleExport}
  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
>
  <MdDownload className="w-5 h-5" />
  Export
</button>
              <button 
                onClick={() => {
                  setNewHoliday({ date: '', occasion: '', is_default: false });
                  setIsAddModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <MdAdd className="w-5 h-5" />
                Add Holiday
              </button>
            </div>
          </div>
        </div>

        {isCalendarView ? (
          // CHANGED: Now renders proper calendar grid (shows holidays on exact days/weeks)
          !loading && renderCalendar()
        ) : (
          // Unchanged: Table view for all months
          <div className="space-y-8">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-black border-t-transparent"></div>
              </div>
            ) : holidays.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <MdCalendarToday className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-xl font-medium">No holidays found for {selectedYear}</p>
              </div>
            ) : (
              months.map((_, index) => renderMonthTable(index))
            )}
          </div>
        )}

        {/* CHANGED: Add Holiday Modal - Now functional with state */}
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl w-full max-w-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Add New Holiday</h3>
                <button 
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={newHoliday.date}
                    onChange={(e) => setNewHoliday({...newHoliday, date: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Occasion</label>
                  <input
                    type="text"
                    placeholder="E.g., New Year's Day"
                    value={newHoliday.occasion}
                    onChange={(e) => setNewHoliday({...newHoliday, occasion: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    id="default-holiday"
                    type="checkbox"
                    checked={newHoliday.is_default}
                    onChange={(e) => setNewHoliday({...newHoliday, is_default: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="default-holiday" className="ml-2 block text-sm text-gray-700">
                    Set as default holiday (recurring every year)
                  </label>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button onClick={handleAddHoliday} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Save Holiday
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* NEW: Edit Holiday Modal (similar to add, reuse form) */}
        {isEditModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl w-full max-w-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Edit Holiday</h3>
                <button 
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingHoliday(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={newHoliday.date}
                    onChange={(e) => setNewHoliday({...newHoliday, date: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Occasion</label>
                  <input
                    type="text"
                    value={newHoliday.occasion}
                    onChange={(e) => setNewHoliday({...newHoliday, occasion: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    id="default-holiday-edit"
                    type="checkbox"
                    checked={newHoliday.is_default}
                    onChange={(e) => setNewHoliday({...newHoliday, is_default: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="default-holiday-edit" className="ml-2 block text-sm text-gray-700">
                    Set as default holiday (recurring every year)
                  </label>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => {
                      setIsEditModalOpen(false);
                      setEditingHoliday(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button onClick={handleEditHoliday} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Update Holiday
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </LayoutComponents>
    </div>
  );
};

export default HolidayView;




