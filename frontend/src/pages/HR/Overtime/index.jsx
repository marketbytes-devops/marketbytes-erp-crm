import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import LayoutComponents from "../../../components/LayoutComponents";
import apiClient from "../../../helpers/apiClient";
import { MdAdd, MdDownload } from "react-icons/md";

const Overtime = () => {
  const [overtime, setOvertime] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiClient
      .get("/hr/overtime/")
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
  }, []);

  return (
    <div className="p-6">
      <LayoutComponents title="Overtime" subtitle="Track extra working hours" variant="card">
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 flex justify-between items-center">
          <h3 className="text-xl font-bold">Overtime Records</h3>
          <div className="flex gap-3">
            <button className="flex items-center gap-3 px-6 py-3.5 border border-gray-300 rounded-xl hover:bg-gray-50 transition">
              <MdDownload className="w-5 h-5" /> Export
            </button>
            <button className="flex items-center gap-3 px-6 py-3.5 bg-black text-white rounded-xl hover:bg-gray-900 transition font-medium">
              <MdAdd className="w-5 h-5" /> Add Overtime
            </button>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-black border-t-transparent"></div>
          </div>
        ) : overtime.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-16 text-center text-gray-500">
            <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <MdAdd className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-xl font-medium">No overtime records found</p>
            <p className="text-sm mt-2">Start tracking extra hours when employees work beyond regular time</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-max">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-5 text-left text-sm font-bold text-gray-700">Employee</th>
                    <th className="px-6 py-5 text-left text-sm font-bold text-gray-700">Project</th>
                    <th className="px-6 py-5 text-left text-sm font-bold text-gray-700">Date</th>
                    <th className="px-6 py-5 text-left text-sm font-bold text-gray-700">Hours</th>
                    <th className="px-6 py-5 text-left text-sm font-bold text-gray-700">Effort</th>
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
                      <td className="px-6 py-5 text-sm text-gray-700">{ot.project || "—"}</td>
                      <td className="px-6 py-5 text-sm text-gray-700">
                        {ot.date ? new Date(ot.date).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                      </td>
                      <td className="px-6 py-5">
                        <span className="inline-flex px-4 py-2 bg-amber-100 text-amber-800 rounded-full text-sm font-bold">
                          {ot.hours || 0}h
                        </span>
                      </td>
                      <td className="px-6 py-5 text-sm text-gray-600 max-w-xs truncate">
                        {ot.effort || "—"}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </LayoutComponents>
    </div>
  );
};

export default Overtime;