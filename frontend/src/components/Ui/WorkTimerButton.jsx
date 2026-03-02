import { MdPlayArrow, MdStop, MdLogin, MdLogout, MdAccessAlarm } from "react-icons/md";

const formatTime = (s) => {
  const h = String(Math.floor(s / 3600)).padStart(2, "0");
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const sec = String(s % 60).padStart(2, "0");
  return `${h}:${m}:${sec}`;
};

const WorkTimerButton = ({ onCheckIn, onCheckOut, onStartStop, status, timerSeconds, checkedIn }) => {
  const isWorking = status?.is_working;
  const isOnBreak = status?.is_on_break;

  if (!checkedIn) {
    return (
      <button
        onClick={onCheckIn}
        className="flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition active:scale-95 shadow-md"
      >
        <MdLogin className="w-5 h-5" />
        Check In
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {/* Check Out Button */}
      <button
        onClick={onCheckOut}
        className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-100 transition active:scale-95 shadow-sm"
      >
        <MdLogout className="w-5 h-5 text-gray-500" />
        <span className="hidden sm:inline">Check Out</span>
      </button>

      {/* Start/Stop Timer Button */}
      <button
        onClick={onStartStop}
        className={`group flex items-center gap-3 px-5 py-2 rounded-xl text-sm font-medium transition-all duration-300 shadow-md active:scale-95 ${isOnBreak
          ? "bg-white text-black border-2 border-black hover:bg-gray-50"
          : isWorking
            ? "bg-black text-white hover:bg-gray-900"
            : "bg-black text-white hover:bg-gray-900 shadow-gray-100"
          }`}
      >
        <div className="relative">
          {isWorking ? (
            <div className="animate-pulse flex items-center justify-center">
              <MdStop className="w-5 h-5" />
            </div>
          ) : (
            <MdPlayArrow className="w-5 h-5" />
          )}
        </div>

        <div className="flex flex-col items-start leading-none">
          <span className="text-[10px] uppercase tracking-wider opacity-70 mb-0.5 text-inherit">
            {isOnBreak ? "On Break" : isWorking ? "Running" : "Work"}
          </span>
          <span className="font-mono text-sm font-bold text-inherit">
            {isWorking || isOnBreak ? formatTime(timerSeconds) : "Start"}
          </span>
        </div>

        {isWorking && (
          <div className="ml-1 hidden lg:block border-l border-white/20 pl-3">
            <div className="text-[9px] opacity-60 truncate max-w-[80px]">
              {status.current_work_session?.task_name || "Active Session"}
            </div>
          </div>
        )}
      </button>
    </div>
  );
};

export default WorkTimerButton;