import { useState, useEffect, useCallback } from "react";
import apiClient from "../../helpers/apiClient";
import WorkTimerButton from "../Ui/WorkTimerButton";
import TimerModal from "../Ui/TimerModal";

const WorkTimerController = () => {
  const [checkedIn, setCheckedIn] = useState(false);
  const [status, setStatus] = useState(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      const [attRes, timerRes] = await Promise.all([
        apiClient.get("/hr/attendance/status/"),
        apiClient.get("/hr/timer/status/"),
      ]);
      setCheckedIn(attRes.data.checked_in);
      setStatus(timerRes.data);
      setTimerSeconds(0);
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
      setTimerSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [status]);

  const openModal = () => setModalOpen(true);
  const closeModal = () => setModalOpen(false);

  const handleCheckIn = async () => {
    try {
      await apiClient.post("/hr/attendance/check_in_out/", { action: "in" });
      setCheckedIn(true);

      await apiClient.post("/hr/timer/start_work/", { project: null, task: null, memo: "Started day" });
      
      fetchStatus();
      openModal(); 
    } catch (e) {
      console.error(e);
    }
  };

  const handleCheckOut = async () => {
    try {
      await apiClient.post("/hr/attendance/check_in_out/", { action: "out" });
      setCheckedIn(false);
      setStatus(null);
      setTimerSeconds(0);
      closeModal();
    } catch (e) {
      console.error(e);
    }
  };

  const startWork = async ({ project, task, memo }) => {
    try {
      await apiClient.post("/hr/timer/start_work/", { project, task, memo });
      closeModal();
      fetchStatus();
      setTimerSeconds(0);
    } catch (e) {
      console.error(e);
    }
  };

  const stopWork = async () => {
    try {
      await apiClient.post("/hr/timer/stop_work/");
      openModal();
      fetchStatus();
    } catch (e) {
      console.error(e);
    }
  };

  const startBreak = async (type) => {
    try {
      await apiClient.post("/hr/timer/start_break/", { type });
      closeModal();
      fetchStatus();
      setTimerSeconds(0);
    } catch (e) {
      console.error(e);
    }
  };

  const stopBreak = async () => {
    try {
      await apiClient.post("/hr/timer/stop_break/");
      openModal();
      fetchStatus();
    } catch (e) {
      console.error(e);
    }
  };

  const handleTopbarButtonClick = () => {
    if (!checkedIn) {
      handleCheckIn();
      return;
    }
    if (status?.is_working) {
      stopWork();
      return;
    }
    if (status?.is_on_break) {
      stopBreak();
      return;
    }
    openModal();
  };

  if (loading) return null;

  return (
    <>
      <WorkTimerButton
        onOpenWorkTimer={handleTopbarButtonClick}
        status={status}
        timerSeconds={timerSeconds}
        checkedIn={checkedIn}
      />
      <TimerModal
        open={modalOpen}
        onClose={closeModal}
        onStartWork={startWork}
        onBreak={() => startBreak("break")}
        onSupport={() => startBreak("support")}
        onCheckOut={handleCheckOut}
        checkedIn={checkedIn}
        status={status}
      />
    </>
  );
};

export default WorkTimerController;