import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import LayoutComponents from "../../../components/LayoutComponents";
import apiClient from "../../../helpers/apiClient";
import {
  MdCalculate,
  MdRefresh,
  MdDownload,
  MdTimer,
  MdTrendingUp,
  MdInfoOutline,
  MdFilterList,
  MdSearch
} from "react-icons/md";
import {
  Clock,
  Zap,
  Calendar,
  ChevronRight,
  User,
  Briefcase,
  ChevronDown
} from "lucide-react";
import Input from "../../../components/Input";
import toast from "react-hot-toast";
import { usePermission } from "../../../context/PermissionContext";

const Overtime = () => {
  const { hasPermission } = usePermission();
  const [overtime, setOvertime] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [calculating, setCalculating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

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
        setOvertime(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error("Failed to load overtime records:", err);
        toast.error("Failed to load overtime records");
      })
      .finally(() => setLoading(false));
  };

  const calculateOvertime = () => {
    const today = new Date().toISOString().split('T')[0];
    setCalculating(true);

    apiClient
      .post("/hr/overtime/calculate_from_sessions/", { date: today })
      .then((res) => {
        toast.success(res.data.message);
        fetchOvertime();
      })
      .catch((err) => {
        const errorMsg = err.response?.data?.message || err.response?.data?.error || "Failed to calculate overtime";
        toast.error(errorMsg);
      })
      .finally(() => setCalculating(false));
  };

  const totalOvertimeHours = overtime.reduce((sum, ot) => sum + (parseFloat(ot.hours) || 0), 0);

  const filteredOvertime = overtime.filter(ot =>
    ot.employee?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ot.project?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <LayoutComponents
        title="Overtime Lifecycle"
        subtitle="Manage and track extended productivity beyond the 8-hour window."
        variant="card"
      >
        {/* Metric Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <div className="bg-gray-50/50 rounded-3xl p-6 border border-gray-100 hover:shadow-lg transition-all group overflow-hidden relative">
            <div className="absolute -right-2 -top-2 text-gray-100 group-hover:text-black/5 transition-colors">
              <Clock size={80} />
            </div>
            <p className="text-gray-600 text-[10px] font-medium uppercase tracking-widest mb-1">Total Hours</p>
            <p className="text-3xl font-medium text-black font-syne group-hover:scale-110 transition-transform origin-left">{totalOvertimeHours.toFixed(2)}h</p>
            <div className="mt-4 flex items-center gap-2 text-emerald-600">
              <MdTrendingUp className="text-lg" />
              <span className="text-[10px] font-medium uppercase">Efficiency Bonus</span>
            </div>
          </div>

          <div className="bg-gray-50/50 rounded-3xl p-6 border border-gray-100 hover:shadow-lg transition-all group overflow-hidden relative">
            <div className="absolute -right-2 -top-2 text-gray-100 group-hover:text-black/5 transition-colors">
              <Zap size={80} />
            </div>
            <p className="text-gray-600 text-[10px] font-medium uppercase tracking-widest mb-1">Total Records</p>
            <p className="text-3xl font-medium text-black font-syne">{overtime.length}</p>
            <p className="text-[10px] text-gray-500 mt-4 font-medium uppercase tracking-tight">Across {month}/{year}</p>
          </div>

          <div className="bg-black rounded-3xl p-6 shadow-2xl shadow-black/20 group overflow-hidden relative col-span-1 md:col-span-2">
            <div className="absolute inset-0 bg-linear-to-br from-white/10 to-transparent" />
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <p className="text-gray-400 text-[10px] font-medium uppercase tracking-widest mb-1">Productivity Standard</p>
                <h3 className="text-white text-xl font-medium font-syne">8-Hour Productive Window</h3>
              </div>
              <p className="text-gray-400 text-xs leading-relaxed max-w-sm mt-4">
                Overtime is automatically triggered when your productive time (excluding breaks & support) exceeds the 8-hour daily threshold.
              </p>
            </div>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex flex-col md:flex-row gap-6 justify-between items-end mb-10">
          <div className="flex flex-wrap gap-4 items-end w-full md:w-auto">
            <div className="w-56">
              <Input
                type="select"
                label="Fiscal Month"
                value={month}
                onChange={setMonth}
                options={months}
                className="rounded-2xl border-gray-200"
              />
            </div>
            <div className="w-32">
              <Input
                type="number"
                label="Fiscal Year"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="rounded-2xl border-gray-200"
              />
            </div>
            <button
              onClick={fetchOvertime}
              className="p-3.5 bg-gray-50 text-gray-600 hover:text-black border border-gray-200 rounded-2xl transition hover:bg-gray-100 shadow-xs"
              title="Refresh Records"
            >
              <MdRefresh className="w-6 h-6" />
            </button>
          </div>

          <div className="flex gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
              <input
                type="text"
                placeholder="Universal search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl text-sm focus:ring-4 focus:ring-black/5 focus:border-black outline-none transition-all placeholder:text-gray-400 font-medium"
              />
            </div>
            {hasPermission("overtime", "edit") && (
              <button
                onClick={calculateOvertime}
                disabled={calculating}
                className="flex items-center gap-3 px-8 py-3.5 bg-black text-white rounded-2xl hover:bg-gray-800 transition shadow-xl shadow-black/10 active:scale-95 disabled:opacity-50"
              >
                {calculating ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/20 border-t-white"></div>
                ) : (
                  <MdCalculate className="text-xl" />
                )}
                <span className="text-[11px] font-medium uppercase tracking-widest">Calculate Sync</span>
              </button>
            )}
          </div>
        </div>

        {/* Data Matrix */}
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl shadow-gray-200/50 overflow-hidden">
          {loading ? (
            <div className="p-20 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-1 bg-gray-100 rounded-full overflow-hidden relative mb-4">
                <div className="absolute inset-0 bg-black animate-progress" />
              </div>
              <p className="text-[10px] font-medium uppercase text-gray-400 tracking-[0.2em]">Synchronizing Records...</p>
            </div>
          ) : filteredOvertime.length === 0 ? (
            <div className="p-24 text-center">
              <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
                <Clock className="text-gray-200 w-10 h-10" />
              </div>
              <h4 className="text-2xl font-medium font-syne text-black mb-2 uppercase tracking-tighter">Zero Impact Detected</h4>
              <p className="text-gray-500 text-sm max-w-xs mx-auto font-medium">No overtime records match your current sync parameters. Try calculating for today.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-10 py-8 text-left text-[10px] font-medium text-gray-400 uppercase tracking-widest w-64">Stakeholder</th>
                    <th className="px-10 py-8 text-left text-[10px] font-medium text-gray-400 uppercase tracking-widest">Temporal Context</th>
                    <th className="px-10 py-8 text-left text-[10px] font-medium text-gray-400 uppercase tracking-widest">Project/Effort</th>
                    <th className="px-10 py-8 text-right text-[10px] font-medium text-gray-400 uppercase tracking-widest w-48">Impact Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  <AnimatePresence>
                    {filteredOvertime.map((ot, i) => (
                      <motion.tr
                        key={ot.id || i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: i * 0.03 }}
                        className="group hover:bg-gray-50/80 transition-all duration-300"
                      >
                        <td className="px-10 py-8">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-black group-hover:text-white transition-all duration-500 overflow-hidden">
                              {ot.employee?.image ? (
                                <img src={ot.employee.image} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <User size={20} />
                              )}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-black font-syne">{ot.employee?.name || "Anonymous"}</span>
                              <span className="text-[10px] text-gray-500 font-medium uppercase tracking-tighter mt-0.5">{ot.employee?.designation?.name || "Platform Contributor"}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-10 py-8">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-black">
                              <Calendar size={14} className="text-gray-300" />
                              <span className="text-xs font-medium uppercase tracking-wide">
                                {ot.date ? new Date(ot.date).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }) : "--"}
                              </span>
                            </div>
                            <span className="text-[10px] text-gray-400 font-medium uppercase ml-6">{ot.date ? new Date(ot.date).toLocaleDateString("en-GB", { weekday: 'long' }) : ""}</span>
                          </div>
                        </td>
                        <td className="px-10 py-8">
                          <div className="max-w-md">
                            <div className="flex items-center gap-2 mb-2">
                              <Briefcase size={14} className="text-gray-300" />
                              <span className="text-xs font-medium text-black uppercase tracking-widest">{ot.project || "General Operations"}</span>
                            </div>
                            <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed font-medium bg-gray-50/50 p-3 rounded-2xl group-hover:bg-white group-hover:shadow-sm transition-all border border-transparent group-hover:border-gray-100 whitespace-pre-wrap">
                              {ot.effort || "No execution details specified."}
                            </p>
                          </div>
                        </td>
                        <td className="px-10 py-8 text-right">
                          <div className="flex flex-col items-end gap-1">
                            <span className="inline-flex px-5 py-2.5 bg-black text-white rounded-full text-[13px] font-medium tracking-tighter shadow-lg shadow-black/10 group-hover:scale-110 transition-transform">
                              +{parseFloat(ot.hours || 0).toFixed(2)}h
                            </span>
                            <span className="text-[9px] text-gray-400 font-medium uppercase tracking-widest mt-1">Confirmed Units</span>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Protocol Footer */}
        <div className="mt-12 p-8 bg-gray-50 border border-gray-100 rounded-[2.5rem] flex flex-col md:flex-row gap-8 items-start justify-between relative overflow-hidden group">
          <div className="absolute right-0 bottom-0 opacity-5 group-hover:opacity-10 transition-opacity">
            <Clock size={240} />
          </div>
          <div className="space-y-4 max-w-xl relative z-10">
            <div className="flex items-center gap-3 text-black">
              <MdInfoOutline className="text-2xl" />
              <h4 className="text-lg font-medium font-syne uppercase tracking-tighter leading-none">Standard Operating Procedure</h4>
            </div>
            <p className="text-xs text-gray-600 font-medium leading-relaxed">
              Impact records are generated through a high-precision synchronization between the daily timer and the platform threshold.
              Only <strong>productive work units</strong> (Active Timer status) are counted towards the 8-hour window.
              Support tickets and Break sessions are excluded from the lifecycle to ensure elite performance metrics.
            </p>
          </div>
          <div className="flex gap-4 relative z-10">
            <button className="flex items-center gap-3 px-6 py-3 bg-white border border-gray-200 text-black text-[10px] font-medium uppercase tracking-widest rounded-2xl hover:bg-gray-100 transition shadow-xs active:scale-95">
              <MdDownload /> Export Ledger
            </button>
            <button className="flex items-center gap-3 px-6 py-3 bg-black text-white text-[10px] font-medium uppercase tracking-widest rounded-2xl hover:bg-gray-800 transition shadow-xl shadow-black/10 active:scale-95">
              <ChevronRight size={14} /> Audit History
            </button>
          </div>
        </div>
      </LayoutComponents>
    </div>
  );
};

export default Overtime;