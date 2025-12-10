import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import LayoutComponents from "../../../components/LayoutComponents";
import apiClient from "../../../helpers/apiClient";
import { MdTrendingUp } from "react-icons/md";

const Performance = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiClient
      .get("/hr/performance/")
      .then((res) => {
        let data = res.data;

        if (data && data.results) {
          data = data.results;
        }

        const reviewsArray = Array.isArray(data) ? data : [];
        setReviews(reviewsArray);
      })
      .catch((err) => {
        console.error("Failed to load performance reviews:", err);
        setReviews([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const getRatingColor = (rating) => {
    if (rating >= 4.5) return "text-green-600 bg-green-50";
    if (rating >= 3.5) return "text-blue-600 bg-blue-50";
    if (rating >= 2.5) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  return (
    <div className="p-6">
      <LayoutComponents title="Performance" subtitle="Employee performance reviews" variant="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { label: "Outstanding", count: 8, color: "from-emerald-500 to-teal-600" },
            { label: "Good", count: 42, color: "from-blue-500 to-indigo-600" },
            { label: "Needs Improvement", count: 5, color: "from-orange-500 to-red-600" },
          ].map((item, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.03 }}
              className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
            >
              <div className={`w-16 h-16 bg-linear-to-br ${item.color} rounded-xl flex items-center justify-center text-white mb-4 shadow-md`}>
                <MdTrendingUp className="w-8 h-8" />
              </div>
              <p className="text-gray-600 text-sm">{item.label}</p>
              <p className="text-4xl font-medium mt-2 text-gray-900">{item.count}</p>
            </motion.div>
          ))}
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm p-16 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-black border-t-transparent"></div>
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-16 text-center text-gray-500">
            <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <MdTrendingUp className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-xl font-medium">No performance reviews yet</p>
            <p className="text-sm mt-2">Start evaluating your team’s performance</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-max">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-5 text-left text-sm font-medium text-gray-700">Employee</th>
                    <th className="px-6 py-5 text-left text-sm font-medium text-gray-700">Department</th>
                    <th className="px-6 py-5 text-left text-sm font-medium text-gray-700">Review Period</th>
                    <th className="px-6 py-5 text-left text-sm font-medium text-gray-700">Rating</th>
                    <th className="px-6 py-5 text-left text-sm font-medium text-gray-700">Reviewed By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {reviews.map((r, i) => (
                    <motion.tr
                      key={r.id || i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="hover:bg-gray-50 transition"
                    >
                      <td className="px-6 py-5 text-sm font-medium text-gray-900">
                        {r.employee?.name || "Unknown"}
                      </td>
                      <td className="px-6 py-5 text-sm text-gray-700">
                        {r.department?.name || "—"}
                      </td>
                      <td className="px-6 py-5 text-sm text-gray-700">
                        {r.review_period || "—"}
                      </td>
                      <td className="px-6 py-5">
                        <div
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm ${
                            getRatingColor(r.rating || 0)
                          }`}
                        >
                          {r.rating ? `${r.rating.toFixed(1)} / 5.0` : "—"}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm text-gray-600">
                        {r.reviewed_by?.name || "—"}
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

export default Performance;