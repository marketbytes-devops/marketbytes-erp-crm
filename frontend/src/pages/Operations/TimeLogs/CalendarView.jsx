import React, { useState, useEffect } from "react";
import apiClient from "../../../helpers/apiClient";
import LayoutComponents from "../../../components/LayoutComponents";
import {
  MdChevronLeft,
  MdChevronRight,
  MdToday,
  MdViewWeek,
  MdViewModule,
  MdViewDay,
  MdList,
  MdAdd
} from "react-icons/md";
import { FiArrowLeft } from "react-icons/fi";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const formatMonth = (date) =>
  date.toLocaleString("default", { month: "long", year: "numeric" });

const formatDay = (date) =>
  date.toLocaleDateString("default", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

const getWeekRange = (date) => {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay());
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  const fmt = (d) =>
    d.toLocaleDateString("default", { month: "short", day: "numeric" });

  return `${fmt(start)} – ${fmt(end)}, ${start.getFullYear()}`;
};

const getWeekDays = (currentDate) => {
  const start = new Date(currentDate);
  start.setDate(start.getDate() - start.getDay()); // Sunday of current week

  return Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(start.getTime()); // clone date
    d.setDate(d.getDate() + i); // add i days
    const dayName = d.toLocaleDateString("default", { weekday: "short" });
    const month = d.getMonth() + 1; // month number
    const date = d.getDate(); // day number
    return {
      day: `${dayName} ${month}/${date}`,
      dateObj: d,
      hours: "", // can be dynamic
    };
  });
};

/* ---------- COMPONENT ---------- */
const CalendarView = () => {
  const [view, setView] = useState("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [productiveHoursData, setProductiveHoursData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch productive hours data from backend
  const fetchProductiveHours = async (startDate, endDate) => {
    try {
      setLoading(true);
      setError(null);
      
      const start = startDate.toISOString().split('T')[0];
      const end = endDate.toISOString().split('T')[0];
      
      const response = await apiClient.get('/hr/work-sessions/daily-productive-hours/', {
        params: { start_date: start, end_date: end }
      });
      
      // Convert array to object for easy lookup by date
      const dataMap = {};
      response.data.results.forEach(item => {
        dataMap[item.date] = item;
      });
      
      setProductiveHoursData(dataMap);
    } catch (err) {
      console.error('Error fetching productive hours:', err);
      setError('Failed to load productive hours data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when view or currentDate changes
  useEffect(() => {
    const getDateRange = () => {
      const d = new Date(currentDate);
      let start, end;

      if (view === "month") {
        // Get first and last day of month
        start = new Date(d.getFullYear(), d.getMonth(), 1);
        end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      } else if (view === "week" || view === "list") {
        // Get Sunday to Saturday of current week
        start = new Date(d);
        start.setDate(d.getDate() - d.getDay());
        end = new Date(start);
        end.setDate(start.getDate() + 6);
      } else if (view === "day") {
        // Just the current day
        start = new Date(d);
        end = new Date(d);
      }

      return { start, end };
    };

    const { start, end } = getDateRange();
    fetchProductiveHours(start, end);
  }, [view, currentDate]);

  const handlePrev = () => {
    const d = new Date(currentDate);
    if (view === "month") d.setMonth(d.getMonth() - 1);
    if (view === "week" || view === "list") d.setDate(d.getDate() - 7);
    if (view === "day") d.setDate(d.getDate() - 1);
    setCurrentDate(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (view === "month") d.setMonth(d.getMonth() + 1);
    if (view === "week" || view === "list") d.setDate(d.getDate() + 7);
    if (view === "day") d.setDate(d.getDate() + 1);
    setCurrentDate(d);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <div className="p-6">
      <LayoutComponents
        title="Calendar Logs"
        subtitle="Time tracking in calendar perspective"
        variant="table"
      >
        <div className="max-w-full mx-auto">
          {/* Navigation */}
          <div className="mb-6">
            <Link to="/operations/time-logs" className="group inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-black transition-colors">
              <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" /> Back to Time Logs
            </Link>
          </div>

          {/* HEADER */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-gray-100 rounded-xl p-1">
                <button
                  onClick={handlePrev}
                  className="p-2 text-gray-600 hover:text-black hover:bg-white rounded-lg transition-all shadow-none hover:shadow-sm"
                >
                  <MdChevronLeft className="w-6 h-6" />
                </button>
                <div className="h-6 w-px bg-gray-300 mx-1"></div>
                <button
                  onClick={handleNext}
                  className="p-2 text-gray-600 hover:text-black hover:bg-white rounded-lg transition-all shadow-none hover:shadow-sm"
                >
                  <MdChevronRight className="w-6 h-6" />
                </button>
              </div>

              <button
                onClick={handleToday}
                className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition text-sm flex items-center gap-2"
              >
                <MdToday className="w-4 h-4" /> Today
              </button>

              <span className="text-xl font-medium text-gray-900 ml-2">
                {view === "month" && formatMonth(currentDate)}
                {view === "week" && getWeekRange(currentDate)}
                {view === "list" && getWeekRange(currentDate)}
                {view === "day" && formatDay(currentDate)}
              </span>
            </div>

            <div className="flex gap-4">
              <div className="flex bg-gray-100 p-1 rounded-xl">
                {[
                  { id: "month", icon: MdViewModule, label: "Month" },
                  { id: "week", icon: MdViewWeek, label: "Week" },
                  { id: "day", icon: MdViewDay, label: "Day" },
                  { id: "list", icon: MdList, label: "List" }
                ].map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setView(v.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === v.id ? "bg-white text-black shadow-sm" : "text-gray-500 hover:text-black"
                      }`}
                  >
                    <v.icon className="w-4 h-4" /> {v.label}
                  </button>
                ))}
              </div>
              <Link to='/operations/time-logs'>
              <button className="flex items-center gap-2 px-6 py-2 bg-black text-white rounded-xl hover:bg-gray-900 transition text-sm font-medium">
                <MdAdd className="w-5 h-5" /> Log Time
              </button>
              </Link>
            </div>
          </div>

          {/* BODY */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm min-h-[600px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={view + currentDate.toString()}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                {view === "month" && (
                  <MonthView
                    date={currentDate}
                    productiveHoursData={productiveHoursData}
                    loading={loading}
                    onDayClick={(day) => {
                      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
                      setView("day");
                    }}
                  />
                )}
                {view === "week" && <WeekView currentDate={currentDate} productiveHoursData={productiveHoursData} loading={loading} />}
                {view === "day" && <DayView currentDate={currentDate} productiveHoursData={productiveHoursData} loading={loading} />}
                {view === "list" && <ListView currentDate={currentDate} productiveHoursData={productiveHoursData} loading={loading} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </LayoutComponents>
    </div>
  );
};

/* ---------- MONTH VIEW ---------- */
const MonthView = ({ date, productiveHoursData, loading, onDayClick }) => {
  const year = date.getFullYear();
  const month = date.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Helper function to format hours
  const formatHours = (hours) => {
    if (!hours || hours === 0) return null;
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  // Get productive hours for a specific date
  const getProductiveHours = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return productiveHoursData[dateStr];
  };

  return (
    <div className="h-full flex flex-col">
      <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="p-4 text-center text-sm font-medium text-gray-500 uppercase tracking-wide">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 flex-1 auto-rows-fr">
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="border-b border-r border-gray-100 bg-gray-50/30 min-h-[120px]" />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dayData = getProductiveHours(day);
          const hoursFormatted = dayData ? formatHours(dayData.total_productive_hours) : null;

          return (
            <div
              key={i}
              onClick={() => onDayClick(day)}
              className="border-b border-r border-gray-100 min-h-[120px] p-2 hover:bg-gray-50 cursor-pointer transition relative group"
            >
              <span className="flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium text-gray-700 m-1 group-hover:bg-black group-hover:text-white transition-colors">
                {day}
              </span>

              {loading && day === 1 && (
                <div className="mt-1 text-center">
                  <div className="text-[10px] text-gray-400">Loading...</div>
                </div>
              )}

              {!loading && hoursFormatted && (
                <div className="mt-1">
                  <div className="text-[10px] bg-green-50 text-green-700 border border-green-100 rounded px-2 py-1 truncate font-medium text-center">
                    {hoursFormatted}
                  </div>
                  {dayData.employee_count > 0 && (
                    <div className="text-[9px] text-gray-500 text-center mt-0.5">
                      {dayData.employee_count} emp{dayData.employee_count > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {/* Fill remaining cells */}
        {Array.from({ length: (42 - (firstDay + daysInMonth)) % 7 }).map((_, i) => (
          <div key={`end-empty-${i}`} className="border-b border-r border-gray-100 bg-gray-50/30 min-h-[120px]" />
        ))}
      </div>
    </div>
  );
};

/* ---------- WEEK VIEW  ---------- */
const WeekView = ({ currentDate, productiveHoursData, loading }) => {
  const weekDays = getWeekDays(currentDate);

  const formatHours = (hours) => {
    if (!hours || hours === 0) return "0h";
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  const getProductiveHoursForDate = (dateObj) => {
    const dateStr = dateObj.toISOString().split('T')[0];
    return productiveHoursData[dateStr];
  };

  return (
    <div className="overflow-x-auto h-full">
      <table className="w-full h-full border-collapse min-w-[800px]">
        <thead>
          <tr>
            <th className="border-b border-r border-gray-200 p-4 w-20 bg-gray-50"></th>
            {weekDays.map((d) => {
              const dayData = getProductiveHoursForDate(d.dateObj);
              return (
                <th key={d.dateObj} className="border-b border-r border-gray-200 p-4 text-center bg-gray-50">
                  <p className="text-xs font-medium text-gray-500 uppercase">{d.day.split(' ')[0]}</p>
                  <p className="text-lg font-medium text-gray-900">{d.day.split(' ')[1]}</p>
                  {dayData && (
                    <p className="text-xs text-green-600 font-medium mt-1">
                      {formatHours(dayData.total_productive_hours)}
                    </p>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border-r border-gray-200 p-2 align-top bg-gray-50/30">
              <div className="text-xs text-gray-400 text-center mt-2">Total Hours</div>
            </td>
            {weekDays.map((d) => {
              const dayData = getProductiveHoursForDate(d.dateObj);
              return (
                <td key={d.dateObj} className="border-r border-gray-200 p-2 align-top h-[500px] relative hover:bg-gray-50/50 transition">
                  {loading ? (
                    <div className="text-center text-gray-400 text-xs mt-4">Loading...</div>
                  ) : dayData ? (
                    <div className="p-3 bg-green-50 border border-green-100 rounded-lg text-center">
                      <p className="text-lg font-bold text-green-700">{formatHours(dayData.total_productive_hours)}</p>
                      <p className="text-xs text-gray-600 mt-1">{dayData.employee_count} employee{dayData.employee_count > 1 ? 's' : ''}</p>
                    </div>
                  ) : (
                    <div className="text-center text-gray-400 text-xs mt-4">No logs</div>
                  )}
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
};

/* ---------- DAY VIEW  ---------- */
const DayView = ({ currentDate, productiveHoursData, loading }) => {
  const formatHours = (hours) => {
    if (!hours || hours === 0) return "0h";
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  const dateStr = currentDate.toISOString().split('T')[0];
  const dayData = productiveHoursData[dateStr];

  return (
    <div className="h-full overflow-y-auto">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 p-4 flex justify-between items-center shadow-sm">
        <div>
          <p className="text-2xl font-medium text-gray-900">{currentDate.toLocaleDateString("default", { weekday: "long" })}</p>
          <p className="text-gray-500 text-sm">{currentDate.toLocaleDateString("default", { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-gray-500">Total Productive Hours</p>
          {loading ? (
            <p className="text-xl font-medium text-gray-400">Loading...</p>
          ) : dayData ? (
            <>
              <p className="text-xl font-medium text-green-600">{formatHours(dayData.total_productive_hours)}</p>
              <p className="text-xs text-gray-500 mt-1">{dayData.employee_count} employee{dayData.employee_count > 1 ? 's' : ''}</p>
            </>
          ) : (
            <p className="text-xl font-medium text-gray-400">No logs</p>
          )}
        </div>
      </div>

      <div className="p-8 text-center">
        {loading ? (
          <div className="text-gray-400">Loading data...</div>
        ) : dayData ? (
          <div className="max-w-md mx-auto bg-green-50 border-2 border-green-200 rounded-2xl p-8">
            <div className="text-6xl font-bold text-green-700 mb-2">
              {formatHours(dayData.total_productive_hours)}
            </div>
            <p className="text-gray-600 text-lg">Total Productive Hours</p>
            <p className="text-gray-500 text-sm mt-2">
              Across {dayData.employee_count} employee{dayData.employee_count > 1 ? 's' : ''}
            </p>
          </div>
        ) : (
          <div className="text-gray-400 text-lg">No time logs for this day</div>
        )}
      </div>
    </div>
  );
};

/* ---------- LIST VIEW ---------- */
const ListView = ({ currentDate, productiveHoursData, loading }) => {
  const weekDays = getWeekDays(currentDate);

  const formatHours = (hours) => {
    if (!hours || hours === 0) return "0h";
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  const getProductiveHoursForDate = (dateObj) => {
    const dateStr = dateObj.toISOString().split('T')[0];
    return productiveHoursData[dateStr];
  };

  return (
    <div className="divide-y divide-gray-200">
      {weekDays.map((d, i) => {
        const dayData = getProductiveHoursForDate(d.dateObj);
        
        return (
          <div key={i} className="p-6 hover:bg-gray-50 transition flex items-start gap-6">
            <div className="w-32 shrink-0 text-center">
              <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">{d.dateObj.toLocaleDateString("default", { month: "short" })}</div>
              <div className="text-3xl font-light text-gray-900">{d.dateObj.getDate()}</div>
              <div className="text-xs font-medium text-gray-400 uppercase mt-1">{d.dateObj.toLocaleDateString("default", { weekday: "short" })}</div>
            </div>

            <div className="flex-1 space-y-3">
              {loading ? (
                <div className="p-8 text-center border-2 border-dashed border-gray-100 rounded-xl">
                  <p className="text-gray-400 text-sm">Loading...</p>
                </div>
              ) : dayData ? (
                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex justify-between items-center group hover:border-green-500 transition-colors">
                  <div>
                    <p className="font-medium text-gray-900">Total Productive Hours</p>
                    <p className="text-sm text-gray-500">{dayData.employee_count} employee{dayData.employee_count > 1 ? 's' : ''} worked</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-medium text-green-600">{formatHours(dayData.total_productive_hours)}</p>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center border-2 border-dashed border-gray-100 rounded-xl">
                  <p className="text-gray-400 text-sm">No time logged</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CalendarView;