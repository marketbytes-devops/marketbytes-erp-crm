import { useState, useEffect, useCallback } from "react";
import apiClient from "../../helpers/apiClient";
import WorkTimerButton from "../Ui/WorkTimerButton";
import TimerModal from "../Ui/TimerModal";

const WorkTimerController = () => {
  const [checkedIn, setCheckedIn] = useState(false);
  const [clockIn, setClockIn] = useState(null);
  const [status, setStatus] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Daily totals (ticking)
  const [workSeconds, setWorkSeconds] = useState(0);
  const [breakSeconds, setBreakSeconds] = useState(0);
  const [supportSeconds, setSupportSeconds] = useState(0);

  // Current session timer (for Break/Support only, starts at 0 each time)
  const [sessionSeconds, setSessionSeconds] = useState(0);

  const fetchStatus = useCallback(async () => {
    try {
      const [attRes, timerRes] = await Promise.all([
        apiClient.get("/hr/attendance/status/"),
        apiClient.get("/hr/timer/status/"),
      ]);
      const s = timerRes.data;
      setCheckedIn(attRes.data.checked_in);
      setClockIn(attRes.data.clock_in);
      setStatus(s);

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
    if (!status) return;
    if (!status.is_working && !status.is_on_break) return;

    const id = setInterval(() => {
      setSessionSeconds((prev) => prev + 1);
      if (status.is_working) {
        // Work timer always shows daily total
        setWorkSeconds((prev) => prev + 1);
      } else if (status.is_on_break) {
        // But also update the daily counts for the dashboard
        if (status.active_type === "break") {
          setBreakSeconds((prev) => prev + 1);
        } else if (status.active_type === "support") {
          setSupportSeconds((prev) => prev + 1);
        }
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
      await apiClient.post("/hr/attendance/check_in_out/", { action: "in" });
      await apiClient.post("/hr/timer/start_break/", { type: "break" });
      alert("Attendance marked successfully");
      setCheckedIn(true);
      fetchStatus();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCheckOut = async () => {
    try {
      await apiClient.post("/hr/attendance/check_in_out/", { action: "out" });
      setCheckedIn(false);
      setStatus(null);
      setWorkSeconds(0);
      setBreakSeconds(0);
      setSupportSeconds(0);
      setSessionSeconds(0);
      setModalOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  const startWork = async ({ project, task, memo }) => {
    try {
      await apiClient.post("/hr/timer/start_work/", { project, task, memo });
      setModalOpen(false);
      fetchStatus();
    } catch (e) {
      console.error(e);
    }
  };

  const stopWork = async () => {
    try {
      await apiClient.post("/hr/timer/stop_work/");
      await apiClient.post("/hr/timer/start_break/", { type: "break" });
      setModalOpen(false);
      fetchStatus();
    } catch (e) {
      console.error(e);
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
    if (status?.is_on_break) {
      stopBreak();
      return;
    }
    setModalOpen(true);
  };

  if (loading) return null;

  return (
    <>
      <WorkTimerButton
        onCheckIn={handleCheckIn}
        onCheckOut={() => {
          if (status?.is_working || status?.is_on_break) {
            if (window.confirm("Active timer will be stopped. Proceed to Check Out?")) {
              handleCheckOut();
            }
          } else {
            handleCheckOut();
          }
        }}
        onStartStop={handleStartStopClick}
        status={{
          ...status,
          workSeconds,
          breakSeconds,
          supportSeconds
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