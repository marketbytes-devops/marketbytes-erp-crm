import React, { useState, useEffect, useMemo, useRef } from "react";
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
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const ActiveTimers = () => {
    const [search, setSearch] = useState("");
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [timers, setTimers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters Data
    const [projectsList, setProjectsList] = useState([]);
    const [tasksList, setTasksList] = useState([]);
    const [employeesList, setEmployeesList] = useState([]);

    // Filter States
    const [project, setProject] = useState("");
    const [task, setTask] = useState("");
    const [employee, setEmployee] = useState("");
    const [status, setStatus] = useState("");
    
    // Export dropdown state
    const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
    const exportDropdownRef = useRef(null);

    const activeFilterCount = [project, task, employee, status].filter(Boolean).length;

    const resetFilters = () => {
        setProject("");
        setTask("");
        setEmployee("");
        setStatus("");
        setSearch("");
    };

    const formatDuration = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const [timersRes, projectsRes, tasksRes, employeesRes] = await Promise.all([
                apiClient.get("/hr/timer/active_sessions/"),
                apiClient.get("/operation/projects/"),
                apiClient.get("/operation/tasks/"),
                apiClient.get("/auth/users/")
            ]);

            const extract = (d) => (Array.isArray(d) ? d : d.results || []);

            const adaptedTimers = timersRes.data.map((item) => ({
                id: item.id,
                task: item.task || "Other Task",
                taskId: item.task_id,
                taskStatus: item.task_status,
                project: item.project || "Internal",
                projectId: item.project_id,
                subTask: "Direct Execution",
                employee: item.employee?.name?.trim() || item.employee?.username || "Unknown",
                employeeId: item.employee?.id,
                startTime: new Date(item.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
                startDate: new Date(item.start_time).toLocaleDateString("en-GB"),
                duration: item.duration_seconds,
            }));

            setTimers(adaptedTimers);
            setProjectsList(extract(projectsRes.data));
            setTasksList(extract(tasksRes.data));
            setEmployeesList(extract(employeesRes.data));
        } catch (error) {
            console.error("Active timers fetch failed", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(() => {
            setTimers(prev => prev.map(t => ({ ...t, duration: t.duration + 1 })));
        }, 1000);
        return () => clearInterval(interval);
    }, []);
    
    // Close export dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target)) {
                setExportDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredTimers = useMemo(() => {
        let result = timers;

        if (search.trim()) {
            const term = search.toLowerCase();
            result = result.filter(t =>
                (t.task?.toLowerCase().includes(term)) ||
                (t.project?.toLowerCase().includes(term)) ||
                (t.employee?.toLowerCase().includes(term))
            );
        }

        if (project) {
            result = result.filter(t => t.projectId === parseInt(project));
        }

        if (task) {
            result = result.filter(t => t.taskId === parseInt(task));
        }

        if (employee) {
            result = result.filter(t => t.employeeId === parseInt(employee));
        }

        if (status) {
            result = result.filter(t => t.taskStatus === status);
        }

        return result;
    }, [timers, search, project, task, employee, status]);

    const stats = useMemo(() => ({
        activeNodes: filteredTimers.length,
        peakDuration: filteredTimers.length ? formatDuration(Math.max(...filteredTimers.map(t => t.duration))) : "00:00:00",
        involvedProjects: [...new Set(filteredTimers.map(t => t.project))].length,
        activeAssociates: [...new Set(filteredTimers.map(t => t.employee))].length
    }), [filteredTimers]);

    const handleStop = async (id) => {
        if (!window.confirm("Are you sure you want to stop this timer?")) return;
        try {
            await apiClient.patch(`/hr/work-sessions/${id}/`, {
                end_time: new Date().toISOString()
            });
            fetchData();
        } catch (error) {
            console.error("Failed to stop timer", error);
        }
    };
    
    const handleExportPDF = () => {
        const doc = new jsPDF();
        
        // Add title
        doc.setFontSize(18);
        doc.text("Active Timers Report", 14, 20);
        
        // Add filters info
        doc.setFontSize(10);
        let yPos = 30;
        if (project) {
            const proj = projectsList.find(p => p.id.toString() === project);
            doc.text(`Project: ${proj?.name || 'N/A'}`, 14, yPos);
            yPos += 6;
        }
        if (task) {
            const t = tasksList.find(t => t.id.toString() === task);
            doc.text(`Task: ${t?.name || 'N/A'}`, 14, yPos);
            yPos += 6;
        }
        if (employee) {
            const emp = employeesList.find(e => e.id.toString() === employee);
            doc.text(`Employee: ${emp?.name || emp?.email || 'N/A'}`, 14, yPos);
            yPos += 6;
        }
        
        // Prepare table data
        const tableData = filteredTimers.map(timer => [
            `#${timer.id}`,
            timer.task || 'N/A',
            timer.project || 'N/A',
            timer.employee || 'Unknown',
            `${timer.startDate} ${timer.startTime}`,
            formatDuration(timer.duration)
        ]);
        
        // Add table using autoTable
        autoTable(doc, {
            startY: yPos + 5,
            head: [['ID', 'Task', 'Project', 'Employee', 'Start Time', 'Duration']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [0, 0, 0] },
            styles: { fontSize: 9 }
        });
        
        // Add footer
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.text(
                `Page ${i} of ${pageCount} | Generated on ${new Date().toLocaleString()}`,
                14,
                doc.internal.pageSize.height - 10
            );
        }
        
        doc.save(`active-timers-${new Date().toISOString().split('T')[0]}.pdf`);
        setExportDropdownOpen(false);
    };
    
    const handleExportExcel = () => {
        // Prepare data
        const data = filteredTimers.map(timer => ({
            'ID': `#${timer.id}`,
            'Task': timer.task || 'N/A',
            'Project': timer.project || 'N/A',
            'Employee': timer.employee || 'Unknown',
            'Start Date': timer.startDate,
            'Start Time': timer.startTime,
            'Duration': formatDuration(timer.duration),
            'Status': timer.taskStatus || 'N/A'
        }));
        
        // Create worksheet
        const ws = XLSX.utils.json_to_sheet(data);
        
        // Set column widths
        ws['!cols'] = [
            { wch: 8 },  // ID
            { wch: 25 }, // Task
            { wch: 20 }, // Project
            { wch: 20 }, // Employee
            { wch: 12 }, // Start Date
            { wch: 12 }, // Start Time
            { wch: 12 }, // Duration
            { wch: 15 }  // Status
        ];
        
        // Create workbook
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Active Timers');
        
        // Save file
        XLSX.writeFile(wb, `active-timers-${new Date().toISOString().split('T')[0]}.xlsx`);
        setExportDropdownOpen(false);
    };

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
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 w-full">
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
                                    onClick={fetchData}
                                    className="p-3 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition active:scale-95 text-gray-600"
                                    title="Refresh"
                                >
                                    <MdRefresh className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
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

                            <div className="relative" ref={exportDropdownRef}>
                                <button 
                                    onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
                                    className="flex items-center gap-2 px-5 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition text-sm font-medium"
                                >
                                    <MdDownload className="w-5 h-5" /> Export
                                    <MdKeyboardArrowDown className={`w-4 h-4 transition-transform ${exportDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>
                                {exportDropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                                        <button
                                            onClick={handleExportPDF}
                                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition flex items-center gap-2"
                                        >
                                            <MdDownload className="w-4 h-4" />
                                            Export as PDF
                                        </button>
                                        <button
                                            onClick={handleExportExcel}
                                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition flex items-center gap-2"
                                        >
                                            <MdDownload className="w-4 h-4" />
                                            Export as Excel
                                        </button>
                                    </div>
                                )}
                            </div>
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
                                        <Input
                                            label="Project"
                                            type="select"
                                            value={project}
                                            onChange={setProject}
                                            options={[
                                                { label: "All Projects", value: "" },
                                                ...projectsList.map(p => ({ label: p.name, value: p.id }))
                                            ]}
                                        />
                                        <Input
                                            label="Task"
                                            type="select"
                                            value={task}
                                            onChange={setTask}
                                            options={[
                                                { label: "All Tasks", value: "" },
                                                ...tasksList.map(t => ({ label: t.name, value: t.id }))
                                            ]}
                                        />
                                        <Input
                                            label="Employee"
                                            type="select"
                                            value={employee}
                                            onChange={setEmployee}
                                            options={[
                                                { label: "All Employees", value: "" },
                                                ...employeesList.map(e => ({ label: e.name || e.email, value: e.id }))
                                            ]}
                                        />
                                        <Input
                                            label="Status"
                                            type="select"
                                            value={status}
                                            onChange={setStatus}
                                            options={[
                                                { label: "All Statuses", value: "" },
                                                { label: "To Do", value: "todo" },
                                                { label: "In Progress", value: "in_progress" },
                                                { label: "Review", value: "review" },
                                                { label: "Done", value: "done" }
                                            ]}
                                        />
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
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium text-gray-900">{t.task}</span>
                                                            {t.taskStatus && (
                                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                                                    t.taskStatus === 'todo' ? 'bg-gray-100 text-gray-600' :
                                                                    t.taskStatus === 'in_progress' ? 'bg-blue-100 text-blue-600' :
                                                                    t.taskStatus === 'review' ? 'bg-yellow-100 text-yellow-600' :
                                                                    'bg-green-100 text-green-600'
                                                                }`}>
                                                                    {t.taskStatus.replace('_', ' ')}
                                                                </span>
                                                            )}
                                                        </div>
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
                                                        onClick={() => handleStop(t.id)}
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