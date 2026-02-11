import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router";
import LayoutComponents from "../../../components/LayoutComponents";
import apiClient from "../../../helpers/apiClient";
import Input from "../../../components/Input";
import {
  MdAdd,
  MdDownload,
  MdCheckCircle,
  MdPending,
  MdCancel,
  MdKeyboardArrowDown,
  MdKeyboardArrowUp,
} from "react-icons/md";
import { format } from "date-fns";
import { usePermission } from "../../../context/PermissionContext";

const Leaves = () => {
  const { hasPermission } = usePermission();
  const [leaves, setLeaves] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/hr/leaves/");
      let data = res.data.results || res.data || [];
      setLeaves(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load leaves:", err);
      setLeaves([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredLeaves = leaves.filter((leave) => {
    if (filter !== "all" && leave.status !== filter) return false;

    if (searchTerm) {
      const name = (leave.employee?.name || "").toLowerCase();
      if (!name.includes(searchTerm.toLowerCase())) return false;
    }

    if (dateFrom && leave.start_date && new Date(leave.start_date) < new Date(dateFrom))
      return false;
    if (dateTo && leave.end_date && new Date(leave.end_date) > new Date(dateTo))
      return false;

    return true;
  });

  const statusConfig = {
    pending: { color: "bg-yellow-100 text-yellow-800", icon: MdPending, label: "Pending" },
    approved: { color: "bg-green-100 text-green-800", icon: MdCheckCircle, label: "Approved" },
    rejected: { color: "bg-red-100 text-red-800", icon: MdCancel, label: "Rejected" },
  };

  const handleStatusUpdate = async (leaveId, newStatus) => {
    if (!window.confirm(`Are you sure you want to ${newStatus === "approved" ? "approve" : "reject"} this leave?`))
      return;

    try {
      await apiClient.patch(`/hr/leaves/${leaveId}/`, { status: newStatus });
      setLeaves(prev =>
        prev.map(leave => (leave.id === leaveId ? { ...leave, status: newStatus } : leave))
      );
    } catch (err) {
      alert("Failed to update status");
      console.error(err);
    }
  };

  const handleExportCSV = () => {
    if (filteredLeaves.length === 0) {
      alert("No leave records to export.");
      return;
    }

    const headers = "Employee,Leave Type,From,To,Duration,Status,Applied On,Reason\n";
    const rows = filteredLeaves
      .map((leave) => {
        const employee = (leave.employee?.name || "Unknown").replace(/"/g, '""');
        const leaveType = (leave.leave_type_name || leave.leave_type?.name || "N/A").replace(/"/g, '""');
        const from = leave.start_date ? format(new Date(leave.start_date), "dd/MM/yyyy") : "-";
        const to = leave.end_date ? format(new Date(leave.end_date), "dd/MM/yyyy") : "-";
        const duration =
          leave.duration === "half_day"
            ? "Half Day"
            : leave.total_days
              ? `${leave.total_days} Day${leave.total_days > 1 ? "s" : ""}`
              : "Full Day";
        const status = (leave.status || "pending").toUpperCase();
        const appliedOn = leave.created_at ? format(new Date(leave.created_at), "dd/MM/yyyy") : "-";
        const reason = (leave.reason || "").replace(/"/g, '""');

        return `"${employee}","${leaveType}","${from}","${to}","${duration}","${status}","${appliedOn}","${reason}"`;
      })
      .join("\n");

    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(headers + rows);
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", `Leaves_${format(new Date(), "yyyy-MM-dd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="p-6">
      <LayoutComponents title="Leaves" subtitle="Manage employee leave requests" variant="table">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
            <div className="flex flex-wrap gap-3">
              {["all", "pending", "approved", "rejected"].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-6 py-3 rounded-xl font-medium transition ${filter === status
                    ? status === "all"
                      ? "bg-black text-white"
                      : status === "pending"
                        ? "bg-yellow-500 text-white"
                        : status === "approved"
                          ? "bg-green-600 text-white"
                          : "bg-red-600 text-white"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                    }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-5 py-4 border border-gray-300 rounded-xl hover:bg-gray-50 transition font-medium"
              >
                <MdDownload className="w-5 h-5" />
                Export
              </button>
              {hasPermission("leaves", "add") && (
                <Link
                  to="/hr/leaves/assign"
                  className="flex items-center gap-3 px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-900 transition font-medium"
                >
                  <MdAdd className="w-5 h-5" />
                  Assign Leave
                </Link>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative top-7">
              <Input
                type="text"
                placeholder="Search by employee name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Input
              type="date"
              label="From Date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />

            <Input
              type="date"
              label="To Date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>

          {(searchTerm || dateFrom || dateTo) && (
            <div className="mt-4 text-right">
              <button
                onClick={() => {
                  setSearchTerm("");
                  setDateFrom("");
                  setDateTo("");
                }}
                className="text-sm font-medium text-gray-600 hover:text-black underline"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-black border-t-transparent"></div>
          </div>
        ) : filteredLeaves.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-16 text-center">
            <MdPending className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-xl font-medium text-gray-700">
              {filter === "all" ? "No leave requests found" : `No ${filter} leaves`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLeaves.map((leave) => {
              const config = statusConfig[leave.status] || statusConfig.pending;
              const StatusIcon = config.icon;
              const isExpanded = expandedId === leave.id;

              return (
                <motion.div
                  key={leave.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">
                          {leave.employee?.name || "Unknown Employee"}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {leave.leave_type_name || leave.leave_type?.name || "N/A"}
                        </p>
                      </div>
                      <div className={`px-4 py-2 rounded-full ${config.color} flex items-center gap-2`}>
                        <StatusIcon className="w-5 h-5" />
                        <span className="font-medium">{config.label}</span>
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
                            : leave.total_days
                              ? `${leave.total_days} Day${leave.total_days > 1 ? "s" : ""}`
                              : "Full Day"}
                        </span>
                      </div>
                    </div>

                    {leave.reason && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-sm text-gray-700 line-clamp-3">{leave.reason}</p>
                      </div>
                    )}

                    <div className="mt-4 text-xs text-gray-500 flex justify-between">
                      <span>
                        Applied: {leave.created_at ? format(new Date(leave.created_at), "dd MMM yyyy") : "—"}
                      </span>
                      {leave.approved_by && <span>by {leave.approved_by.name}</span>}
                    </div>
                    {leave.status === "pending" && (
                      <div className="mt-6">
                        <button
                          onClick={() => toggleExpand(leave.id)}
                          className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium text-gray-700 hover:text-black transition"
                        >
                          {isExpanded ? "Hide Actions" : "Show Actions"}
                          {isExpanded ? (
                            <MdKeyboardArrowUp className="w-5 h-5" />
                          ) : (
                            <MdKeyboardArrowDown className="w-5 h-5" />
                          )}
                        </button>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              className="overflow-hidden"
                            >
                              <div className="mt-4 flex gap-3">
                                {hasPermission("leaves", "edit") && (
                                  <>
                                    <button
                                      onClick={() => handleStatusUpdate(leave.id, "approved")}
                                      className="flex-1 bg-green-600 text-white py-3 rounded-xl font-medium hover:bg-green-700 transition"
                                    >
                                      Approve
                                    </button>
                                    <button
                                      onClick={() => handleStatusUpdate(leave.id, "rejected")}
                                      className="flex-1 bg-red-600 text-white py-3 rounded-xl font-medium hover:bg-red-700 transition"
                                    >
                                      Reject
                                    </button>
                                  </>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                    {leave.status !== "pending" && (
                      <div className={`mt-6 py-4 text-center font-medium text-lg rounded-xl ${config.color}`}>
                        {config.label.toUpperCase()}
                      </div>
                    )}
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