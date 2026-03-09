import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
    MdGroups,
    MdAssignment,
    MdAssessment,
    MdAccessTime,
    MdPendingActions,
    MdTrendingUp,
    MdAttachMoney,
    MdCalendarMonth,
    MdArrowForward,
    MdLaunch,
    MdWorkOutline,
    MdTimeline,
    MdFeedback,
    MdCheckCircle
} from "react-icons/md";
import apiClient from "../../../helpers/apiClient";
import Loading from "../../../components/Loading";

const StatCard = ({ title, value, subValue, icon, colorClass, bgClass, onClick }) => (
    <div
        onClick={onClick}
        className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer flex flex-col justify-between"
    >
        <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-xl ${bgClass} ${colorClass}`}>
                {React.cloneElement(icon, { className: "w-6 h-6" })}
            </div>
            {subValue && (
                <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-md">
                    {subValue}
                </span>
            )}
        </div>
        <div>
            <h3 className="text-3xl font-bold text-gray-800 mb-1">{value}</h3>
            <p className="text-sm font-medium text-gray-500">{title}</p>
        </div>
    </div>
);

const LeadDashboard = () => {
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [stats, setStats] = useState({
        workHours: "00:00",
        completedProjects: 0,
        totalProjects: 0,
        pendingTasks: 0,
        highPriorityTasks: 0
    });
    const [recentTasks, setRecentTasks] = useState([]);
    const [scrums, setScrums] = useState([]);
    const [overdueTasks, setOverdueTasks] = useState([]);
    const [timeline, setTimeline] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [profileRes, statsRes, tasksRes, scrumRes] = await Promise.allSettled([
                    apiClient.get("/auth/profile/"),
                    apiClient.get("/operation/projects/dashboard_stats/", { params: { lead_scope: true } }),
                    apiClient.get("/operation/tasks/", { params: { lead_scope: true } }),
                    apiClient.get("/operation/scrum/", { params: { lead_scope: true } })
                ]);

                if (profileRes.status === 'fulfilled') setProfile(profileRes.value.data);

                // Mocking/Mapping stats based on available data
                if (statsRes.status === 'fulfilled') {
                    const s = statsRes.value.data;
                    setStats(prev => ({
                        ...prev,
                        totalProjects: s.total_projects || 0,
                        completedProjects: s.completed_projects || 0
                    }));
                }

                if (tasksRes.status === 'fulfilled') {
                    const t = tasksRes.value.data.results || tasksRes.value.data || [];
                    setRecentTasks(t.slice(0, 5));
                    setOverdueTasks(t.filter(task => new Date(task.due_date) < new Date() && task.status !== 'completed'));
                    setStats(prev => ({
                        ...prev,
                        pendingTasks: t.filter(x => x.status !== 'completed').length,
                        highPriorityTasks: t.filter(x => x.priority === 'high' && x.status !== 'completed').length
                    }));
                }

                if (scrumRes.status === 'fulfilled') {
                    setScrums(scrumRes.value.data.results || scrumRes.value.data || []);
                }

                // Mocking Timeline for now
                setTimeline([
                    { name: "Website Redesign", type: "Project", employee: "Akshay", time: "4 minutes ago" },
                    { name: "Fix Login Bug", type: "Task", employee: "Ajith", time: "12 minutes ago" },
                    { name: "Database Optimization", type: "Task", employee: "Sreepoorna", time: "1 hour ago" }
                ]);

            } catch (error) {
                console.error("Error fetching lead dashboard data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loading />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-8 min-h-screen font-syne">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                        Lead Hub: {profile?.first_name || 'Team Lead'}
                    </h1>
                    <p className="text-gray-500 mt-1">Managing and monitoring your team's performance.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-semibold text-gray-800">{profile?.first_name} {profile?.last_name}</p>
                        <p className="text-xs text-gray-500">Team Lead</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-md">
                        {profile?.first_name?.charAt(0) || "L"}
                    </div>
                </div>
            </div>

            {/* Top Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Work Hours"
                    value={stats.workHours}
                    subValue="Redirect to Timelogs"
                    icon={<MdAccessTime />}
                    colorClass="text-indigo-600"
                    bgClass="bg-indigo-50"
                    onClick={() => navigate('/lead/time-logs')}
                />
                <StatCard
                    title="Completed Projects"
                    value={stats.completedProjects}
                    subValue="View Finished"
                    icon={<MdCheckCircle className="w-6 h-6" />}
                    colorClass="text-emerald-600"
                    bgClass="bg-emerald-50"
                    onClick={() => navigate('/lead/projects?status=completed')}
                />
                <StatCard
                    title="Total Projects"
                    value={stats.totalProjects}
                    subValue="Active & Pending"
                    icon={<MdAssessment />}
                    colorClass="text-blue-600"
                    bgClass="bg-blue-50"
                    onClick={() => navigate('/lead/projects')}
                />
                <StatCard
                    title="Pending Tasks"
                    value={stats.pendingTasks}
                    subValue={`${stats.highPriorityTasks} High Priority`}
                    icon={<MdAssignment />}
                    colorClass="text-orange-600"
                    bgClass="bg-orange-50"
                    onClick={() => navigate('/lead/tasks?status=pending')}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Columns */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Recent Tasks Table */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-800">Recent Tasks</h2>
                            <button onClick={() => navigate('/lead/tasks')} className="text-sm text-indigo-600 font-medium">View All</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">S.No</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Task Details</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Due Date</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {recentTasks.map((task, i) => (
                                        <tr key={task.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 text-sm text-gray-600">{i + 1}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-gray-800 text-sm">{task.title}</span>
                                                    <span className="text-xs text-gray-500">{task.project_name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase bg-blue-50 text-blue-600 border border-blue-100">
                                                    {task.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Scrum Table */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-800">Scrum</h2>
                            <button onClick={() => navigate('/lead/scrum')} className="text-sm text-indigo-600 font-medium">View All</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">S.No</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Project/Task</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Memo</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {scrums.slice(0, 5).map((s, i) => (
                                        <tr key={s.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 text-sm text-gray-600">{i + 1}</td>
                                            <td className="px-6 py-4 text-sm text-gray-800 font-medium">{s.title || s.project_name}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500 truncate max-w-xs">{s.memo || 'No memo available'}</td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase bg-gray-100 text-gray-600">
                                                    {s.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Overdue Tasks */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-100">
                            <h2 className="text-lg font-bold text-gray-800">Overdue Tasks</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Title</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Total Time</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Due Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {overdueTasks.slice(0, 5).map((task) => (
                                        <tr key={task.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 text-sm font-medium text-red-600">{task.title}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{task.total_hours || '0h'}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600 text-right font-medium">
                                                {new Date(task.due_date).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                    {overdueTasks.length === 0 && (
                                        <tr><td colSpan="3" className="px-6 py-8 text-center text-gray-400">No overdue tasks</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>

                {/* Right Column */}
                <div className="space-y-8">

                    {/* Quick Navigation */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-6">Quick Navigation</h3>
                        <div className="grid grid-cols-1 gap-3">
                            {[
                                { label: 'Team Listing', path: '/team/employees', icon: <MdGroups /> },
                                { label: 'Apply Leave', path: '/lead/leaves', icon: <MdPendingActions /> },
                                { label: 'Attendance', path: '/lead/attendance', icon: <MdWorkOutline /> },
                                { label: 'Project Listing', path: '/lead/projects', icon: <MdAssessment /> },
                                { label: 'Task Listing', path: '/lead/tasks', icon: <MdAssignment /> },
                                { label: 'Scrum Listing', path: '/lead/scrum', icon: <MdTimeline /> }
                            ].map((link, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => navigate(link.path)}
                                    className="flex items-center justify-between p-4 rounded-xl border border-gray-50 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-indigo-600 text-xl group-hover:scale-110 transition-transform">{link.icon}</span>
                                        <span className="text-sm font-medium text-gray-700">{link.label}</span>
                                    </div>
                                    <MdArrowForward className="text-gray-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Activity Timeline */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-6 font-syne">Activity Timeline</h3>
                        <div className="space-y-6">
                            {timeline.map((act, idx) => (
                                <div key={idx} className="flex gap-4 relative">
                                    {idx !== timeline.length - 1 && <div className="absolute left-4 top-8 bottom-0 w-[1px] bg-gray-100" />}
                                    <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 z-10">
                                        <div className="w-2 h-2 rounded-full bg-indigo-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">
                                            {act.name} <span className="text-gray-400 font-normal">started by</span> {act.employee}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">{act.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Events & Notice */}
                    <div className="bg-indigo-600 rounded-2xl shadow-md p-6 text-white overflow-hidden relative group">
                        <div className="absolute -right-8 -top-8 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <MdFeedback className="text-2xl" />
                                <h3 className="text-lg font-bold">Notices & Events</h3>
                            </div>
                            <div className="space-y-4">
                                <div className="bg-white/10 p-3 rounded-lg border border-white/20">
                                    <p className="text-xs font-bold uppercase tracking-wider text-indigo-200">Monday, March 9</p>
                                    <p className="text-sm mt-1">Weekly Strategic Sync @ 10:00 AM</p>
                                </div>
                                <div className="bg-white/10 p-3 rounded-lg border border-white/20">
                                    <p className="text-xs font-bold uppercase tracking-wider text-indigo-200">Announcement</p>
                                    <p className="text-sm mt-1">New Performance Metrics Released.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default LeadDashboard;
