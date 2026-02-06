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
    MdGroup,
    MdFolder
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
                task: item.task || "Other Task",
                project: item.project || "Internal",
                subTask: "Direct Execution",
                employee: item.employee?.name?.trim() || item.employee?.username || "Unknown",
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
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loading />
            </div>
        );
    }

    return (
        <div className="p-6">
            <LayoutComponents
                title="Active Timers"
                subtitle="Monitor real-time active work sessions"
                variant="table"
            >
                <div className="max-w-full mx-auto">
                    {/* Navigation */}
                    <div className="mb-6">
                        <Link to="/operations/time-logs" className="group inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-black transition-colors">
                            <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" /> Back to Time Logs
                        </Link>
                    </div>

                    {/* Stats Row */}
                    <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                                <div className="text-center">
                                    <div className="text-4xl font-medium text-black mb-2 flex items-center justify-center gap-3">
                                        <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/20"></div>
                                        {stats.activeNodes}
                                    </div>
                                    <p className="text-sm text-gray-600">Active Timers</p>
                                </div>
                                <div className="text-center">
                                    <div className="text-4xl font-medium text-black mb-2">{stats.peakDuration}</div>
                                    <p className="text-sm text-gray-600">Longest Duration</p>
                                </div>
                                <div className="text-center">
                                    <div className="text-4xl font-medium text-black mb-2">{stats.involvedProjects}</div>
                                    <p className="text-sm text-gray-600">Projects</p>
                                </div>
                                <div className="text-center">
                                    <div className="text-4xl font-medium text-black mb-2">{stats.activeAssociates}</div>
                                    <p className="text-sm text-gray-600">Employees</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={fetchActiveTimers}
                                    className="p-3 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition active:scale-95 text-gray-600"
                                    title="Refresh"
                                >
                                    <MdRefresh className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                                </button>
                                <button className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-900 transition text-sm font-medium whitespace-nowrap active:scale-95">
                                    <MdTimer className="w-5 h-5" /> Start Timer
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Search & Filters */}
                    <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                            <div className="flex items-center gap-4 flex-1">
                                <div className="relative flex-1 max-w-2xl">
                                    <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                                    <input
                                        type="text"
                                        placeholder="Search by task or employee..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black outline-none text-base transition"
                                    />
                                </div>

                                <button
                                    onClick={() => setFiltersOpen(!filtersOpen)}
                                    className="flex items-center gap-3 px-5 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition text-sm font-medium whitespace-nowrap"
                                >
                                    <MdFilterList className="w-5 h-5" />
                                    Filters
                                    {activeFilterCount > 0 && (
                                        <span className="ml-2 bg-black text-white text-xs font-medium rounded-full w-6 h-6 flex items-center justify-center">
                                            {activeFilterCount}
                                        </span>
                                    )}
                                    <MdKeyboardArrowDown
                                        className={`w-5 h-5 transition-transform ${filtersOpen ? "rotate-180" : ""}`}
                                    />
                                </button>

                                <span className="text-sm font-medium text-gray-600 hidden lg:block">
                                    {filteredTimers.length} {filteredTimers.length === 1 ? "timer" : "timers"}
                                </span>
                            </div>

                            <button className="flex items-center gap-2 px-5 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition text-sm font-medium">
                                <MdDownload className="w-5 h-5" /> Export
                            </button>
                        </div>
                    </div>

                    {/* Advanced Filters Panel */}
                    <AnimatePresence>
                        {filtersOpen && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                className="overflow-hidden mb-6"
                            >
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-xl font-medium text-gray-900">Filters</h3>
                                        <button onClick={() => setFiltersOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg transition">
                                            <MdClose className="w-6 h-6 text-gray-600" />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                                        <Input label="Project" type="select" value={project} onChange={setProject} options={[{ label: "All Projects", value: "" }]} />
                                        <Input label="Task" type="select" value={task} onChange={setTask} options={[{ label: "All Tasks", value: "" }]} />
                                        <Input label="Employee" type="select" value={employee} onChange={setEmployee} options={[{ label: "All Employees", value: "" }]} />
                                        <Input label="Status" type="select" value={approved} onChange={setApproved} options={[{ label: "All", value: "" }, { label: "Verified", value: "approved" }, { label: "Pending", value: "pending" }]} />
                                    </div>

                                    <div className="flex justify-end mt-8 pt-6 border-t border-gray-200">
                                        <button
                                            onClick={resetFilters}
                                            className="px-6 py-3.5 border-2 border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition"
                                        >
                                            Reset Filters
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Table */}
                    <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1000px]">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">#</th>
                                        <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">Task</th>
                                        <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">Employee</th>
                                        <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">Start Time</th>
                                        <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">Duration</th>
                                        <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filteredTimers.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="text-center py-24">
                                                <div className="flex flex-col items-center">
                                                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-5">
                                                        <MdTimer className="w-10 h-10 text-gray-400" />
                                                    </div>
                                                    <p className="text-xl font-medium text-gray-700">No active timers</p>
                                                    <p className="text-gray-500 mt-2">Start a timer to see it here</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredTimers.map((t, i) => (
                                            <motion.tr
                                                key={t.id}
                                                initial={{ opacity: 0, y: 15 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.03 }}
                                                className="hover:bg-gray-50 transition"
                                            >
                                                <td className="px-6 py-5 text-sm font-medium text-gray-500">#{t.id}</td>
                                                <td className="px-6 py-5">
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-gray-900">{t.task}</span>
                                                        <span className="text-xs text-gray-500 mt-0.5">{t.project}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-medium shadow-sm">
                                                            {t.employee[0]}
                                                        </div>
                                                        <span className="text-sm font-medium text-gray-900">{t.employee}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm text-gray-900 font-medium">{t.startTime}</span>
                                                        <span className="text-xs text-gray-500">{t.startDate}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-lg font-medium text-black tabular-nums">{formatDuration(t.duration)}</span>
                                                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <button
                                                        className="p-2 border border-gray-200 text-gray-500 rounded-lg hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition"
                                                        title="Stop Timer"
                                                    >
                                                        <MdTimerOff className="w-5 h-5" />
                                                    </button>
                                                </td>
                                            </motion.tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </LayoutComponents>
        </div>
    );
};

export default ActiveTimers;