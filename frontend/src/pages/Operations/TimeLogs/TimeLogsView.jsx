import React, { useState, useEffect, useMemo, useRef } from 'react';
import LayoutComponents from '../../../components/LayoutComponents';
import {
    MdFilterList,
    MdClose,
    MdKeyboardArrowDown,
    MdDownload,
    MdAdd,
    MdTimer,
    MdCalendarToday,
    MdPerson,
    MdEdit,
    MdDelete,
    MdVisibility
} from 'react-icons/md';
import { FiSearch } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import Input from '../../../components/Input';
import { Link } from "react-router-dom";
import apiClient from "../../../helpers/apiClient";
import toast from "react-hot-toast";
import Loading from "../../../components/Loading";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const TimeLogs = () => {
    const [loading, setLoading] = useState(true);
    const [timeEntries, setTimeEntries] = useState([]);
    const [search, setSearch] = useState("");
    const [filtersOpen, setFiltersOpen] = useState(false);

    // Data for filters
    const [projects, setProjects] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [employees, setEmployees] = useState([]);

    // Filter states
    const [filters, setFilters] = useState({
        project: "",
        task: "",
        employee: "",
        status: "",
        startDate: "",
        endDate: ""
    });

    const [selectedEntry, setSelectedEntry] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    
    // Export dropdown state
    const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
    const exportDropdownRef = useRef(null);

    const activeFilterCount = Object.values(filters).filter(Boolean).length;

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const resetFilters = () => {
        setFilters({
            project: "",
            task: "",
            employee: "",
            status: "",
            startDate: "",
            endDate: ""
        });
        setSearch("");
    };

    const [viewMode, setViewMode] = useState("daily"); // "daily" or "detailed"
    const [detailedEntries, setDetailedEntries] = useState([]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [attendanceRes, sessionRes, projectsRes, tasksRes, employeesRes] = await Promise.all([
                apiClient.get('/hr/attendance/'),
                apiClient.get('/hr/work-sessions/'),
                apiClient.get('/operation/projects/'),
                apiClient.get('/operation/tasks/'),
                apiClient.get('/auth/users/')
            ]);

            const extract = (d) => (Array.isArray(d) ? d : d.results || []);

            setTimeEntries(extract(attendanceRes.data));
            setDetailedEntries(extract(sessionRes.data));
            setProjects(extract(projectsRes.data));
            setTasks(extract(tasksRes.data));
            setEmployees(extract(employeesRes.data));
        } catch (err) {
            console.error(err);
            toast.error("Failed to load time logs");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
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

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this log?")) return;
        try {
            const endpoint = viewMode === "daily" ? `/hr/attendance/${id}/` : `/hr/work-sessions/${id}/`;
            await apiClient.delete(endpoint);
            toast.success("Log deleted successfully");
            fetchData();
        } catch (err) {
            toast.error("Failed to delete log");
        }
    };

    const handleView = (entry) => {
        setSelectedEntry(entry);
        setIsViewModalOpen(true);
    };
    
    const handleExportPDF = () => {
        const doc = new jsPDF();
        
        // Add title
        doc.setFontSize(18);
        doc.text(`Time Logs Report - ${viewMode === 'daily' ? 'Daily Summary' : 'Detailed Logs'}`, 14, 20);
        
        // Add filters info
        doc.setFontSize(10);
        let yPos = 30;
        if (filters.project) {
            const proj = projects.find(p => p.id.toString() === filters.project);
            doc.text(`Project: ${proj?.name || 'N/A'}`, 14, yPos);
            yPos += 6;
        }
        if (filters.employee) {
            const emp = employees.find(e => e.id.toString() === filters.employee);
            doc.text(`Employee: ${emp?.name || emp?.email || 'N/A'}`, 14, yPos);
            yPos += 6;
        }
        
        // Prepare table data based on view mode
        let tableData, headers;
        if (viewMode === 'daily') {
            headers = ['ID', 'Employee', 'Date', 'First Check-in', 'Last Check-out', 'Total Hours', 'Productive Hours'];
            tableData = filteredEntries.map(entry => [
                `#${entry.id}`,
                entry.employee?.name || 'Unknown',
                formatDate(entry.date),
                entry.first_clock_in || 'N/A',
                entry.last_clock_out || 'Active',
                `${entry.total_hours}h`,
                `${entry.productive_hours}h`
            ]);
        } else {
            headers = ['ID', 'Task/Project', 'Employee', 'Start Time', 'End Time', 'Duration', 'Break Timer'];
            tableData = filteredEntries.map(entry => [
                `#${entry.id}`,
                `${entry.task_name || 'Internal'} / ${entry.project_name || 'General'}`,
                entry.employee?.name || 'Unknown',
                formatTime(entry.start_time),
                formatTime(entry.end_time),
                `${entry.total_hours}h`,
                `${entry.break_hours || 0}h`
            ]);
        }
        
        // Add table using autoTable
        autoTable(doc, {
            startY: yPos + 5,
            head: [headers],
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
        
        doc.save(`time-logs-${viewMode}-${new Date().toISOString().split('T')[0]}.pdf`);
        setExportDropdownOpen(false);
    };
    
    const handleExportExcel = () => {
        // Prepare data based on view mode
        let data;
        if (viewMode === 'daily') {
            data = filteredEntries.map(entry => ({
                'ID': `#${entry.id}`,
                'Employee': entry.employee?.name || 'Unknown',
                'Email': entry.employee?.email || 'N/A',
                'Date': formatDate(entry.date),
                'First Check-in': entry.first_clock_in || 'N/A',
                'Last Check-out': entry.last_clock_out || 'Active',
                'Total Hours': `${entry.total_hours}h`,
                'Productive Hours': `${entry.productive_hours}h`,
                'Tasks': entry.tasks || 'N/A',
                'Projects': entry.projects || 'N/A',
                'Type': entry.is_billable ? 'Billable' : 'Internal'
            }));
        } else {
            data = filteredEntries.map(entry => ({
                'ID': `#${entry.id}`,
                'Task': entry.task_name || 'Internal',
                'Project': entry.project_name || 'General',
                'Employee': entry.employee?.name || 'Unknown',
                'Email': entry.employee?.email || 'N/A',
                'Start Time': formatTime(entry.start_time),
                'Start Date': formatDate(entry.start_time),
                'End Time': formatTime(entry.end_time),
                'End Date': formatDate(entry.end_time || entry.start_time),
                'Duration': `${entry.total_hours}h`,
                'Break Timer': `${entry.break_hours || 0}h`,
                'Memo': entry.memo || 'N/A',
                'Type': entry.is_billable ? 'Billable' : 'Internal'
            }));
        }
        
        // Create worksheet
        const ws = XLSX.utils.json_to_sheet(data);
        
        // Set column widths
        const colWidths = viewMode === 'daily' 
            ? [{ wch: 8 }, { wch: 20 }, { wch: 25 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 30 }, { wch: 30 }, { wch: 12 }]
            : [{ wch: 8 }, { wch: 25 }, { wch: 20 }, { wch: 20 }, { wch: 25 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 30 }, { wch: 12 }];
        ws['!cols'] = colWidths;
        
        // Create workbook
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, viewMode === 'daily' ? 'Daily Summary' : 'Detailed Logs');
        
        // Save file
        XLSX.writeFile(wb, `time-logs-${viewMode}-${new Date().toISOString().split('T')[0]}.xlsx`);
        setExportDropdownOpen(false);
    };

    const filteredEntries = useMemo(() => {
        let result = viewMode === "daily" ? timeEntries : detailedEntries;

        if (search.trim()) {
            const term = search.toLowerCase();
            if (viewMode === "daily") {
                result = result.filter(entry =>
                    (entry.tasks?.toLowerCase().includes(term)) ||
                    (entry.employee?.name?.toLowerCase().includes(term)) ||
                    (entry.projects?.toLowerCase().includes(term)) ||
                    (entry.date?.includes(term))
                );
            } else {
                result = result.filter(entry =>
                    (entry.task_name?.toLowerCase().includes(term)) ||
                    (entry.employee?.name?.toLowerCase().includes(term)) ||
                    (entry.project_name?.toLowerCase().includes(term)) ||
                    (entry.memo?.toLowerCase().includes(term))
                );
            }
        }

        if (filters.employee) {
            result = result.filter(entry => entry.employee?.id === parseInt(filters.employee));
        }

        if (filters.project) {
            if (viewMode === "daily") {
                const projectName = projects.find(p => p.id === parseInt(filters.project))?.name?.toLowerCase();
                if (projectName) result = result.filter(entry => entry.projects?.toLowerCase().includes(projectName));
            } else {
                result = result.filter(entry => entry.project === parseInt(filters.project));
            }
        }

        return result;
    }, [timeEntries, detailedEntries, search, filters, projects, viewMode]);

    const stats = useMemo(() => {
        const activeData = filteredEntries;
        return {
            total: activeData.length,
            productive: activeData.reduce((acc, curr) => acc + parseFloat(curr.productive_hours || 0), 0).toFixed(1),
            billable: activeData.filter(e => e.is_billable).length,
            totalHours: activeData.reduce((acc, curr) => acc + parseFloat(curr.total_hours || 0), 0).toFixed(1),
        };
    }, [filteredEntries]);

    const formatDate = (dateStr) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const formatTime = (dateStr) => {
        if (!dateStr) return "Running...";
        const date = new Date(dateStr);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loading /></div>;
    }

    return (
        <div className="p-6">
            <LayoutComponents
                title="Time Logs"
                subtitle="Manage and track employee time logs"
                variant="table"
            >
                <div className="max-w-full mx-auto">
                    {/* Stats Row */}
                    <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                                <div className="text-center">
                                    <div className="text-4xl font-medium text-black mb-2">{stats.total}</div>
                                    <p className="text-sm text-gray-600">Total Entries</p>
                                </div>
                                <div className="text-center">
                                    <div className="text-4xl font-medium text-blue-600 mb-2">{stats.productive}h</div>
                                    <p className="text-sm text-gray-600">Productive Hours</p>
                                </div>
                                <div className="text-center">
                                    <div className="text-4xl font-medium text-green-600 mb-2">{stats.billable}</div>
                                    <p className="text-sm text-gray-600">Billable Logs</p>
                                </div>
                                <div className="text-center">
                                    <div className="text-4xl font-medium text-gray-600 mb-2">{stats.totalHours}h</div>
                                    <p className="text-sm text-gray-600">Total Hours</p>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3">
                                <Link to="/operations/time-logs/active-timers">
                                    <button className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition text-sm font-medium whitespace-nowrap">
                                        <MdTimer className="w-5 h-5" /> Active Timers
                                    </button>
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* View Toggles & Secondary Links */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div className="flex p-1 bg-gray-100 rounded-xl w-fit">
                            <button
                                onClick={() => setViewMode("daily")}
                                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === "daily"
                                        ? "bg-white text-black shadow-sm"
                                        : "text-gray-500 hover:text-gray-800"
                                    }`}
                            >
                                Daily Summary
                            </button>
                            <button
                                onClick={() => setViewMode("detailed")}
                                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === "detailed"
                                        ? "bg-white text-black shadow-sm"
                                        : "text-gray-500 hover:text-gray-800"
                                    }`}
                            >
                                Detailed Logs
                            </button>
                        </div>

                        <div className="flex gap-3">
                            <Link
                                to="/operations/time-logs/calendar-view"
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition text-sm font-medium"
                            >
                                <MdCalendarToday className="w-4 h-4" /> Calendar
                            </Link>
                            <Link
                                to="/operations/time-logs/emplyees-time"
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition text-sm font-medium"
                            >
                                <MdPerson className="w-4 h-4" /> Employee View
                            </Link>
                        </div>
                    </div>

                    {/* Search & Utility Bar */}
                    <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                            <div className="flex items-center gap-4 flex-1">
                                <div className="relative flex-1 max-w-2xl">
                                    <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                                    <input
                                        type="text"
                                        placeholder={viewMode === "daily" ? "Search tasks, employees, date..." : "Search logs..."}
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
                                    {filteredEntries.length} {filteredEntries.length === 1 ? "entry" : "entries"}
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

                    {/* Filter Panel */}
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
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-xl font-medium text-gray-900">Advanced Filters</h3>
                                        <button
                                            onClick={() => setFiltersOpen(false)}
                                            className="p-2 hover:bg-gray-100 rounded-lg transition"
                                        >
                                            <MdClose className="w-6 h-6 text-gray-600" />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                        <Input
                                            label="Project"
                                            type="select"
                                            value={filters.project}
                                            onChange={(v) => handleFilterChange("project", v)}
                                            options={[
                                                { label: "All Projects", value: "" },
                                                ...projects.map((p) => ({ label: p.name, value: p.id.toString() })),
                                            ]}
                                        />
                                        <Input
                                            label="Employee"
                                            type="select"
                                            value={filters.employee}
                                            onChange={(v) => handleFilterChange("employee", v)}
                                            options={[
                                                { label: "All Employees", value: "" },
                                                ...employees.map((e) => ({
                                                    label: e.name || e.email,
                                                    value: e.id.toString(),
                                                })),
                                            ]}
                                        />
                                        <Input
                                            label="Status"
                                            type="select"
                                            value={filters.status}
                                            onChange={(v) => handleFilterChange("status", v)}
                                            options={[
                                                { label: "All Logs", value: "" },
                                                { label: "Verified", value: "approved" },
                                                { label: "Pending", value: "pending" },
                                            ]}
                                        />
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-4 mt-8 pt-6 border-t border-gray-200">
                                        <button
                                            onClick={resetFilters}
                                            className="px-6 py-3.5 border-2 border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition"
                                        >
                                            Reset All Filters
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Table Container */}
                    <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1000px]">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">ID</th>
                                        <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">Task / Project</th>
                                        <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">Employee</th>
                                        <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">Start Time</th>
                                        <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">End Time</th>
                                        <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">Duration</th>
                                        {viewMode === "detailed" && (
                                            <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">Break Timer</th>
                                        )}
                                        <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">Productive Hours</th>
                                        <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">Type</th>
                                        <th className="px-6 py-5 text-right text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filteredEntries.length === 0 ? (
                                        <tr>
                                            <td colSpan={viewMode === "detailed" ? "10" : "9"} className="text-center py-24">
                                                <div className="flex flex-col items-center">
                                                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-5">
                                                        <MdTimer className="w-10 h-10 text-gray-400" />
                                                    </div>
                                                    <p className="text-xl font-medium text-gray-700">No logs found</p>
                                                    <p className="text-gray-500 mt-2">Try adjusting your search or filters</p>
                                                    {(search || activeFilterCount > 0) && (
                                                        <button
                                                            onClick={resetFilters}
                                                            className="mt-5 px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-900 transition font-medium"
                                                        >
                                                            Clear all filters
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredEntries.map((entry, i) => (
                                            <motion.tr
                                                key={entry.id}
                                                initial={{ opacity: 0, y: 15 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.03 }}
                                                className="hover:bg-gray-50 transition"
                                            >
                                                <td className="px-6 py-5 text-sm font-medium text-gray-500 whitespace-nowrap">#{entry.id}</td>
                                                <td className="px-6 py-5 whitespace-nowrap">
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-gray-900 line-clamp-1">
                                                            {viewMode === "daily" ? entry.tasks : (entry.task_name || "Internal")}
                                                        </span>
                                                        <span className="text-xs text-gray-500 mt-1">
                                                            {viewMode === "daily" ? entry.projects : (entry.project_name || "General")}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-medium shadow-sm">
                                                            {entry.employee?.name?.[0]?.toUpperCase() || "E"}
                                                        </div>
                                                        <span className="text-sm font-medium text-gray-900">{entry.employee?.name || entry.employee?.email}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 whitespace-nowrap">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm text-gray-900">
                                                            {viewMode === "daily" ? (entry.first_clock_in || "N/A") : formatTime(entry.start_time)}
                                                        </span>
                                                        <span className="text-xs text-gray-500">
                                                            {formatDate(viewMode === "daily" ? entry.date : entry.start_time)}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 whitespace-nowrap">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm text-gray-900">
                                                            {viewMode === "daily" ? (entry.last_clock_out || "Active") : formatTime(entry.end_time)}
                                                        </span>
                                                        <span className="text-xs text-gray-500">
                                                            {formatDate(viewMode === "daily" ? entry.date : (entry.end_time || entry.start_time))}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 whitespace-nowrap">
                                                    <span className="text-sm font-medium text-gray-900">{entry.total_hours}h</span>
                                                </td>
                                                {viewMode === "detailed" && (
                                                    <td className="px-6 py-5 whitespace-nowrap">
                                                        <span className="text-sm font-medium text-orange-600">{entry.break_hours || 0}h</span>
                                                    </td>
                                                )}
                                                <td className="px-6 py-5 whitespace-nowrap">
                                                    <span className="text-sm font-medium text-blue-600">{entry.productive_hours || 0}h</span>
                                                </td>
                                                <td className="px-6 py-5 whitespace-nowrap">
                                                    {entry.is_billable ? (
                                                        <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium border border-green-100">
                                                            Billable
                                                        </span>
                                                    ) : (
                                                        <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium border border-gray-200">
                                                            Internal
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-5 whitespace-nowrap text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {viewMode === "daily" && (
                                                            <button
                                                                onClick={() => handleView(entry)}
                                                                className="p-2 hover:bg-blue-50 rounded-lg transition group"
                                                                title="View Details"
                                                            >
                                                                <MdVisibility className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleDelete(entry.id)}
                                                            className="p-2 hover:bg-red-50 rounded-lg transition group"
                                                            title="Delete Log"
                                                        >
                                                            <MdDelete className="w-5 h-5 text-gray-600 group-hover:text-red-600" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {filteredEntries.length > 0 && (
                            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-3 text-sm text-gray-600">
                                <span>Showing {filteredEntries.length} of {viewMode === "daily" ? timeEntries.length : detailedEntries.length} entries</span>
                                {activeFilterCount > 0 && (
                                    <button onClick={resetFilters} className="text-blue-600 hover:text-blue-800 font-medium">
                                        Clear all filters
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </LayoutComponents>

            {/* Details Modal */}
            <AnimatePresence>
                {isViewModalOpen && selectedEntry && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsViewModalOpen(false)}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-2xl shadow-xl max-w-2xl w-full flex flex-col max-h-[90vh]"
                        >
                            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-white rounded-t-2xl">
                                <div>
                                    <h3 className="text-xl font-medium text-gray-900">Log Details</h3>
                                    <p className="text-sm text-gray-500 mt-0.5">{formatDate(selectedEntry.date)}</p>
                                </div>
                                <button
                                    onClick={() => setIsViewModalOpen(false)}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                                >
                                    <MdClose className="w-6 h-6 text-gray-500" />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto">
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Employee</p>
                                        <p className="font-medium text-gray-900">{selectedEntry.employee?.name}</p>
                                        <p className="text-xs text-gray-500">{selectedEntry.employee?.email}</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Total Hours</p>
                                        <p className="text-2xl font-medium text-gray-900">{selectedEntry.total_hours}h</p>
                                        <p className="text-xs text-green-600 font-medium mt-1">{selectedEntry.productive_hours}h Productive</p>
                                    </div>
                                </div>

                                <h4 className="text-sm font-medium text-gray-900 mb-4 border-l-4 border-black pl-3">Check-in / Check-out History</h4>

                                {selectedEntry.check_in_out_history && selectedEntry.check_in_out_history.length > 0 ? (
                                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50 border-b border-gray-200">
                                                <tr>
                                                    <th className="px-4 py-3 text-left font-medium text-gray-600">Check In</th>
                                                    <th className="px-4 py-3 text-left font-medium text-gray-600">Check Out</th>
                                                    <th className="px-4 py-3 text-left font-medium text-gray-600">Task Details</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {selectedEntry.check_in_out_history.map((hist, idx) => (
                                                    <tr key={idx} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3 text-gray-900 tabular-nums">{hist.check_in}</td>
                                                        <td className="px-4 py-3 text-gray-900 tabular-nums">{hist.check_out}</td>
                                                        <td className="px-4 py-3">
                                                            <p className="text-gray-900 font-medium">{hist.task || "-"}</p>
                                                            <p className="text-xs text-gray-500">{hist.project || "-"}</p>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                        <p className="text-gray-500 text-sm">No history data available</p>
                                    </div>
                                )}
                            </div>

                            <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl flex justify-end">
                                <button
                                    onClick={() => setIsViewModalOpen(false)}
                                    className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-100 transition shadow-sm"
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TimeLogs;