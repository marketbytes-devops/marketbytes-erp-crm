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
  MdFilterList,
  MdCalendarMonth,
  MdTimeline,
  MdArrowForward,
  MdLaunch
} from "react-icons/md";
import apiClient from "../../../helpers/apiClient";
import Loading from "../../../components/Loading";

const StatCard = ({ title, value, subValue, icon, delay, onClick }) => (
  <div
    onClick={onClick}
    className="bg-white p-6 rounded-xl shadow-xs border border-gray-100 hover:border-black hover:shadow-2xl transition-all duration-500 group cursor-pointer overflow-hidden relative"
  >
    <div className="absolute -right-4 -top-4 w-28 h-28 rounded-full bg-black opacity-0 group-hover:opacity-5 transition-all duration-700 group-hover:scale-150" />
    <div className="flex items-center justify-between relative z-10">
      <div className="space-y-1">
        <p className="text-gray-600 text-[10px] font-medium uppercase tracking-wider">{title}</p>
        <h3 className="text-3xl font-medium text-gray-900 leading-none group-hover:tracking-tight transition-all">{value}</h3>
        {subValue && <p className="text-[10px] text-gray-600 font-medium group-hover:text-gray-800 transition-colors uppercase tracking-tight">{subValue}</p>}
      </div>
      <div className="p-4 rounded-3xl bg-gray-50 text-gray-900 group-hover:bg-black group-hover:text-white transition-all duration-500 shadow-inner">
        {React.cloneElement(icon, { className: "w-7 h-7" })}
      </div>
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

  return (
    <div className="p-8 space-y-12 max-w-7xl mx-auto min-h-screen">
      {/* Black & White Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-12 h-[2px] bg-black" />
            <span className="text-[10px] font-medium uppercase tracking-wider text-gray-600">System Core v4.0</span>
          </div>
          <h1 className="text-6xl font-medium text-black leading-none uppercase tracking-tighter">
            MarketBytes<span className="text-gray-600">.</span>Admin
          </h1>
          <p className="text-gray-700 font-medium text-sm max-w-md">Synchronized workspace for {profile?.first_name || profile?.username}. Your operational efficiency is at <span className="text-black font-medium">Optimum</span>.</p>
        </div>

        <div className="flex items-center gap-6 bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
          <div className="flex flex-col text-right">
            <p className="text-[9px] text-gray-600 font-medium uppercase tracking-wider leading-none mb-1">Network Status</p>
            <p className="text-xs font-medium text-black flex items-center gap-2 justify-end uppercase">
              <span className="w-2 h-2 bg-black rounded-full animate-pulse" />
              Live Pulse
            </p>
          </div>
          <div className="w-14 h-14 rounded-3xl bg-black text-white flex items-center justify-center font-medium text-xl shadow-2xl">
            {profile?.first_name?.charAt(0) || "U"}
          </div>
        </div>
      </div>

      {/* Monochrome Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard
          title="Pipeline Value"
          value={formatCurrency(leadStats?.total_value || 0)}
          subValue={`${leadStats?.total_leads || 0} Opportunities`}
          icon={<MdAttachMoney />}
          delay={0.1}
          onClick={() => navigate('/sales/pipeline')}
        />
        <StatCard
          title="Active Projects"
          value={projectStats?.active_projects || 0}
          subValue={`${projectStats?.upcoming_deadlines || 0} Deadlines`}
          icon={<MdAssessment />}
          delay={0.2}
          onClick={() => navigate('/operations/projects')}
        />
        <StatCard
          title="Work Hours"
          value={timerStatus?.today_total_work || "00:00"}
          subValue="Current Session"
          icon={<MdAccessTime />}
          delay={0.3}
        />
        <StatCard
          title="Task Load"
          value={myTasks.filter(t => t.status !== 'completed').length}
          subValue={`${myTasks.filter(t => t.priority === 'high').length} High Priority`}
          icon={<MdAssignment />}
          delay={0.4}
          onClick={() => navigate('/operations/tasks')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Content (Black & White Variants) */}
        <div className="lg:col-span-8 space-y-12">

          {/* Enhanced Pipeline View */}
          {hasPermission('leads') && (
            <div className="bg-white rounded-xl shadow-xs border border-gray-100 overflow-hidden">
              <div className="p-10 border-b border-gray-50 flex items-center justify-between">
                <div className="space-y-1">
                  <h2 className="text-2xl font-medium text-black uppercase tracking-tighter">Growth Analytics</h2>
                  <p className="text-xs text-gray-600 font-medium uppercase tracking-wider">Sales pipeline flow & conversion</p>
                </div>
                <button
                  onClick={() => navigate('/sales/pipeline')}
                  className="p-4 bg-gray-50 hover:bg-black hover:text-white rounded-3xl transition-all duration-500 cursor-pointer"
                >
                  <MdLaunch className="text-xl" />
                </button>
              </div>
              <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-16">
                <div className="space-y-8">
                  {leadStats?.leads_by_status?.map((st, i) => (
                    <div key={i} className="space-y-3 group">
                      <div className="flex justify-between items-end">
                        <span className="text-[10px] font-medium text-gray-600 uppercase tracking-wider group-hover:text-black transition-colors">{st.status}</span>
                        <span className="text-sm font-medium text-black">{st.count}</span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-black rounded-full transition-all duration-1000"
                          style={{ width: `${(st.count / (leadStats.total_leads || 1)) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  {(!leadStats?.leads_by_status || leadStats.leads_by_status.length === 0) && (
                    <div className="py-12 text-center border-2 border-dashed border-gray-100 rounded-xl">
                      <p className="text-gray-300 font-medium uppercase tracking-wider text-[10px]">No Pipeline Data</p>
                    </div>
                  )}
                </div>
                <div className="bg-black rounded-xl p-10 flex flex-col justify-between text-white shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000" />
                  <div className="relative z-10 space-y-2">
                    <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Performance Score</p>
                    <h4 className="text-6xl font-medium leading-none">A<span className="text-white/20">+</span></h4>
                  </div>
                  <div className="relative z-10 space-y-4">
                    <p className="text-sm text-gray-400 leading-relaxed font-medium">Efficiency up by <span className="text-white font-medium">24%</span>. Your market penetration strategies are yielding elite results.</p>
                    <button
                      onClick={() => navigate('/sales/leads')}
                      className="flex items-center gap-3 text-[10px] font-medium uppercase tracking-wider hover:gap-5 transition-all"
                    >
                      Deep Analytics <MdArrowForward className="text-lg" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Operational Index (Minimalist Table) */}
          <div className="bg-white rounded-xl shadow-xs border border-gray-100 overflow-hidden">
            <div className="p-10 border-b border-gray-50 flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-2xl font-medium text-black uppercase tracking-tighter">Execution Index</h2>
                <p className="text-xs text-gray-600 font-medium uppercase tracking-wider">Live task synchronization</p>
              </div>
              <button
                onClick={() => navigate('/operations/tasks')}
                className="text-[10px] font-medium text-black uppercase tracking-wider hover:tracking-widest transition-all flex items-center gap-2 group cursor-pointer"
              >
                Full Operations <MdArrowForward className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
            <div className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50/30">
                      <th className="px-10 py-6 text-[10px] font-medium text-gray-700 uppercase tracking-wider">Engagement</th>
                      <th className="px-10 py-6 text-[10px] font-medium text-gray-700 uppercase tracking-wider">Schedule</th>
                      <th className="px-10 py-6 text-[10px] font-medium text-gray-700 uppercase tracking-wider text-right whitespace-nowrap">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {myTasks.slice(0, 5).map((task, i) => (
                      <tr key={i} className="group hover:bg-black transition-all duration-500 cursor-pointer" onClick={() => navigate(`/operations/tasks/edit/${task.id}`)}>
                        <td className="px-10 py-8">
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900 group-hover:text-white transition-colors uppercase tracking-wider text-xs truncate max-w-[250px]">{task.title}</span>
                            <span className="text-[9px] font-medium text-gray-300 group-hover:text-gray-500 mt-2 uppercase tracking-tight">{task.project_name || 'System General'}</span>
                          </div>
                        </td>
                        <td className="px-10 py-8">
                          <div className="flex items-center gap-3 text-gray-600 group-hover:text-gray-100 transition-colors">
                            <MdCalendarMonth className="text-lg opacity-60" />
                            <span className="text-[10px] font-medium uppercase tracking-wider">
                              {task.due_date ? new Date(task.due_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'ASAP'}
                            </span>
                          </div>
                        </td>
                        <td className="px-10 py-8 text-right">
                          <span className={`inline-flex items-center gap-3 px-4 py-2 rounded-2xl text-[9px] font-medium uppercase tracking-wider border transition-all duration-500 ${task.status === 'completed'
                            ? 'bg-gray-50 text-gray-600 border-gray-100 group-hover:bg-white/10 group-hover:text-white group-hover:border-white/10'
                            : 'bg-black text-white border-black group-hover:bg-white group-hover:text-black group-hover:border-white'
                            }`}>
                            {task.status.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {myTasks.length === 0 && (
                      <tr>
                        <td colSpan="3" className="py-24 text-center">
                          <p className="text-[10px] font-medium text-gray-300 uppercase tracking-wider">Zero Active Impediments</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Right Navigation & Control */}
        <div className="lg:col-span-4 space-y-12">

          {/* Studio Navigation Hub */}
          <div className="bg-white rounded-xl p-12 shadow-2xl space-y-10">
            <div className="space-y-2 text-center">
              <h3 className="text-3xl font-medium text-black uppercase tracking-tighter">Command</h3>
              <p className="text-[10px] text-gray-600 font-medium uppercase tracking-wider">Instant Platform Access</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {[
                { label: 'Projects', path: '/operations/projects', icon: <MdAssessment /> },
                { label: 'Employees', path: '/hr/employees', icon: <MdPeopleOutline /> },
                { label: 'Leaves', path: '/hr/leaves', icon: <MdPendingActions /> },
                { label: 'Reports', path: '/sales/reports', icon: <MdTrendingUp /> },
              ].filter(a => hasPermission(a.label === 'Studio Projects' ? 'Projects' : a.label.split(' ')[0].toLowerCase())).map((action, i) => (
                <button
                  key={i}
                  onClick={() => navigate(action.path)}
                  className="flex items-center justify-between w-full p-5 rounded-3xl bg-gray-50 border border-transparent hover:border-black hover:bg-white transition-all duration-500 group"
                >
                  <div className="flex items-center gap-5">
                    <span className="text-black group-hover:scale-125 transition-transform duration-500">{action.icon}</span>
                    <span className="text-[11px] font-medium uppercase tracking-wider text-gray-900">{action.label}</span>
                  </div>
                  <MdArrowForward className="text-gray-500 group-hover:text-black group-hover:translate-x-2 transition-all" />
                </button>
              ))}
            </div>
          </div>

          {/* HR & Optimization Snippet */}
          <div className="bg-black rounded-xl p-10 text-white space-y-8 shadow-2xl relative overflow-hidden group">
            <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-colors duration-1000" />
            <div className="flex items-center justify-between relative z-10">
              <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Team Velocity</p>
              <MdGroups className="text-2xl text-white" />
            </div>

            <div className="space-y-6 relative z-10">
              <div className="flex items-center justify-between p-6 rounded-xl bg-white/5 border border-white/10">
                <div className="space-y-1">
                  <p className="text-[9px] font-medium text-gray-400 uppercase tracking-wider">Efficiency</p>
                  <p className="text-3xl font-medium text-white">92.4%</p>
                </div>
                <div className="w-12 h-12 rounded-full border-2 border-white/10 border-t-white animate-spin-slow shadow-[0_0_20px_rgba(255,255,255,0.1)]" />
              </div>

              <div className="space-y-4">
                <p className="text-xs font-medium text-gray-400 italic leading-relaxed text-center px-4">"The standard you walk past is the standard you accept."</p>
                <p className="text-[8px] font-medium text-gray-600 uppercase text-center tracking-widest">— Excellence Protocol</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;