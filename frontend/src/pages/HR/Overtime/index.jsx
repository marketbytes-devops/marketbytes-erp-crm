import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import LayoutComponents from "../../../components/LayoutComponents";
import apiClient from "../../../helpers/apiClient";
import { MdAdd, MdDownload, MdRefresh, MdCalculate } from "react-icons/md";
import Input from "../../../components/Input";

const Overtime = () => {
  const [overtime, setOvertime] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [calculating, setCalculating] = useState(false);

  const months = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];

  useEffect(() => {
    fetchOvertime();
  }, [month, year]);

  const fetchOvertime = () => {
    setLoading(true);
    apiClient
      .get("/hr/overtime/", { params: { month, year } })
      .then((res) => {
        let data = res.data;
        if (data && data.results) {
          data = data.results;
        }
        const overtimeArray = Array.isArray(data) ? data : [];
        setOvertime(overtimeArray);
      })
      .catch((err) => {
        console.error("Failed to load overtime records:", err);
        setOvertime([]);
      })
      .finally(() => setLoading(false));
  };

  const calculateOvertime = () => {
    const today = new Date().toISOString().split('T')[0];
    setCalculating(true);

    apiClient
      .post("/hr/overtime/calculate_from_sessions/", { date: today })
      .then((res) => {
        alert(res.data.message);
        fetchOvertime();
      })
      .catch((err) => {
        const errorMsg = err.response?.data?.message || err.response?.data?.error || "Failed to calculate overtime";
        alert(errorMsg);
      })
      .finally(() => setCalculating(false));
  };

  const totalOvertimeHours = overtime.reduce((sum, ot) => sum + (parseFloat(ot.hours) || 0), 0);

  return (
    <div className="p-6">
      <LayoutComponents title="Overtime" subtitle="Track extra working hours beyond 8 hours productive time" variant="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
          >
            <p className="text-gray-600 text-sm">Total Overtime Records</p>
            <p className="text-4xl font-medium mt-3">{overtime.length}</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
          >
            <p className="text-gray-600 text-sm">Total Overtime Hours</p>
            <p className="text-4xl font-medium mt-3">{totalOvertimeHours.toFixed(2)}h</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
          >
            <p className="text-gray-600 text-sm">Average Per Record</p>
            <p className="text-4xl font-medium mt-3">
              {overtime.length > 0 ? (totalOvertimeHours / overtime.length).toFixed(2) : 0}h
            </p>
          </motion.div>
        </div>

        {/* Actions Bar */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex flex-wrap gap-4 justify-between items-center">
            <div className="flex flex-wrap gap-4 items-center">
              <Input
                type="select"
                value={month}
                onChange={setMonth}
                options={months}
                placeholder="Select month"
                className="w-48"
              />
              <Input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                placeholder="Year"
                className="w-32"
                min="2000"
                max="2100"
              />
              <button
                onClick={fetchOvertime}
                className="flex items-center gap-3 px-6 py-3.5 bg-black text-white rounded-xl hover:bg-gray-900 transition font-medium"
              >
                <MdRefresh className="w-5 h-5" />
                Refresh
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={calculateOvertime}
                disabled={calculating}
                className="flex items-center gap-3 px-6 py-3.5 bg-black text-white rounded-xl hover:bg-black transition font-medium disabled:opacity-50"
              >
                {calculating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    Calculating...
                  </>
                ) : (
                  <>
                    <MdCalculate className="w-5 h-5" />
                    Calculate Today's OT
                  </>
                )}
              </button>

              <button className="flex items-center gap-3 px-6 py-3.5 border border-gray-300 rounded-xl hover:bg-gray-50 transition font-medium">
                <MdDownload className="w-5 h-5" /> Export
              </button>
            </div>
          </div>
        </div>

        {/* Overtime Table */}
        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-black border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Loading overtime records...</p>
          </div>
        ) : overtime.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-16 text-center text-gray-500">
            <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <MdAdd className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-xl font-medium">No overtime records found</p>
            <p className="text-sm mt-2">Overtime is automatically tracked when productive hours exceed 8 hours</p>
            <button
              onClick={calculateOvertime}
              className="mt-6 flex items-center gap-3 px-6 py-3.5 bg-black text-white rounded-xl hover:bg-black transition font-medium mx-auto"
            >
              <MdCalculate className="w-5 h-5" />
              Calculate Today's Overtime
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-max">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-5 text-left text-sm font-medium text-gray-700">Employee</th>
                    <th className="px-6 py-5 text-left text-sm font-medium text-gray-700">Project</th>
                    <th className="px-6 py-5 text-left text-sm font-medium text-gray-700">Date</th>
                    <th className="px-6 py-5 text-left text-sm font-medium text-gray-700">Overtime Hours</th>
                    <th className="px-6 py-5 text-left text-sm font-medium text-gray-700">Effort Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {overtime.map((ot, i) => (
                    <motion.tr
                      key={ot.id || i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="hover:bg-gray-50 transition"
                    >
                      <td className="px-6 py-5 text-sm font-medium text-gray-900">
                        {ot.employee?.name || "Unknown"}
                      </td>
                      <td className="px-6 py-5 text-sm text-gray-700">
                        <span className="inline-flex px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          {ot.project || "—"}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-sm text-gray-700">
                        {ot.date ? new Date(ot.date).toLocaleDateString("en-US", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          weekday: "short"
                        }) : "—"}
                      </td>
                      <td className="px-6 py-5">
                        <span className="inline-flex px-4 py-2 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">
                          +{parseFloat(ot.hours || 0).toFixed(2)}h
                        </span>
                      </td>
                      <td className="px-6 py-5 text-sm text-gray-600">
                        <div className="max-w-md">
                          {ot.effort ? (
                            <pre className="whitespace-pre-wrap text-xs bg-gray-50 p-3 rounded-lg">
                              {ot.effort}
                            </pre>
                          ) : (
                            "—"
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        <div className="mt-6 bg-gray-50 rounded-2xl p-6">
          <h4 className="font-medium text-gray-900 mb-3">How Overtime Works</h4>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-black font-medium">1.</span>
              <span>Start work using the timer with project and task selection</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-black font-medium">2.</span>
              <span>Your productive hours are tracked (excluding breaks and support time)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-black font-medium">3.</span>
              <span>When productive hours exceed 8 hours, overtime is automatically calculated</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-black font-medium">4.</span>
              <span>Overtime records show which projects and tasks contributed to extra hours</span>
            </li>
          </ul>
        </div>
      </LayoutComponents>
    </div>
  );
};

export default Overtime;