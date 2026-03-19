import { useEffect, useCallback, useRef } from "react";
import toast from "react-hot-toast";
import apiClient from "../../helpers/apiClient";

/**
 * InactivityHandler tracks user activity and automatically pauses the timer 
 * after 15 minutes of inactivity.
 */
const InactivityHandler = ({ isAuthenticated }) => {
  const IDLE_TIMEOUT = 15 * 60 * 1000; // 15 minutes
  const timeoutRef = useRef(null);

  const handleIdle = useCallback(async () => {
    try {
      // We only want to attempt a pause if the user is actually working.
      // The backend action 'inactivity-pause' handles the logic of checking 
      // if there's an active work session.
      const res = await apiClient.post("/hr/timer/inactivity-pause/");
      
      if (res.status === 200 && res.data.message === "Inactivity pause successful") {
        toast("Timer paused due to 15 minutes of inactivity", { 
          icon: '⏲️',
          duration: 6000,
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
          },
        });
        
        // Dispatch a custom event to notify other components (like WorkTimerController) 
        // that the timer status has changed.
        window.dispatchEvent(new CustomEvent('timer-status-updated'));
      }
    } catch (err) {
      console.error("Inactivity pause failed:", err);
    }
  }, []);

  const resetTimer = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(handleIdle, IDLE_TIMEOUT);
  }, [handleIdle, IDLE_TIMEOUT]);

  useEffect(() => {
    if (!isAuthenticated) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      return;
    }

    const events = [
      'mousedown', 
      'mousemove', 
      'keypress', 
      'scroll', 
      'touchstart',
      'click'
    ];

    const handleEvent = () => resetTimer();

    events.forEach(event => window.addEventListener(event, handleEvent));

    // Initialize the timer
    resetTimer();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      events.forEach(event => window.removeEventListener(event, handleEvent));
    };
  }, [isAuthenticated, resetTimer]);

  return null;
};

export default InactivityHandler;
