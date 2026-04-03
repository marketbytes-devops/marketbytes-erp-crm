import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  MdGroups,
  MdPendingActions,
  MdAccessTime,
  MdCalendarMonth,
  MdTrendingUp,
  MdArrowForward,
  MdCheckCircle,
  MdWarningAmber,
  MdTimer,
  MdLeaderboard,
} from "react-icons/md";
import apiClient from "../../../helpers/apiClient";
import Loading from "../../../components/Loading";
import NoticesEventsWidget from "../../../components/Dashboard/NoticesEventsWidget";

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
        <span className="text-[10px] bg-black text-white transition-all hover:bg-gray-100 hover:text-black cursor-pointer shadow-sm px-4 py-3 text-sm rounded-xl font-medium">
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

const safeLen = (v) => (Array.isArray(v) ? v.length : 0);

const HRDashboard = () => {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [employeeCount, setEmployeeCount] = useState(null);
  const [leavePendingCount, setLeavePendingCount] = useState(null);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [activeSessions, setActiveSessions] = useState([]);
  const [overtimeSummary, setOvertimeSummary] = useState({ totalHours: null, totalRecords: null });
  const [topClockins, setTopClockins] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();

        const [profileRes, employeesRes, leavesRes, attendanceRes, activeSessionsRes] =
          await Promise.allSettled([
            apiClient.get("/auth/profile/"),
            apiClient.get("/auth/users/", { params: { status: "active" } }),
            apiClient.get("/hr/leaves/", { params: { status: "pending" } }),
            apiClient.get("/hr/attendance/summary/"),
            apiClient.get("/hr/timer/active_sessions/"),
          ]);

        const [overtimeRes, clockinsRes] = await Promise.allSettled([
          apiClient.get("/hr/overtime/", { params: { month, year } }),
          apiClient.get("/hr/attendance/clockin-counts/", { params: { month, year } }),
        ]);

        if (profileRes.status === "fulfilled") setProfile(profileRes.value.data);

        if (employeesRes.status === "fulfilled") {
          const list = employeesRes.value.data?.results || employeesRes.value.data || [];
          setEmployeeCount(safeLen(list));
        }

        if (leavesRes.status === "fulfilled") {
          const list = leavesRes.value.data?.results || leavesRes.value.data || [];
          setLeavePendingCount(safeLen(list));
          setPendingLeaves(Array.isArray(list) ? list.slice(0, 5) : []);
        } else {
          setPendingLeaves([]);
        }

        if (attendanceRes.status === "fulfilled") setAttendanceSummary(attendanceRes.value.data);

        if (activeSessionsRes.status === "fulfilled") {
          setActiveSessions(activeSessionsRes.value.data || []);
        } else {
          setActiveSessions([]);
        }

        if (overtimeRes.status === "fulfilled") {
          const list = overtimeRes.value.data?.results || overtimeRes.value.data || [];
          const rows = Array.isArray(list) ? list : [];
          const totalHours = rows.reduce((sum, r) => sum + (parseFloat(r.hours) || 0), 0);
          setOvertimeSummary({
            totalHours: Number.isFinite(totalHours) ? Number(totalHours.toFixed(2)) : 0,
            totalRecords: rows.length,
          });
        } else {
          setOvertimeSummary({ totalHours: null, totalRecords: null });
        }

        if (clockinsRes.status === "fulfilled") {
          const rows = clockinsRes.value.data?.results || clockinsRes.value.data || [];
          setTopClockins(Array.isArray(rows) ? rows.slice(0, 5) : []);
        } else {
          setTopClockins([]);
        }
      } catch (e) {
        // fall through
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const attendanceStats = useMemo(() => {
    const s = attendanceSummary || {};
    const present = Number(s.present || 0);
    const late = Number(s.late || 0);
    const halfDay = Number(s.half_day || 0);
    const leave = Number(s.leave || 0);
    const absent = Number(s.absent || 0);
    const holiday = Number(s.holiday || 0);
    const total = present + late + halfDay + leave + absent + holiday;
    return { present, late, halfDay, leave, absent, holiday, total };
  }, [attendanceSummary]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loading />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 min-h-screen font-syne">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl md:text-3xl font-medium text-gray-800 font-syne">
            HR Dashboard{profile?.first_name ? `: ${profile.first_name}` : ""}
          </h1>
          <p className="text-gray-500 mt-1">
            Employee health, attendance, leaves, and active sessions.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-gray-800">
              {profile?.first_name} {profile?.last_name}
            </p>
            <p className="text-xs text-gray-500">{profile?.role?.name || "HR"}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center font-medium shadow-md border-2 border-gray-100">
            {profile?.first_name?.charAt(0) || "H"}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Active Employees"
          value={employeeCount ?? "—"}
          subValue="Directory"
          icon={<MdGroups />}
          colorClass="text-indigo-600"
          bgClass="bg-indigo-50"
          onClick={() => navigate("/hr/employees")}
        />
        <StatCard
          title="Pending Leave Requests"
          value={leavePendingCount ?? "—"}
          subValue="Review"
          icon={<MdPendingActions />}
          colorClass="text-orange-600"
          bgClass="bg-orange-50"
          onClick={() => navigate("/hr/leaves")}
        />
        <StatCard
          title="Active Work Sessions"
          value={activeSessions?.length || 0}
          subValue="Time Logs"
          icon={<MdAccessTime />}
          colorClass="text-purple-600"
          bgClass="bg-purple-50"
          onClick={() => navigate("/operations/time-logs")}
        />
        <StatCard
          title="Monthly Attendance (Total)"
          value={attendanceStats.total || 0}
          subValue="Attendance"
          icon={<MdTrendingUp />}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
          onClick={() => navigate("/hr/attendance")}
        />
        <StatCard
          title="Overtime Hours (This Month)"
          value={overtimeSummary.totalHours ?? "—"}
          subValue={
            overtimeSummary.totalRecords != null ? `${overtimeSummary.totalRecords} Records` : "Overtime"
          }
          icon={<MdTimer />}
          colorClass="text-gray-800"
          bgClass="bg-gray-100"
          onClick={() => navigate("/hr/overtime")}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pending Leaves */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-2.5 text-sm border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="font-medium text-gray-800">Recent Pending Leaves</h2>
                <p className="text-sm text-gray-500">Top 5 requests awaiting action</p>
              </div>
              <button
                onClick={() => navigate("/hr/leaves")}
                className="bg-black text-white hover:bg-gray-100 hover:text-black transition-all flex items-center gap-1 px-4 py-3 text-sm rounded-xl font-medium"
              >
                Review <MdArrowForward />
              </button>
            </div>
            <div className="p-6">
              {pendingLeaves.length === 0 ? (
                <div className="py-10 text-center text-gray-400">No pending leave requests.</div>
              ) : (
                <div className="space-y-3">
                  {pendingLeaves.map((l) => (
                    <div
                      key={l.id}
                      className="flex items-start gap-3 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition"
                    >
                      <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-700 flex items-center justify-center font-medium">
                        {(l.employee?.name || "E").charAt(0)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">
                          {l.employee?.name || "Employee"}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {l.leave_type_name || l.leave_type?.name || "Leave"} •{" "}
                          {l.start_date ? new Date(l.start_date).toLocaleDateString() : "—"}{" "}
                          → {l.end_date ? new Date(l.end_date).toLocaleDateString() : "—"}
                          {l.duration === "half_day" ? " • Half day" : ""}
                        </p>
                      </div>
                      <div className="text-xs text-gray-500">
                        {l.created_at ? new Date(l.created_at).toLocaleDateString() : ""}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Attendance Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-2.5 text-sm border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="font-medium text-gray-800">Attendance Summary (This Month)</h2>
                <p className="text-sm text-gray-500">Present, late, leave and absences</p>
              </div>
              <button
                onClick={() => navigate("/hr/attendance")}
                className="bg-black text-white hover:bg-gray-100 hover:text-black transition-all flex items-center gap-1 px-4 py-3 text-sm rounded-xl font-medium"
              >
                View <MdArrowForward />
              </button>
            </div>
            <div className="p-6 grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: "Present", value: attendanceStats.present, icon: <MdCheckCircle />, tone: "bg-emerald-50 text-emerald-700 border-emerald-100" },
                { label: "Late", value: attendanceStats.late, icon: <MdWarningAmber />, tone: "bg-yellow-50 text-yellow-700 border-yellow-100" },
                { label: "Half Day", value: attendanceStats.halfDay, icon: <MdWarningAmber />, tone: "bg-amber-50 text-amber-700 border-amber-100" },
                { label: "Leave", value: attendanceStats.leave, icon: <MdCalendarMonth />, tone: "bg-indigo-50 text-indigo-700 border-indigo-100" },
                { label: "Holiday", value: attendanceStats.holiday, icon: <MdCalendarMonth />, tone: "bg-gray-50 text-gray-700 border-gray-100" },
                { label: "Absent", value: attendanceStats.absent, icon: <MdWarningAmber />, tone: "bg-red-50 text-red-700 border-red-100" },
              ].map((x) => (
                <div key={x.label} className={`p-4 rounded-xl border ${x.tone} flex items-center justify-between`}>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{x.label}</p>
                    <p className="text-2xl font-semibold mt-1">{x.value}</p>
                  </div>
                  <div className="opacity-80">{x.icon}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Sessions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-2.5 text-sm border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="font-medium text-gray-800">Active Sessions</h2>
                <p className="text-sm text-gray-500">Employees currently working</p>
              </div>
              <button
                onClick={() => navigate("/operations/time-logs")}
                className="bg-black text-white hover:bg-gray-100 hover:text-black transition-all flex items-center gap-1 px-4 py-3 text-sm rounded-xl font-medium"
              >
                View <MdArrowForward />
              </button>
            </div>
            <div className="p-6">
              {activeSessions?.length ? (
                <div className="space-y-3">
                  {activeSessions.slice(0, 6).map((s) => (
                    <div
                      key={s.id}
                      className="flex items-start gap-3 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition"
                    >
                      <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center font-medium">
                        {(s.employee_name || "E").charAt(0)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">
                          {s.employee_name || "Employee"}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {s.project_name ? `Project: ${s.project_name}` : "Project: —"}
                          {s.task_title ? ` • Task: ${s.task_title}` : ""}
                        </p>
                      </div>
                      <div className="text-xs text-gray-500">
                        {s.start_time ? new Date(s.start_time).toLocaleTimeString() : ""}
                      </div>
                    </div>
                  ))}
                  {activeSessions.length > 6 && (
                    <p className="text-xs text-gray-500">
                      Showing 6 of {activeSessions.length} active sessions.
                    </p>
                  )}
                </div>
              ) : (
                <div className="py-10 text-center text-gray-400">
                  No active sessions right now.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="space-y-6">
          <NoticesEventsWidget />

          {/* Top Clock-ins */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-2.5 text-sm border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="font-medium text-gray-800">Top Clock-ins (This Month)</h2>
                <p className="text-sm text-gray-500">Employees with most clock-ins</p>
              </div>
              <MdLeaderboard className="text-xl text-gray-400" />
            </div>
            <div className="p-6">
              {topClockins.length === 0 ? (
                <div className="py-8 text-center text-gray-400">No data</div>
              ) : (
                <div className="space-y-2">
                  {topClockins.map((x, idx) => (
                    <div
                      key={`${x.employee_id || x.employee || idx}`}
                      className="flex items-center justify-between p-3 rounded-xl border border-gray-100"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {x.employee_name || x.employee || "Employee"}
                        </p>
                        <p className="text-xs text-gray-500">
                          Employee ID: {x.employee_id || "—"}
                        </p>
                      </div>
                      <div className="text-sm font-semibold text-gray-900">
                        {x.clockin_count ?? 0}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-medium text-gray-800 mb-4">Quick Navigation</h3>
            <div className="space-y-3">
              {[
                { label: "Employees", path: "/hr/employees" },
                { label: "Attendance", path: "/hr/attendance" },
                { label: "Leaves", path: "/hr/leaves" },
                { label: "Performance", path: "/hr/performance" },
                { label: "Overtime", path: "/hr/overtime" },
              ].map((x) => (
                <button
                  key={x.path}
                  onClick={() => navigate(x.path)}
                  className="w-full flex items-center justify-between bg-black text-white hover:bg-gray-100 hover:text-black transition-all text-left group px-4 py-3 text-sm rounded-xl font-medium"
                >
                  <span className="flex-1">{x.label}</span>
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

export default HRDashboard;

