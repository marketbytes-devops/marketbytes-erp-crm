import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import LayoutComponents from "../../../components/LayoutComponents";
import apiClient from "../../../helpers/apiClient";
import {
  MdAdd,
  MdDownload,
  MdCheckCircle,
  MdPending,
  MdCancel,
} from "react-icons/md";
import { format } from "date-fns";
import { useNavigate } from "react-router";

const Leaves = () => {
  const [leaves, setLeaves] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

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

  const filteredLeaves = leaves.filter((leave) => {
    // Status filter (All/Pending/etc.)
    if (filter !== "all" && leave.status !== filter) return false;

    // Search by employee name
    if (searchTerm) {
      const name = (leave.employee?.name || "").toLowerCase();
      if (!name.includes(searchTerm.toLowerCase())) return false;
    }

    // Date range filter
    if (dateFrom && leave.start_date) {
      if (new Date(leave.start_date) < new Date(dateFrom)) return false;
    }
    if (dateTo && leave.end_date) {
      if (new Date(leave.end_date) > new Date(dateTo)) return false;
    }

    return true;
  });

  const statusConfig = {
    pending: { color: "bg-yellow-100 text-yellow-800", icon: MdPending },
    approved: { color: "bg-green-100 text-green-800", icon: MdCheckCircle },
    rejected: { color: "bg-red-100 text-red-800", icon: MdCancel },
  };

  const handleStatusUpdate = async (leaveId, newStatus) => {
    if (
      !confirm(
        `Are you sure you want to ${
          newStatus === "approved" ? "approve" : "reject"
        } this leave?`
      )
    ) {
      return;
    }

    try {
      await apiClient.patch(`/hr/leaves/${leaveId}/`, { status: newStatus });

      setLeaves((prev) =>
        prev.map((leave) =>
          leave.id === leaveId ? { ...leave, status: newStatus } : leave
        )
      );

      alert(`Leave ${newStatus === "approved" ? "approved" : "rejected"}!`);
    } catch (err) {
      console.error("Update failed:", err);
      alert("Failed to update leave status");
    }
  };

  const handleExportCSV = () => {
    if (filteredLeaves.length === 0) {
      alert("No leave records to export.");
      return;
    }

    const headers =
      "Employee,Leave Type,From,To,Duration,Status,Applied On,Reason\n";

    const rows = filteredLeaves
      .map((leave) => {
        const employee = (leave.employee?.name || "Unknown").replace(
          /"/g,
          '""'
        );
        const leaveType = (
          leave.leave_type_name ||
          leave.leave_type?.name ||
          "N/A"
        ).replace(/"/g, '""');
        const from = leave.start_date
          ? format(new Date(leave.start_date), "dd/MM/yyyy")
          : "-";
        const to = leave.end_date
          ? format(new Date(leave.end_date), "dd/MM/yyyy")
          : "-";
        const duration =
          leave.duration === "half_day"
            ? "Half Day"
            : leave.total_days
            ? `${leave.total_days} Day${leave.total_days > 1 ? "s" : ""}`
            : "Full Day";
        const status = leave.status?.toUpperCase() || "UNKNOWN";
        const appliedOn = leave.created_at
          ? format(new Date(leave.created_at), "dd/MM/yyyy")
          : "-";
        const reason = (leave.reason || "").replace(/"/g, '""');

        return `"${employee}","${leaveType}","${from}","${to}","${duration}","${status}","${appliedOn}","${reason}"`;
      })
      .join("\n");

    const csvContent =
      "data:text/csv;charset=utf-8," + encodeURIComponent(headers + rows);

    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute(
      "download",
      `Leaves_${filter}_${format(new Date(), "yyyy-MM-dd")}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6">
      <LayoutComponents
        title="Leaves"
        subtitle="Manage employee leave requests"
        variant="card"
      >
        <div className="flex flex-col gap-6 mb-5">
          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-3 justify-between items-center">
            <div className="flex gap-3">
              <button
                onClick={() => setFilter("all")}
                className={`px-6 py-3.5 rounded-xl font-medium transition ${
                  filter === "all"
                    ? "bg-black text-white"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter("pending")}
                className={`px-6 py-3.5 rounded-xl font-medium transition ${
                  filter === "pending"
                    ? "bg-yellow-500 text-white"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setFilter("approved")}
                className={`px-6 py-3.5 rounded-xl font-medium transition ${
                  filter === "approved"
                    ? "bg-green-500 text-white"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
              >
                Approved
              </button>
              <button
                onClick={() => setFilter("rejected")}
                className={`px-6 py-3.5 rounded-xl font-medium transition ${
                  filter === "rejected"
                    ? "bg-red-500 text-white"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
              >
                Rejected
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-3 px-6 py-3.5 border border-gray-300 rounded-xl hover:bg-gray-50 transition font-medium"
              >
                <MdDownload className="w-5 h-5" /> Export CSV
              </button>
              <button
                onClick={() => navigate("/hr/leaves/assign")}
                className="flex items-center gap-3 px-6 py-3.5 bg-black text-white rounded-xl hover:bg-gray-900 transition font-medium"
              >
                <MdAdd className="w-5 h-5" /> Assign Leave
              </button>
            </div>
          </div>

          {/* Search + Date Filter Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Search employee name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none"
            />

            {/* From Date */}
            <div className="relative">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="peer w-full px-4 py-3 pt-6 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-black transition"
              />
              <label className="absolute left-4 top-3 text-xs text-gray-500 pointer-events-none transition-all peer-focus:top-1 peer-focus:text-xs peer-[:not(:placeholder-shown)]:top-1 peer-[:not(:placeholder-shown)]:text-xs">
                From Date
              </label>
              <label className="absolute left-4 top-6 text-gray-400 pointer-events-none transition-all peer-focus:top-1 peer-focus:text-xs peer-[:not(:placeholder-shown)]:hidden">
                From Date
              </label>
            </div>

            {/* To Date */}
            <div className="relative">
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="peer w-full px-4 py-3 pt-6 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-black transition"
              />
              <label className="absolute left-4 top-3 text-xs text-gray-500 pointer-events-none transition-all peer-focus:top-1 peer-focus:text-xs peer-[:not(:placeholder-shown)]:top-1 peer-[:not(:placeholder-shown)]:text-xs">
                To Date
              </label>
              <label className="absolute left-4 top-6 text-gray-400 pointer-events-none transition-all peer-focus:top-1 peer-focus:text-xs peer-[:not(:placeholder-shown)]:hidden">
                To Date
              </label>
            </div>

            {(searchTerm || dateFrom || dateTo) && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setDateFrom("");
                  setDateTo("");
                }}
                className="px-4 py-3 bg-gray-200 rounded-xl hover:bg-gray-300 transition"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 ">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-black border-t-transparent"></div>
          </div>
        ) : filteredLeaves.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <MdPending className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-xl font-medium">
              {filter === "all"
                ? "No leave requests found"
                : `No ${filter} leave requests`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLeaves.map((leave, i) => {
              const StatusIcon = statusConfig[leave.status]?.icon || MdPending;
              const statusStyle =
                statusConfig[leave.status]?.color ||
                "bg-gray-100 text-gray-800";

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
                        <h4 className="text-lg font-medium text-gray-900">
                          {leave.employee?.name || "Unknown"}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {leave.leave_type_name || leave.leave_type?.name}
                        </p>
                      </div>
                      <div className={`p-3 rounded-xl ${statusStyle}`}>
                        <StatusIcon className="w-6 h-6" />
                      </div>
                    </div>

                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">From</span>
                        <span className="font-medium">
                          {leave.start_date
                            ? format(new Date(leave.start_date), "dd MMM yyyy")
                            : "—"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">To</span>
                        <span className="font-medium">
                          {leave.end_date
                            ? format(new Date(leave.end_date), "dd MMM yyyy")
                            : "—"}
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
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {leave.reason}
                        </p>
                      </div>
                    )}

                    <div className="mt-5 flex items-center justify-between text-xs text-gray-500">
                      <span>
                        Applied on{" "}
                        {leave.created_at
                          ? format(new Date(leave.created_at), "dd MMM yyyy")
                          : "—"}
                      </span>
                      {leave.approved_by && (
                        <span className="font-medium">
                          by {leave.approved_by.name}
                        </span>
                      )}
                    </div>
                    <div className="mt-6">
                      {leave.status === "pending" ? (
                        <div className="space-y-4">
                          <div className="text-center py-3 bg-yellow-100 text-yellow-800 font-bold rounded-xl text-lg">
                            PENDING
                          </div>
                          <div className="flex gap-3">
                            <button
                              onClick={() =>
                                handleStatusUpdate(leave.id, "approved")
                              }
                              className="flex-1 bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() =>
                                handleStatusUpdate(leave.id, "rejected")
                              }
                              className="flex-1 bg-red-600 text-white py-3 rounded-xl font-semibold hover:bg-red-700 transition"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className={`py-5 text-center font-bold text-xl rounded-xl ${
                            leave.status === "approved"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {leave.status?.toUpperCase()}
                        </div>
                      )}
                    </div>
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
