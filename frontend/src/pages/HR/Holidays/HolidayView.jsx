import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { format, startOfYear, endOfYear, eachMonthOfInterval, isSameDay } from "date-fns";
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
  MdViewWeek
} from "react-icons/md";

const HolidayView = () => {
  const [holidays, setHolidays] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCalendarView, setIsCalendarView] = useState(false);
  const [loading, setLoading] = useState(true);

  // Generate years for dropdown (current year ± 5 years)
  const years = Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i);
  const months = Array.from({ length: 12 }, (_, i) => 
    new Date(0, i).toLocaleString('en-US', { month: 'long' })
  );

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
                      {holiday.is_default ? <MdStar className="w-5 h-5" /> : <MdStarBorder className="w-5 h-5" />}
                    </button>
                    <button className="text-blue-600 hover:text-blue-900 mr-3">
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
              <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                <MdDownload className="w-5 h-5" />
                Export
              </button>
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <MdAdd className="w-5 h-5" />
                Add Holiday
              </button>
            </div>
          </div>
        </div>

        {isCalendarView ? (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-6">Holiday Calendar</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {months.map((month, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <h3 className="font-medium text-lg mb-3">{month} {selectedYear}</h3>
                  <div className="space-y-2">
                    {holidays
                      .filter(h => new Date(h.date).getMonth() === index)
                      .map(holiday => (
                        <div key={holiday.id} className="flex items-center p-2 bg-gray-50 rounded">
                          <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                          <span className="text-sm">
                            {format(new Date(holiday.date), 'd')} - {holiday.occasion}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
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

        {/* Add Holiday Modal */}
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Occasion</label>
                  <input
                    type="text"
                    placeholder="E.g., New Year's Day"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    id="default-holiday"
                    type="checkbox"
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
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Save Holiday
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