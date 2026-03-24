import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
    MdAssignment,
    MdAssessment,
    MdAccessTime,
    MdPendingActions,
    MdCalendarMonth,
    MdArrowForward,
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

const EmployeeDashboard = () => {
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [stats, setStats] = useState({
        workHours: "00:00",
        completedProjects: 0,
        totalProjects: 0,
        pendingTasks: 0
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
                    apiClient.get("/operation/projects/dashboard_stats/"), // Scoped by backend usually
                    apiClient.get("/operation/tasks/"),
                    apiClient.get("/operation/scrum/")
                ]);

                if (profileRes.status === 'fulfilled') setProfile(profileRes.value.data);

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
                        pendingTasks: t.filter(x => x.status !== 'completed').length
                    }));
                }

                if (scrumRes.status === 'fulfilled') {
                    setScrums(scrumRes.value.data.results || scrumRes.value.data || []);
                }

                // Timeline for Employee (Self focused)
                setTimeline([
                    { name: "Website Redesign", type: "Project", employee: "You", time: "10 minutes ago" },
                    { name: "API Integration", type: "Task", employee: "You", time: "2 hours ago" }
                ]);

            } catch (error) {
                console.error("Error fetching employee dashboard data:", error);
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
        <div className="p-6 md:p-8 space-y-8 bg-slate-50 min-h-screen font-syne">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                        Work Workspace: {profile?.first_name || 'Associate'} 👋
                    </h1>
                    <p className="text-gray-500 mt-1">Focus on your goals and track your progress.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-semibold text-gray-800">{profile?.first_name} {profile?.last_name}</p>
                        <p className="text-xs text-gray-500">{profile?.designation?.name || 'Employee'}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-md border-2 border-emerald-100">
                        {profile?.first_name?.charAt(0) || "E"}
                    </div>
                </div>
            </div>

            {/* Top Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="My Work Hours"
                    value={stats.workHours}
                    subValue="Self Timelogs"
                    icon={<MdAccessTime />}
                    colorClass="text-indigo-600"
                    bgClass="bg-indigo-50"
                    onClick={() => navigate('/employee/time-logs')}
                />
                <StatCard
                    title="My Completed Projects"
                    value={stats.completedProjects}
                    subValue="View All"
                    icon={<MdCheckCircle className="w-6 h-6" />}
                    colorClass="text-emerald-600"
                    bgClass="bg-emerald-50"
                    onClick={() => navigate('/employee/projects?status=completed')}
                />
                <StatCard
                    title="Assigned Projects"
                    value={stats.totalProjects}
                    subValue="Active Tracking"
                    icon={<MdAssessment />}
                    colorClass="text-blue-600"
                    bgClass="bg-blue-50"
                    onClick={() => navigate('/employee/projects')}
                />
                <StatCard
                    title="My Pending Tasks"
                    value={stats.pendingTasks}
                    subValue="Required Action"
                    icon={<MdAssignment />}
                    colorClass="text-orange-600"
                    bgClass="bg-orange-50"
                    onClick={() => navigate('/employee/tasks')}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">

                    {/* Recent Task Table */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-100">
                            <h2 className="text-lg font-bold text-gray-800">My Recent Tasks</h2>
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
                                            <td className="px-6 py-4 text-sm text-gray-600">{task.due_date ? new Date(task.due_date).toLocaleDateString() : 'N/A'}</td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase bg-blue-50 text-blue-600">{task.status}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Overdue Tasks Table */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-100">
                            <h2 className="text-lg font-bold text-gray-800">Critical Overdue</h2>
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
                                    {overdueTasks.map((task) => (
                                        <tr key={task.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 text-sm font-medium text-red-600">{task.title}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{task.total_hours || '0h'}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600 text-right">{new Date(task.due_date).toLocaleDateString()}</td>
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

                <div className="space-y-8">

                    {/* Quick Navigation */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-6">Quick Navigation</h3>
                        <div className="grid grid-cols-1 gap-3">
                            {[
                                { label: 'Project Listing', path: '/employee/projects', icon: <MdAssessment /> },
                                { label: 'Task Listing', path: '/employee/tasks', icon: <MdAssignment /> },
                                { label: 'Scrum Listing', path: '/employee/scrum', icon: <MdTimeline /> },
                                { label: 'Apply Leave', path: '/employee/leaves', icon: <MdPendingActions /> },
                                { label: 'Events', path: '/operations/common-calendar', icon: <MdCalendarMonth /> },
                                { label: 'Attendance', path: '/employee/attendance', icon: <MdWorkOutline /> }
                            ].map((link, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => navigate(link.path)}
                                    className="flex items-center justify-between p-4 rounded-xl hover:bg-emerald-50/30 border border-transparent hover:border-emerald-100 transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-emerald-600 text-xl group-hover:scale-110 transition-transform">{link.icon}</span>
                                        <span className="text-sm font-medium text-gray-700">{link.label}</span>
                                    </div>
                                    <MdArrowForward className="text-gray-300 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Activity Timeline */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-6 font-syne">My Activity</h3>
                        <div className="space-y-6">
                            {timeline.map((act, idx) => (
                                <div key={idx} className="flex gap-4 relative">
                                    {idx !== timeline.length - 1 && <div className="absolute left-4 top-8 bottom-0 w-[1px] bg-gray-100" />}
                                    <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 z-10">
                                        <div className="w-2 h-2 rounded-full bg-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">
                                            You started <span className="text-emerald-600">{act.name}</span>
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">{act.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Events & Notice */}
                    <div className="bg-emerald-600 rounded-2xl shadow-md p-6 text-white group overflow-hidden relative">
                        <div className="absolute -right-8 -top-8 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform" />
                        <div className="relative z-10">
                            <h3 className="text-lg font-bold mb-4">Upcoming Events</h3>
                            <div className="space-y-4">
                                <div className="bg-white/10 p-3 rounded-lg">
                                    <p className="text-xs font-bold text-emerald-200 uppercase">March 15</p>
                                    <p className="text-sm">Team Outing & Celebration</p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default EmployeeDashboard;
