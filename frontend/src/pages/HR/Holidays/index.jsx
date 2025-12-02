import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import LayoutComponents from "../../../components/LayoutComponents";
import apiClient from "../../../helpers/apiClient";
import { MdAdd, MdDownload, MdCalendarToday } from "react-icons/md";

const Holidays = () => {
  const [holidays, setHolidays] = useState([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiClient
      .get("/hr/holidays/", { params: { year } })
      .then((res) => {
        let data = res.data;

        if (data && data.results) {
          data = data.results; // DRF pagination
        }

        const holidaysArray = Array.isArray(data) ? data : [];
        setHolidays(holidaysArray);
      })
      .catch((err) => {
        console.error("Failed to load holidays:", err);
        setHolidays([]);
      })
      .finally(() => setLoading(false));
  }, [year]);

  return (
    <div className="p-6">
      <LayoutComponents title="Holidays" subtitle="Manage company holidays" variant="card">
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex flex-wrap gap-4 justify-between items-center">
            <div className="flex gap-4 items-center">
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-32 px-5 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black outline-none"
                min="2000"
                max="2100"
              />
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3.5 bg-black text-white rounded-xl hover:bg-gray-900 transition font-medium"
              >
                View
              </button>
            </div>
            <div className="flex gap-3">
              <button className="flex items-center gap-3 px-6 py-3.5 border border-gray-300 rounded-xl hover:bg-gray-50 transition">
                <MdDownload className="w-5 h-5" /> Export
              </button>
              <button className="flex items-center gap-3 px-6 py-3.5 bg-black text-white rounded-xl hover:bg-gray-900 transition font-medium">
                <MdAdd className="w-5 h-5" /> Add Holiday
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-black border-t-transparent"></div>
          </div>
        ) : holidays.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <MdCalendarToday className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-xl font-medium">No holidays found for {year}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {holidays.map((h, i) => (
              <motion.div
                key={h.id || i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -6 }}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-14 h-14 bg-linear-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white shadow-md">
                    <MdCalendarToday className="w-7 h-7" />
                  </div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {h.day || new Date(h.date).toLocaleDateString("en-US", { weekday: "short" })}
                  </span>
                </div>
                <h4 className="text-lg font-bold text-gray-900 line-clamp-2">{h.occasion}</h4>
                <p className="text-2xl font-bold mt-3 text-black">
                  {new Date(h.date).toLocaleDateString("en-US", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                {h.is_default && (
                  <span className="inline-block mt-4 px-4 py-1.5 bg-green-100 text-green-800 text-xs font-bold rounded-full">
                    Default Holiday
                  </span>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </LayoutComponents>
    </div>
  );
};

export default Holidays;