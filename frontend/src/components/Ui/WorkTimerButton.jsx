import { MdPlayArrow, MdAccessTime, MdAccessTimeFilled, MdAccessAlarm } from "react-icons/md";

const formatTime = (s) => {
  const h = String(Math.floor(s / 3600)).padStart(2, "0");
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const sec = String(s % 60).padStart(2, "0");
  return `${h}:${m}:${sec}`;
};

const WorkTimerButton = ({ onOpenWorkTimer, status, timerSeconds, checkedIn, clockIn }) => {
  const isWorking = status?.is_working;
  const isOnBreak = status?.is_on_break;
  const activeType = status?.active_type;

  // Visual feedback for the daily goal (8 hours)
  const workGoalSeconds = 8 * 3600;
  const progress = Math.min(100, ((status?.workSeconds || 0) / workGoalSeconds) * 100);

  return (
    <button
      onClick={onOpenWorkTimer}
      className={`group relative flex items-center gap-4 px-5 py-2.5 rounded-2xl text-sm font-medium transition-all duration-300 shadow border border-white/10 active:scale-95 overflow-hidden ${isOnBreak
        ? activeType === "break"
          ? "bg-linear-to-br from-orange-500 to-orange-700 text-white"
          : "bg-linear-to-br from-indigo-500 to-indigo-700 text-white"
        : isWorking
          ? "bg-linear-to-br from-gray-900 to-black text-white"
          : checkedIn
            ? "bg-white text-black border-gray-200"
            : "bg-gray-100 text-gray-400 grayscale hover:grayscale-0"
        }`}
    >
      {/* Background Progress Indicator for Work Goal (only when checked in) */}
      {checkedIn && (
        <div
          className="absolute bottom-0 left-0 h-1 bg-white/20 transition-all duration-1000"
          style={{ width: `${progress}%` }}
        />
      )}

      <div className="relative z-10 flex items-center gap-3">
        {isOnBreak ? (
          <>
            <div className="bg-white/20 p-2 rounded-xl">
              {activeType === "break" ? <MdAccessTime className="w-6 h-6" /> : <MdAccessTimeFilled className="w-6 h-6" />}
            </div>
            <div className="text-left">
              <div className="text-[10px] uppercase tracking-wider opacity-70">On {activeType}</div>
              <div className="font-mono text-base font-medium leading-none">{formatTime(timerSeconds)}</div>
            </div>
          </>
        ) : isWorking ? (
          <>
            <div className="bg-white/10 p-2 rounded-xl animate-pulse">
              <MdAccessAlarm className="w-6 h-6" />
            </div>
            <div className="text-left max-w-[140px]">
              <div className="font-mono text-lg font-medium tracking-normal leading-none mb-1">
                {formatTime(timerSeconds)}
              </div>
              <div className="flex flex-col">
                <span className="truncate text-[9px] font-medium uppercase opacity-60 tracking-wider">
                  {status.current_work_session?.project_name || "General"}
                </span>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className={`${checkedIn ? 'bg-black text-white' : 'bg-gray-200 text-gray-500'} p-2 rounded-xl transition-colors`}>
              <MdPlayArrow className="w-6 h-6" />
            </div>
            <div className="text-left">
              <span className="text-sm font-medium uppercase tracking-wider text-gray-900">
                {checkedIn ? "Resume Timer" : "Check In"}
              </span>
              {checkedIn && (
                <div className="text-[9px] opacity-50 font-medium flex items-center gap-1.5">
                  {clockIn && <span>IN: {clockIn}</span>}
                  {status?.workSeconds > 0 && (
                    <>
                      <span className="w-1 h-1 bg-gray-400 rounded-full opacity-30" />
                      <span>{formatTime(status.workSeconds)} today</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Hover Effect */}
      <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </button>
  );
};

export default WorkTimerButton;