import { motion } from "framer-motion";
import { MdPlayArrow, MdAccessTime, MdAccessTimeFilled, MdAccessAlarm } from "react-icons/md";

const formatTime = (s) => {
  const h = String(Math.floor(s / 3600)).padStart(2, "0");
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const sec = String(s % 60).padStart(2, "0");
  return `${h}:${m}:${sec}`;
};

const WorkTimerButton = ({ onOpenWorkTimer, status, timerSeconds, checkedIn }) => {
  const isWorking = status?.is_working;
  const isOnBreak = status?.is_on_break;
  const breakType = status?.current_break_session?.type;

  const breakElapsed = isOnBreak && status.current_break_session?.start_time
    ? Math.floor((new Date() - new Date(status.current_break_session.start_time)) / 1000)
    : 0;

  const todayTotalSeconds = status?.today_total_work
    ? (() => {
        const [h, m, s] = status.today_total_work.split(":").map(Number);
        return h * 3600 + m * 60 + s;
      })()
    : 0;

  const currentWorkSeconds = isWorking && status.current_work_session?.start_time
    ? Math.floor((new Date() - new Date(status.current_work_session.start_time)) / 1000)
    : 0;

  const displayWorkTime = todayTotalSeconds + currentWorkSeconds;

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.96 }}
      onClick={onOpenWorkTimer}
      className={`flex items-center gap-4 px-6 py-3 rounded-full text-sm font-medium transition-all shadow-inner border border-white/20 ${
        isOnBreak
          ? breakType === "break"
            ? "bg-orange-600 hover:bg-orange-700 text-white"
            : "bg-indigo-600 hover:bg-indigo-700 text-white"
          : isWorking
          ? "bg-green-600 hover:bg-green-700 text-white"
          : checkedIn
          ? "bg-black hover:bg-gray-900 text-white"
          : "bg-gray-400 text-black hover:bg-black hover:text-white"
      }`}
    >
      {isOnBreak ? (
        <>
          {breakType === "break" ? <MdAccessTime className="w-9 h-9" /> : <MdAccessTimeFilled className="w-9 h-9" />}
          <div className="text-left">
            <div className="text-xs opacity-90">On {breakType === "break" ? "Break" : "Support"}</div>
            <div className="font-mono text-lg font-medium">{formatTime(breakElapsed)}</div>
          </div>
        </>
      ) : isWorking ? (
        <>
          <MdAccessAlarm className="w-9 h-9" />
          <div className="text-left">
            <div className="font-mono text-sm font-medium tracking-wider">
              {formatTime(displayWorkTime)}
            </div>
            <div className="text-xs opacity-90">Click to Stop Work</div>
          </div>
        </>
      ) : (
        <>
          <MdPlayArrow className="w-9 h-9" />
          <span className="relative -left-3 text-sm font-medium">
            {checkedIn ? "Resume Timer" : "Check In"}
          </span>
        </>
      )}
    </motion.button>
  );
};

export default WorkTimerButton;