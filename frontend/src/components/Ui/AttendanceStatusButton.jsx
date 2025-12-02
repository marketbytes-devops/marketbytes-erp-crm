import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import apiClient from "../../helpers/apiClient";
import { MdLogin, MdLogout, MdAccessTime } from "react-icons/md";
import toast from "react-hot-toast";

const AttendanceStatusButton = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const res = await apiClient.get("/hr/attendance/status/");
      setStatus(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleClick = async () => {
    const action = status?.checked_in ? 'out' : 'in';
    try {
      await apiClient.post("/hr/attendance/check_in_out/", { action });
      toast.success(status?.checked_in ? "Checked Out!" : "Checked In!");
      fetchStatus();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed");
    }
  };

  if (loading) return <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />;

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleClick}
      className={`flex items-center gap-3 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all ${
        status?.checked_in
          ? "bg-green-600 hover:bg-green-700"
          : "bg-black hover:bg-gray-800"
      }`}
    >
      {status?.checked_in ? (
        <>
          <MdLogout className="w-5 h-5" />
          <span>Check Out</span>
          <span className="text-xs opacity-90">In: {status.clock_in}</span>
        </>
      ) : (
        <>
          <MdLogin className="w-5 h-5" />
          <span>Check In</span>
        </>
      )}
    </motion.button>
  );
};

export default AttendanceStatusButton;