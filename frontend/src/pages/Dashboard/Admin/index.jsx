import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  MdGroups,
  MdAssignment,
  MdAssessment,
  MdAccessTime,
  MdCheckCircle,
  MdPendingActions,
  MdTrendingUp,
  MdPeopleOutline
} from "react-icons/md";
import apiClient from "../../../helpers/apiClient";
import Loading from "../../../components/Loading";

const StatCard = ({ title, value, icon, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group overflow-hidden relative"
  >
    <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-5 transition-transform group-hover:scale-110 ${color}`} />
    <div className="flex items-center justify-between relative z-10">
      <div>
        <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
      </div>
      <div className={`p-3 rounded-xl ${color} bg-opacity-10`}>
        {React.cloneElement(icon, { className: `w-6 h-6 ${color.replace('bg-', 'text-')}` })}
      </div>
    </div>
  </motion.div>
);

const AdminDashboard = () => {
  const [profile, setProfile] = useState(null);
  const [projectStats, setProjectStats] = useState(null);
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [timerStatus, setTimerStatus] = useState(null);
  const [myTasks, setMyTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [profileRes, statsRes, attendanceRes, timerRes, tasksRes] = await Promise.allSettled([
          apiClient.get("/auth/profile/"),
          apiClient.get("/operation/projects/dashboard_stats/"),
          apiClient.get("/hr/attendance/summary/"),
          apiClient.get("/hr/timer/status/"),
          apiClient.get("/operation/tasks/")
        ]);

        if (profileRes.status === 'fulfilled') setProfile(profileRes.value.data);
        if (statsRes.status === 'fulfilled') setProjectStats(statsRes.value.data);
        if (attendanceRes.status === 'fulfilled') setAttendanceStats(attendanceRes.value.data);
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

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto min-h-screen">
      {/* Header section with personalized greeting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-3xl font-bold bg-linear-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent"
          >
            Welcome back, {profile?.first_name || profile?.username?.split('@')[0]}!
          </motion.h1>
          <p className="text-gray-500 mt-1 font-medium">Here's a snapshot of your workspace today.</p>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-3 bg-indigo-50/50 backdrop-blur-sm px-5 py-2.5 rounded-2xl text-indigo-700 font-semibold border border-indigo-100/50 shadow-sm"
        >
          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
          <span>{isSuperadmin ? "Administrator View" : "Employee Dashboard"}</span>
        </motion.div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Projects"
          value={projectStats?.total_projects || 0}
          icon={<MdAssessment />}
          color="bg-blue-600"
          delay={0.1}
        />
        <StatCard
          title="My Active Tasks"
          value={myTasks.filter(t => t.status !== 'completed').length}
          icon={<MdAssignment />}
          color="bg-purple-600"
          delay={0.2}
        />
        <StatCard
          title="Productive Hours"
          value={timerStatus?.today_total_work || "00:00"}
          icon={<MdAccessTime />}
          color="bg-emerald-600"
          delay={0.3}
        />
        <StatCard
          title="Overdue Tasks"
          value={myTasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed').length}
          icon={<MdPendingActions />}
          color="bg-rose-600"
          delay={0.4}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">
          {/* Projects Summary Section */}
          {hasPermission('Projects') && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl shadow-xs border border-gray-100 overflow-hidden"
            >
              <div className="p-7 border-b border-gray-50 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 focus:outline-hidden">Projects Performance</h2>
                <span className="text-sm font-medium text-gray-400">Monthly Update</span>
              </div>
              <div className="p-7">
                <div className="space-y-6">
                  {projectStats?.projects_by_status?.length > 0 ? (
                    projectStats.projects_by_status.map((status, idx) => (
                      <div key={idx} className="space-y-3 focus:outline-hidden">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 font-semibold">{status.status__name}</span>
                          <span className="text-gray-900 font-bold">{status.count} Projects</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(status.count / (projectStats.total_projects || 1)) * 100}%` }}
                            transition={{ duration: 1.2, ease: "circOut" }}
                            className="bg-indigo-600 h-full rounded-full bg-linear-to-r from-indigo-500 to-purple-600"
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <div className="bg-gray-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                        <MdAssessment className="w-8 h-8 text-gray-300" />
                      </div>
                      <p className="text-gray-400 font-medium">No active project analytics found.</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Recent Tasks Table/List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-3xl shadow-xs border border-gray-100 overflow-hidden"
          >
            <div className="p-7 border-b border-gray-50 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 focus:outline-hidden">My Recent Tasks</h2>
              <button className="text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors focus:outline-hidden">View All</button>
            </div>
            <div className="p-7">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-gray-400 text-xs uppercase tracking-wider font-bold">
                      <th className="pb-4">Task Name</th>
                      <th className="pb-4">Project</th>
                      <th className="pb-4">Deadline</th>
                      <th className="pb-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {myTasks.slice(0, 5).map((task, i) => (
                      <tr key={i} className="group hover:bg-gray-50/50 transition-colors">
                        <td className="py-4 font-semibold text-gray-900">{task.title}</td>
                        <td className="py-4 text-gray-500 text-sm">{task.project_name || 'General'}</td>
                        <td className="py-4 text-gray-500 text-sm">
                          {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No date'}
                        </td>
                        <td className="py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${task.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                            task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                            {task.status.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {myTasks.length === 0 && (
                      <tr>
                        <td colSpan="4" className="py-8 text-center text-gray-400">No tasks assigned to you yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Sidebar Widgets */}
        <div className="space-y-8">
          {/* Enhanced Timer Widget */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-linear-to-br from-indigo-600 via-indigo-700 to-purple-800 rounded-3xl p-8 text-white shadow-xl shadow-indigo-200/50 overflow-hidden relative group"
          >
            <div className="absolute -right-6 -bottom-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
              <MdAccessTime className="w-48 h-48" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-6">
                <div className={`w-2 h-2 rounded-full ${timerStatus?.is_working ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                <h3 className="text-sm font-bold uppercase tracking-widest text-indigo-100 focus:outline-hidden">Work Session</h3>
              </div>

              {timerStatus?.is_working ? (
                <div className="space-y-6">
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20">
                    <p className="text-indigo-100 text-xs font-bold uppercase mb-1">Current Focus</p>
                    <p className="font-bold text-lg leading-tight">{timerStatus.current_work_session?.task_name || 'Internal Project'}</p>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-indigo-100 text-xs font-bold uppercase">Time Today</p>
                      <p className="text-3xl font-black mt-1">{timerStatus.today_total_work || "00:00:00"}</p>
                    </div>
                    <MdCheckCircle className="w-10 h-10 text-emerald-400" />
                  </div>
                  <button className="w-full bg-white text-indigo-700 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all focus:outline-hidden">
                    End Session
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <p className="text-indigo-100 font-medium">Ready to start your productive session?</p>
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20">
                    <p className="text-indigo-100 text-xs font-bold uppercase mb-1">Target Hours</p>
                    <p className="font-bold text-lg">08h 00m</p>
                  </div>
                  <button className="w-full bg-white text-indigo-700 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all focus:outline-hidden">
                    Start Timer
                  </button>
                </div>
              )}
            </div>
          </motion.div>

          {/* Quick Actions Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl shadow-xs border border-gray-100 p-7"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-6 focus:outline-hidden">Management Actions</h3>
            <div className="grid grid-cols-1 gap-4">
              {[
                { label: 'Create Project', icon: <MdAssessment />, color: 'text-blue-600', bg: 'bg-blue-50', page: 'Projects' },
                { label: 'Add Employee', icon: <MdPeopleOutline />, color: 'text-purple-600', bg: 'bg-purple-50', page: 'employees' },
                { label: 'Request Leave', icon: <MdPendingActions />, color: 'text-rose-600', bg: 'bg-rose-50', page: 'leaves' },
                { label: 'View Reports', icon: <MdTrendingUp />, color: 'text-emerald-600', bg: 'bg-emerald-50', page: 'reports' },
              ].filter(a => hasPermission(a.page)).map((action, i) => (
                <button key={i} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-all text-gray-700 font-bold text-sm group focus:outline-hidden border border-transparent hover:border-gray-100">
                  <span className={`p-3 rounded-xl ${action.bg} ${action.color} group-hover:scale-110 transition-transform`}>{action.icon}</span>
                  {action.label}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Productivity Tip */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                <MdCheckCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-emerald-900 font-bold text-sm">Productivity Tip</p>
                <p className="text-emerald-700 text-xs mt-1 leading-relaxed">Focus on one high-priority task for at least 45 minutes to enter 'deep work' state.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};


export default AdminDashboard;