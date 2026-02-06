import React, { useState, useEffect, useMemo } from "react";
import apiClient from "../../../helpers/apiClient";
import LayoutComponents from "../../../components/LayoutComponents";
import {
  MdFilterList,
  MdKeyboardArrowDown,
  MdClose,
  MdDownload,
  MdTimerOff,
  MdTimer,
  MdRefresh,
} from "react-icons/md";
import { FiSearch, FiArrowLeft } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import Input from "../../../components/Input";
import Loading from "../../../components/Loading";

const ActiveTimers = () => {
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [timers, setTimers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [project, setProject] = useState("");
  const [task, setTask] = useState("");
  const [employee, setEmployee] = useState("");
  const [approved, setApproved] = useState("");

  const activeFilterCount = [project, task, employee, approved].filter(Boolean).length;

  const resetFilters = () => {
    setProject("");
    setTask("");
    setEmployee("");
    setApproved("");
    setSearch("");
  };

  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const fetchActiveTimers = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/hr/timer/active_sessions/");
      const adaptedData = res.data.map((item) => ({
        id: item.id,
        task: item.task || "Operational Node",
        project: item.project || "Internal System",
        subTask: "Direct Execution",
        employee: item.employee?.name?.trim() || item.employee?.username || "Anonymous Node",
        startTime: new Date(item.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
        startDate: new Date(item.start_time).toLocaleDateString("en-GB"),
        duration: item.duration_seconds,
      }));
      setTimers(adaptedData);
    } catch (error) {
      console.error("Active timers fetch failed", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveTimers();
    const interval = setInterval(() => {
      setTimers(prev => prev.map(t => ({ ...t, duration: t.duration + 1 })));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const filteredTimers = useMemo(() => {
    if (!search.trim()) return timers;
    const term = search.toLowerCase();
    return timers.filter(t =>
      (t.task?.toLowerCase().includes(term)) ||
      (t.project?.toLowerCase().includes(term)) ||
      (t.employee?.toLowerCase().includes(term))
    );
  }, [timers, search]);

  const stats = useMemo(() => ({
    activeNodes: filteredTimers.length,
    peakDuration: filteredTimers.length ? formatDuration(Math.max(...filteredTimers.map(t => t.duration))) : "00:00:00",
    involvedProjects: [...new Set(filteredTimers.map(t => t.project))].length,
    activeAssociates: [...new Set(filteredTimers.map(t => t.employee))].length
  }), [filteredTimers]);

  if (loading && !timers.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white whitespace-pre-wrap">
        <Loading />
      </div>
    );
  }

  return (
    <div className="p-6">
      <LayoutComponents
        title="Live Monitor"
        subtitle="Real-time operational bandwidth and active session intercept"
        variant="table"
      >
        {/* Navigation */}
        <div className="mb-8">
          <Link to="/operations/time-logs" className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-black transition-all">
            <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" /> Back to Timelines
          </Link>
        </div>

        {/* Stats Registry */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12 flex-1">
              <div className="text-center">
                <div className="text-4xl font-black text-black mb-2 flex items-center justify-center gap-3">
                  <div className="w-2.5 h-2.5 bg-black rounded-full animate-pulse shadow-lg shadow-black/20"></div>
                  {stats.activeNodes}
                </div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Live Nodes</p>
              </div>
              <div className="text-center border-x border-gray-50">
                <div className="text-4xl font-black text-black mb-2">{stats.peakDuration}</div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Max Session</p>
              </div>
              <div className="text-center border-r border-gray-50">
                <div className="text-4xl font-black text-black mb-2">{stats.involvedProjects}</div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Units</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-black text-black mb-2">{stats.activeAssociates}</div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Members</p>
              </div>
            </div>
            <div className="flex gap-4">
              <button
                onClick={fetchActiveTimers}
                className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-95 group"
              >
                <MdRefresh className={`w-6 h-6 text-gray-400 group-hover:text-black transition-colors ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button className="flex items-center gap-3 px-8 py-5 bg-black text-white rounded-2xl hover:opacity-90 transition-all font-bold text-xs uppercase tracking-[0.2em] shadow-2xl active:scale-95">
                <MdTimer className="w-5 h-5" /> Initialize Node
              </button>
            </div>
          </div>
        </div>

        {/* Search & Parameters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-2xl group">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-black transition-colors" />
                <input
                  type="text"
                  placeholder="Intercept live data packets by task or associate..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none transition-all text-sm font-medium text-gray-800"
                />
              </div>

              <button
                onClick={() => setFiltersOpen(!filtersOpen)}
                className="flex items-center gap-3 px-6 py-4 bg-white border border-gray-200 rounded-xl hover:border-black transition-all font-bold text-xs uppercase tracking-widest text-gray-600 shadow-xs"
              >
                <MdFilterList className="w-5 h-5" />
                Schema
                {activeFilterCount > 0 && (
                  <span className="ml-2 bg-black text-white text-[10px] font-black rounded-full w-6 h-6 flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
                <MdKeyboardArrowDown className={`w-5 h-5 transition-transform ${filtersOpen ? "rotate-180" : ""}`} />
              </button>
            </div>

            <button className="flex items-center gap-2 px-6 py-4 bg-white border border-gray-200 rounded-xl hover:bg-black hover:text-white transition-all font-bold text-xs uppercase tracking-widest text-gray-600">
              <MdDownload className="w-5 h-5" /> Export View
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        <AnimatePresence>
          {filtersOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-6"
            >
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-black uppercase tracking-tighter text-black">Dimension Filters</h3>
                  <button onClick={() => setFiltersOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl">
                    <MdClose className="w-7 h-7 text-gray-400 hover:text-black" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  <Input label="Project Unit" type="select" value={project} onChange={setProject} options={[{ label: "Global Projects", value: "" }]} />
                  <Input label="Operation Segment" type="select" value={task} onChange={setTask} options={[{ label: "All Segments", value: "" }]} />
                  <Input label="Associate Node" type="select" value={employee} onChange={setEmployee} options={[{ label: "All Members", value: "" }]} />
                  <Input label="Verification" type="select" value={approved} onChange={setApproved} options={[{ label: "All", value: "" }, { label: "Verified", value: "approved" }, { label: "Logged", value: "pending" }]} />
                </div>

                <div className="flex justify-end mt-10 pt-8 border-t border-gray-100">
                  <button onClick={resetFilters} className="px-10 py-4 bg-white border-2 border-black text-black rounded-xl font-bold uppercase text-[10px] tracking-[0.2em] hover:bg-black hover:text-white transition-all active:scale-95 shadow-xl">
                    Reset Filter Space
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Data Matrix */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-8 py-6 text-left text-[11px] font-black text-gray-500 uppercase tracking-widest">#</th>
                  <th className="px-8 py-6 text-left text-[11px] font-black text-gray-500 uppercase tracking-widest">Operational Task</th>
                  <th className="px-8 py-6 text-left text-[11px] font-black text-gray-500 uppercase tracking-widest">Associate Node</th>
                  <th className="px-8 py-6 text-left text-[11px] font-black text-gray-500 uppercase tracking-widest">Initialization</th>
                  <th className="px-8 py-6 text-left text-[11px] font-black text-gray-500 uppercase tracking-widest">Live Duration</th>
                  <th className="px-8 py-6 text-right text-[11px] font-black text-gray-500 uppercase tracking-widest">Termination</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTimers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-8 py-32 text-center">
                      <div className="flex flex-col items-center">
                        <MdTimer className="w-16 h-16 text-gray-100 mb-4 animate-pulse" />
                        <p className="text-xl font-black text-gray-300 uppercase tracking-tighter">Zero active threads detected</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">The system is currently in standby mode</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredTimers.map((t, i) => (
                    <motion.tr
                      key={t.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="hover:bg-gray-50/50 transition-all group border-l-4 border-transparent hover:border-black"
                    >
                      <td className="px-8 py-8 text-xs font-black text-gray-400">#{t.id}</td>
                      <td className="px-8 py-8">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-gray-900 group-hover:text-black uppercase tracking-tight">{t.task}</span>
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{t.project}</span>
                        </div>
                      </td>
                      <td className="px-8 py-8">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center text-[11px] font-black shadow-lg">
                            {t.employee[0]}
                          </div>
                          <span className="text-sm font-bold text-gray-800">{t.employee}</span>
                        </div>
                      </td>
                      <td className="px-8 py-8">
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-black uppercase">{t.startTime}</span>
                          <span className="text-[10px] font-bold text-gray-400">{t.startDate}</span>
                        </div>
                      </td>
                      <td className="px-8 py-8">
                        <div className="flex flex-col">
                          <span className="text-xl font-black text-black tabular-nums tracking-tighter">{formatDuration(t.duration)}</span>
                          <span className="text-[9px] font-black text-emerald-500 uppercase flex items-center gap-2 mt-0.5">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                            Live Execution
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-8 text-right">
                        <button className="p-4 bg-white border border-gray-100 text-gray-400 rounded-2xl hover:text-red-500 hover:border-red-100 hover:shadow-xl transition-all scale-90 hover:scale-100 shadow-sm opacity-0 group-hover:opacity-100">
                          <MdTimerOff className="w-6 h-6" />
                        </button>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </LayoutComponents>
    </div>
  );
};

export default ActiveTimers;