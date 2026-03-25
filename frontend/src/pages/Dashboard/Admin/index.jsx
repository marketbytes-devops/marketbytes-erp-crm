import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
 MdGroups,
 MdAssignment,
 MdAssessment,
 MdAccessTime,
 MdCheckCircle,
 MdPendingActions,
 MdTrendingUp,
 MdPeopleOutline,
 MdAttachMoney,
 MdCalendarMonth,
 MdArrowForward,
 MdLaunch,
 MdWorkOutline
} from "react-icons/md";
import apiClient from "../../../helpers/apiClient";
import Loading from "../../../components/Loading";

const StatCard = ({ title, value, subValue, icon, colorClass, bgClass, onClick }) => (
 <div
 onClick={onClick}
 className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer flex flex-col justify-between"
 >
 <div className="flex items-center justify-between mb-4">
 <div className={`p-3 rounded-xl ${bgClass} ${colorClass}`}>
 {React.cloneElement(icon, { className: "w-6 h-6" })}
 </div>
   {subValue && (
  <span className="text-[10px] font-medium bg-black text-white px-3 py-1.5 rounded-full transition-all hover:bg-gray-100 hover:text-black cursor-pointer shadow-sm">
  {subValue}
  </span>
  )}

 </div>
 <div>
 <h3 className="text-3xl font-medium text-gray-800 mb-1">{value}</h3>
 <p className="text-sm font-medium text-gray-500">{title}</p>
 </div>
 </div>
);

const AdminDashboard = () => {
 const navigate = useNavigate();
 const [profile, setProfile] = useState(null);
 const [projectStats, setProjectStats] = useState(null);
 const [leadStats, setLeadStats] = useState(null);
 const [timerStatus, setTimerStatus] = useState(null);
 const [myTasks, setMyTasks] = useState([]);
 const [isLoading, setIsLoading] = useState(true);

 useEffect(() => {
 const fetchDashboardData = async () => {
 try {
 const [profileRes, statsRes, leadRes, timerRes, tasksRes] = await Promise.allSettled([
 apiClient.get("/auth/profile/"),
 apiClient.get("/operation/projects/dashboard_stats/"),
 apiClient.get("/sales/leads/dashboard_stats/"),
 apiClient.get("/hr/timer/status/"),
 apiClient.get("/operation/tasks/")
 ]);

 if (profileRes.status === 'fulfilled') setProfile(profileRes.value.data);
 if (statsRes.status === 'fulfilled') setProjectStats(statsRes.value.data);
 if (leadRes.status === 'fulfilled') setLeadStats(leadRes.value.data);
 if (timerRes.status === 'fulfilled') setTimerStatus(timerRes.value.data);
 if (tasksRes.status === 'fulfilled') setMyTasks(tasksRes.value.data.results || tasksRes.value.data || []);
 } catch (error) {
 console.error("Error fetching dashboard data:", error);
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

 const isSuperadmin = profile?.is_superuser || profile?.role?.name === "Superadmin";
 const permissions = profile?.role?.permissions || [];
 const hasPermission = (page) => isSuperadmin || permissions.some(p => p.page === page && p.can_view);

 const formatCurrency = (val) => {
 return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
 };

 const pendingTasks = myTasks.filter(t => t.status !== 'completed');
 const highPriorityTasks = myTasks.filter(t => t.priority === 'high' && t.status !== 'completed');

 return (
 <div className="p-6 space-y-6 min-h-screen font-syne">
 {/* Header Section */}
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
 <div>
 <h1 className="text-2xl md:text-3xl font-medium text-gray-800 font-syne">
 Welcome back, {profile?.first_name || profile?.username || 'Admin'}
 </h1>
 <p className="text-gray-500 mt-1">Here is what's happening today in MarketBytes.</p>
 </div>
 <div className="flex items-center gap-4">
 <div className="text-right hidden sm:block">
 <p className="text-sm font-medium text-gray-800">{profile?.first_name} {profile?.last_name}</p>
 <p className="text-xs text-gray-500">{profile?.role?.name || 'Administrator'}</p>
 </div>
 <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center font-medium shadow-md border-2 border-indigo-100">
 {profile?.first_name?.charAt(0) || "U"}
 </div>
 </div>
 </div>

 {/* Key Metrics / Stat Cards */}
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
 <StatCard
 title="Total Pipeline Value"
 value={formatCurrency(leadStats?.total_value || 0)}
 subValue={`${leadStats?.total_leads || 0} Leads`}
 icon={<MdAttachMoney />}
 colorClass="text-emerald-600"
 bgClass="bg-emerald-100"
 onClick={() => navigate('/sales/pipeline')}
 />
 <StatCard
 title="Active Projects"
 value={projectStats?.active_projects || 0}
 subValue={`${projectStats?.upcoming_deadlines || 0} Upcoming`}
 icon={<MdAssessment />}
 colorClass="text-blue-600"
 bgClass="bg-blue-100"
 onClick={() => navigate('/operations/projects')}
 />
 <StatCard
 title="Today's Work Hours"
 value={timerStatus?.today_total_work || "00:00"}
 subValue="Active Session"
 icon={<MdAccessTime />}
 colorClass="text-purple-600"
 bgClass="bg-purple-100"
 />
 <StatCard
 title="Pending Tasks"
 value={pendingTasks.length}
 subValue={`${highPriorityTasks.length} High Priority`}
 icon={<MdAssignment />}
 colorClass="text-orange-600"
 bgClass="bg-orange-100"
 onClick={() => navigate('/operations/tasks')}
 />
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
 {/* Left Column (Spans 2/3) */}
 <div className="lg:col-span-2 space-y-6">

 {/* Sales Pipeline Overview */}
 {hasPermission('leads') && (
 <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
 <div className="px-5 py-2.5 text-sm border-b border-gray-100 flex items-center justify-between">
 <div>
 <h2 className=" font-medium text-gray-800">Sales Pipeline Overview</h2>
 <p className="text-sm text-gray-500">Current status of all open leads</p>
 </div>
                             <button
                                onClick={() => navigate('/sales/pipeline')}
                                className="px-4 py-2 text-sm bg-black text-white hover:bg-gray-100 hover:text-black transition-all rounded-lg font-medium"
                                title="View Pipeline"
                            >
                                View Pipeline
                            </button>

 </div>
 <div className="p-6">
 {leadStats?.leads_by_status && leadStats.leads_by_status.length > 0 ? (
 <div className="space-y-5">
 {leadStats.leads_by_status.map((st, i) => (
 <div key={i}>
 <div className="flex justify-between items-center mb-1.5">
 <span className="text-sm font-medium text-gray-700 capitalize">{st.status}</span>
 <span className="text-sm font-medium text-gray-900">{st.count}</span>
 </div>
 <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
 <div
 className="h-full bg-indigo-500 rounded-full"
 style={{ width: `${(st.count / (leadStats.total_leads || 1)) * 100}%` }}
 />
 </div>
 </div>
 ))}
 </div>
 ) : (
 <div className="py-10 flex flex-col items-center justify-center text-gray-400">
 <MdTrendingUp className="text-4xl mb-2 opacity-50" />
 <p className="text-sm font-medium">No active leads found in the pipeline</p>
 </div>
 )}
 </div>
 </div>
 )}

 {/* Recent Tasks */}
 <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
 <div className="px-5 py-2.5 text-sm border-b border-gray-100 flex items-center justify-between">
 <div>
 <h2 className=" font-medium text-gray-800">Recent Tasks</h2>
 <p className="text-sm text-gray-500">Your most recent assignments</p>
 </div>
                         <button
                            onClick={() => navigate('/operations/tasks')}
                            className="px-4 py-2 text-sm bg-black text-white hover:bg-gray-100 hover:text-black transition-all rounded-lg font-medium flex items-center gap-1"
                        >
                            View All <MdArrowForward />
                        </button>

 </div>
 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-gray-50 border-b border-gray-100">
   <th className="px-5 py-2.5 text-xs font-medium text-gray-500 uppercase">Task Details</th>
  <th className="px-5 py-2.5 text-xs font-medium text-gray-500 uppercase">Due Date</th>
  <th className="px-5 py-2.5 text-xs font-medium text-gray-500 uppercase text-right">Status</th>

 </tr>
 </thead>
 <tbody className="divide-y divide-gray-100">
 {myTasks.slice(0, 5).map((task, i) => (
 <tr
 key={i}
 className="hover:bg-gray-50 transition-colors cursor-pointer"
 onClick={() => navigate(`/operations/tasks/edit/${task.id}`)}
 >
 <td className="px-5 py-2.5 text-sm">
 <div className="flex flex-col">
 <span className="font-medium text-gray-800 text-sm">{task.title}</span>
 <span className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
 <MdWorkOutline className="text-gray-400" />
 {task.project_name || 'General Task'}
 </span>
 </div>
 </td>
 <td className="px-5 py-2.5 text-sm">
 <div className="flex items-center gap-2 text-sm text-gray-600">
 <MdCalendarMonth className="text-gray-400 " />
 <span>
 {task.due_date ? new Date(task.due_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No exact date'}
 </span>
 </div>
 </td>
 <td className="px-5 py-2.5 text-sm text-right">
 <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize border ${task.status.toLowerCase() === 'completed'
 ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
 : task.status.toLowerCase() === 'in_progress' || task.status.toLowerCase() === 'in progress'
 ? 'bg-blue-50 text-blue-700 border-blue-200'
 : 'bg-yellow-50 text-yellow-700 border-yellow-200'
 }`}>
 {task.status.replace(/_/g, ' ')}
 </span>
 </td>
 </tr>
 ))}
 {myTasks.length === 0 && (
 <tr>
 <td colSpan="3" className="py-12 text-center text-gray-500 text-sm">
 You have no assigned tasks at the moment.
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>
 </div>

 {/* Right Column (Spans 1/3) */}
 <div className="lg:col-span-1 space-y-6">

 {/* Quick Links */}
 <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
 <h3 className=" font-medium text-gray-800 mb-4">Quick Navigation</h3>
 <div className="space-y-3">
 {[
 { label: 'Manage Projects', path: '/operations/projects', icon: <MdAssessment />, color: 'text-blue-600', bg: 'bg-blue-50' },
 { label: 'Employee Directory', path: '/hr/employees', icon: <MdPeopleOutline />, color: 'text-indigo-600', bg: 'bg-indigo-50' },
 { label: 'Leave Requests', path: '/hr/leaves', icon: <MdPendingActions />, color: 'text-orange-600', bg: 'bg-orange-50' },
 { label: 'Financial Reports', path: '/sales/reports', icon: <MdTrendingUp />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
 ].filter(a => hasPermission(a.label.includes('Projects') ? 'Projects' : a.label.split(' ')[0].toLowerCase())).map((action, i) => (
                     <button
                        key={i}
                        onClick={() => navigate(action.path)}
                        className="w-full flex items-center px-4 py-3 rounded-xl bg-black text-white hover:bg-gray-100 hover:text-black transition-all text-left group font-medium"
                    >
                        <div className={`p-2 rounded-lg bg-white/10 text-white mr-3 transition-transform group-hover:text-black`}>
                            {action.icon}
                        </div>
                        <span className="flex-1">{action.label}</span>
                        <MdArrowForward className="text-gray-400 group-hover:text-black transition-colors" />
                    </button>

 ))}
 </div>
 </div>
 </div>
 </div>
 </div>
 );
};

export default AdminDashboard;