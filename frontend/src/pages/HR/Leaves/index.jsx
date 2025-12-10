import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import LayoutComponents from "../../../components/LayoutComponents";
import apiClient from "../../../helpers/apiClient";
import { MdAdd, MdDownload, MdCheckCircle, MdPending, MdCancel } from "react-icons/md";
import { format } from "date-fns";

const Leaves = () => {
  const [leaves, setLeaves] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiClient
      .get("/hr/leaves/")
      .then((res) => {
        let data = res.data;

        if (data && data.results) {
          data = data.results;
        }

        const leavesArray = Array.isArray(data) ? data : [];
        setLeaves(leavesArray);
      })
      .catch((err) => {
        console.error("Failed to load leaves:", err);
        setLeaves([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredLeaves = Array.isArray(leaves)
    ? filter === "all"
      ? leaves
      : leaves.filter((l) => l.status === filter)
    : [];

  const statusConfig = {
    pending: { color: "bg-yellow-100 text-yellow-800", icon: MdPending },
    approved: { color: "bg-green-100 text-green-800", icon: MdCheckCircle },
    rejected: { color: "bg-red-100 text-red-800", icon: MdCancel },
  };

  return (
    <div className="p-6">
      <LayoutComponents title="Leaves" subtitle="Manage employee leave requests" variant="card">
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex flex-wrap gap-4 justify-between items-center">
            <div className="flex gap-3">
              <button
                onClick={() => setFilter("all")}
                className={`px-6 py-3.5 rounded-xl font-medium transition ${
                  filter === "all" ? "bg-black text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter("pending")}
                className={`px-6 py-3.5 rounded-xl font-medium transition ${
                  filter === "pending" ? "bg-yellow-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setFilter("approved")}
                className={`px-6 py-3.5 rounded-xl font-medium transition ${
                  filter === "approved" ? "bg-green-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Approved
              </button>
              <button
                onClick={() => setFilter("rejected")}
                className={`px-6 py-3.5 rounded-xl font-medium transition ${
                  filter === "rejected" ? "bg-red-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Rejected
              </button>
            </div>
            <div className="flex gap-3">
              <button className="flex items-center gap-3 px-6 py-3.5 border border-gray-300 rounded-xl hover:bg-gray-50 transition">
                <MdDownload className="w-5 h-5" /> Export
              </button>
              <button className="flex items-center gap-3 px-6 py-3.5 bg-black text-white rounded-xl hover:bg-gray-900 transition font-medium">
                <MdAdd className="w-5 h-5" /> Apply Leave
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-black border-t-transparent"></div>
          </div>
        ) : filteredLeaves.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <MdPending className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-xl font-medium">
              {filter === "all" ? "No leave requests found" : `No ${filter} leave requests`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLeaves.map((leave, i) => {
              const StatusIcon = statusConfig[leave.status]?.icon || MdPending;
              const statusStyle = statusConfig[leave.status]?.color || "bg-gray-100 text-gray-800";

              return (
                <motion.div
                  key={leave.id || i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ y: -4 }}
                  className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">{leave.employee?.name || "Unknown"}</h4>
                        <p className="text-sm text-gray-600">{leave.leave_type_name || leave.leave_type?.name}</p>
                      </div>
                      <div className={`p-3 rounded-xl ${statusStyle}`}>
                        <StatusIcon className="w-6 h-6" />
                      </div>
                    </div>

                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">From</span>
                        <span className="font-medium">
                          {leave.start_date ? format(new Date(leave.start_date), "dd MMM yyyy") : "—"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">To</span>
                        <span className="font-medium">
                          {leave.end_date ? format(new Date(leave.end_date), "dd MMM yyyy") : "—"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Duration</span>
                        <span className="font-medium">
                          {leave.duration === "half_day"
                            ? "Half Day"
                            : leave.duration === "full_day"
                            ? "Full Day"
                            : leave.total_days
                            ? `${leave.total_days} Days`
                            : "—"}
                        </span>
                      </div>
                    </div>

                    {leave.reason && (
                      <div className="mt-5 pt-5 border-t border-gray-200">
                        <p className="text-sm text-gray-600 line-clamp-2">{leave.reason}</p>
                      </div>
                    )}

                    <div className="mt-5 flex items-center justify-between text-xs text-gray-500">
                      <span>
                        Applied on {leave.created_at ? format(new Date(leave.created_at), "dd MMM yyyy") : "—"}
                      </span>
                      {leave.approved_by && (
                        <span className="font-medium">by {leave.approved_by.name}</span>
                      )}
                    </div>
                  </div>

                  <div className={`px-6 py-3 ${statusStyle} font-medium text-center`}>
                    {leave.status?.toUpperCase() || "UNKNOWN"}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </LayoutComponents>
    </div>
  );
};

export default Leaves;