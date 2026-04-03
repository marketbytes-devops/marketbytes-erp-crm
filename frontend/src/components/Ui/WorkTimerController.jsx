import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import apiClient from "../../helpers/apiClient";
import WorkTimerButton from "../Ui/WorkTimerButton";
import TimerModal from "../Ui/TimerModal";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { usePermission } from "../../context/PermissionContext";

const WorkTimerController = () => {
 const navigate = useNavigate();
 const { hasPermission } = usePermission();

 const scrumListPath = () => {
   if (hasPermission("scrum", "view")) return "/operations/scrum";
   if (hasPermission("lead_scrum", "view")) return "/lead/scrum";
   if (hasPermission("employee_scrum", "view")) return "/employee/scrum";
   return "/operations/scrum";
 };
 const [checkedIn, setCheckedIn] = useState(false);
 const [clockIn, setClockIn] = useState(null);
 const [status, setStatus] = useState(null);
 const [modalOpen, setModalOpen] = useState(false);
 const [loading, setLoading] = useState(true);

  // New FY productivity summaries
  const [weeklyProductivity, setWeeklyProductivity] = useState(null);
  const [monthlyProductivity, setMonthlyProductivity] = useState(null);

 // Daily totals (ticking)
 const [workSeconds, setWorkSeconds] = useState(0);
 const [breakSeconds, setBreakSeconds] = useState(0);
 const [supportSeconds, setSupportSeconds] = useState(0);

 // Current session timer (for Break/Support only, starts at 0 each time)
 const [sessionSeconds, setSessionSeconds] = useState(0);

  // Ensure UI refreshes when local date flips (policy: timer resets at 12:00 AM)
  const localDateKeyRef = useRef(new Date().toDateString());

 const fetchStatus = useCallback(async () => {
 try {
 const [attRes, timerRes, weeklyRes, monthlyRes] = await Promise.all([
   apiClient.get("/hr/attendance/status/"),
   apiClient.get("/hr/timer/status/"),
   apiClient.get("/hr/timer/weekly_productivity/"),
   apiClient.get("/hr/timer/monthly_productivity/"),
 ]);
 const s = timerRes.data;
 setCheckedIn(attRes.data.checked_in);
 setClockIn(attRes.data.clock_in);
 setStatus(s);
  setWeeklyProductivity(weeklyRes?.data || null);
  setMonthlyProductivity(monthlyRes?.data || null);

 // Sync local timers with backend daily totals
 setWorkSeconds(s.today_total_work_seconds || 0);
 setBreakSeconds(s.today_total_break_seconds || 0);
 setSupportSeconds(s.today_total_support_seconds || 0);

 // Initialize session timer based on current session start
 if ((s.is_working && s.current_work_session?.start_time) || (s.is_on_break && s.current_break_session?.start_time)) {
 const start = new Date(s.is_working ? s.current_work_session.start_time : s.current_break_session.start_time);
 const elapsed = Math.floor((new Date() - start) / 1000);
 setSessionSeconds(elapsed);
 } else {
 setSessionSeconds(0);
 }
 } catch (e) {
 console.error("Status fetch error", e);
 } finally {
 setLoading(false);
 }
 }, []);

 useEffect(() => {
 fetchStatus();
 }, [fetchStatus]);

  useEffect(() => {
    const handleUpdate = () => {
      fetchStatus();
    };
    const handleOpenModal = () => {
      setModalOpen(true);
    };
    window.addEventListener('timer-status-updated', handleUpdate);
    window.addEventListener('open-timer-modal', handleOpenModal);
    return () => {
      window.removeEventListener('timer-status-updated', handleUpdate);
      window.removeEventListener('open-timer-modal', handleOpenModal);
    };
  }, [fetchStatus]);

 useEffect(() => {
 if (!status) return;
 if (!status.is_working && !status.is_on_break) return;

 const id = setInterval(() => {
 setSessionSeconds((prev) => prev + 1);
 if (status.is_working) {
 setWorkSeconds((prev) => prev + 1);
 } else if (status.is_on_break) {
 if (status.active_type === "break") {
 setBreakSeconds((prev) => prev + 1);
 } else if (status.active_type === "support") {
 setSupportSeconds((prev) => prev + 1);
 }
 }

  // When the day changes, refresh backend totals/status immediately.
  const nowKey = new Date().toDateString();
  if (nowKey !== localDateKeyRef.current) {
    localDateKeyRef.current = nowKey;
    fetchStatus();
  }
 }, 1000);
 return () => clearInterval(id);
 }, [status]);

 // Main display timer: Work = Daily Total, Break/Support = Session Duration
 const activeTimerSeconds = status?.is_working
 ? workSeconds
 : status?.is_on_break
 ? sessionSeconds
 : 0;

 const handleCheckIn = async () => {
 try {
 const res = await apiClient.post("/hr/attendance/check_in_out/", { action: "in" });
 // Backend automatically starts a break session, no need to call /hr/timer/start_break/ here
 const time = res?.data?.time || new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
 toast.success("Attendance Marked!", {
 position: "top-right",
 duration: 3000,
 style: {
 borderRadius: '12px',
 background: '#FFFFFF',
 color: '#111827',
 border: '1px solid #E5E7EB',
 padding: '16px',
 fontSize: '14px',
 fontWeight: '500'
 },
 });
 setCheckedIn(true);
 fetchStatus();
 } catch (e) {
 console.error(e);
 }
 };

 const handleCheckOut = async () => {
 try {
 // 1. If currently working, stop work session
 if (status?.is_working) {
 await apiClient.post("/hr/timer/stop_work/");
 }
 // 2. If currently on break/support, stop break session
 else if (status?.is_on_break) {
 await apiClient.post("/hr/timer/stop_break/");
 }

 // 3. Finally, perform the attendance check-out
 await apiClient.post("/hr/attendance/check_in_out/", { action: "out" });

 setCheckedIn(false);
 setStatus(null);
 setWorkSeconds(0);
 setBreakSeconds(0);
 setSupportSeconds(0);
 setSessionSeconds(0);
 setModalOpen(false);
 } catch (e) {
 console.error("Check-out error:", e);
 }
 };

  const startWork = async ({ project, task, memo }) => {
    try {
      await apiClient.post("/hr/timer/start_work/", { project, task, memo });
      setModalOpen(false);
      fetchStatus();
      toast.success("Work started!", { icon: null });
      navigate("/dashboard");
    } catch (e) {
      console.error(e);
      const errMsg = e?.response?.data?.error;
      toast.error(errMsg || "Failed to start work timer");
    }
  };

  const stopWork = async () => {
    try {
      await apiClient.post("/hr/timer/stop_work/");
      setModalOpen(false);
      fetchStatus();
    } catch (e) {
      console.error(e);
      toast.error(e.response?.data?.error || "Failed to stop work timer");
    }
  };

 const startBreak = async (type) => {
 try {
 setSessionSeconds(0);
 await apiClient.post("/hr/timer/start_break/", { type });
 setModalOpen(false);
 fetchStatus();
 } catch (e) {
 console.error(e);
 }
 };

 const stopBreak = async () => {
 try {
 await apiClient.post("/hr/timer/stop_break/");
 setModalOpen(false);
 fetchStatus();
 } catch (e) {
 console.error(e);
 }
 };

  const handleStartStopClick = () => {
    if (!status?.scrum_updated_today && !status?.is_working) {
      // Fixed viewport position (20/20) — only this flow; avoids react-hot-toast stack transforms
      toast.custom(
        () =>
          createPortal(
            <div
              role="status"
              className="max-w-[min(420px,calc(100vw-40px))] rounded-xl bg-black px-4 py-3 text-sm font-medium text-white shadow-lg"
              style={{ position: "fixed", top: 20, right: 25, zIndex: 999999 }}
            >
              Daily scrum required: add at least 1 scrum update today to unlock the timer.
            </div>,
            document.body
          ),
        { duration: 2000 }
      );
      navigate(`${scrumListPath()}?create=1`);
      return;
    }
    
    if (status?.is_on_break) {
      // Instead of stopping break, open modal to allow project selection
      setModalOpen(true);
      return;
    }
    setModalOpen(true);
  };

 if (loading) return null;

 return (
 <>
 <WorkTimerButton
 onCheckIn={handleCheckIn}
 onCheckOut={handleCheckOut}
 onStartStop={handleStartStopClick}
 status={{
 ...status,
 workSeconds,
 breakSeconds,
 supportSeconds,
 clock_in: clockIn
 }}
 timerSeconds={activeTimerSeconds}
 checkedIn={checkedIn}
 clockIn={clockIn}
 />
 <TimerModal
 open={modalOpen}
 onClose={() => setModalOpen(false)}
 onStartWork={startWork}
 onStopWork={stopWork}
 onBreak={() => status?.active_type === "break" ? stopBreak() : startBreak("break")}
 onSupport={() => status?.active_type === "support" ? stopBreak() : startBreak("support")}
 onCheckOut={handleCheckOut}
 checkedIn={checkedIn}
  weeklyProductivity={weeklyProductivity}
  monthlyProductivity={monthlyProductivity}
 status={{
 ...status,
 workSeconds,
 breakSeconds,
 supportSeconds,
 sessionSeconds
 }}
 />
 </>
 );
};

export default WorkTimerController;