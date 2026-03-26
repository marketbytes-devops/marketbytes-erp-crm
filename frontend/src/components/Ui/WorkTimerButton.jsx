import { MdPlayArrow, MdStop, MdLogin, MdLogout, MdLock } from "react-icons/md";

const formatTime = (s) => {
 const h = String(Math.floor(s / 3600)).padStart(2, "0");
 const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
 const sec = String(s % 60).padStart(2, "0");
 return `${h}:${m}:${sec}`;
};

const WorkTimerButton = ({ onCheckIn, onCheckOut, onStartStop, status, timerSeconds, checkedIn }) => {
 const isWorking = status?.is_working;
 const isOnBreak = status?.is_on_break;

 // Check Out is no longer disabled while a work session is active (it will stop the task automatically)
 const checkOutDisabled = false;

 if (!checkedIn) {
 return (
                 <button
                    onClick={onCheckIn}
                    className="px-4 py-3 text-sm rounded-xl transition-colors flex items-center gap-2 bg-black text-white font-medium hover:bg-gray-100 hover:text-black shadow-md"
                >
                    <MdLogin className="w-5 h-5" />
                    Check In
                </button>

 );
 }

 return (
 <div className="flex items-center gap-3">
 {/* ── Check Out Button — disabled while a task is running ── */}
 <div className="relative group">
                 <button
                    onClick={checkOutDisabled ? undefined : onCheckOut}
                    disabled={checkOutDisabled}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all shadow-sm select-none
                    ${checkOutDisabled
                        ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                        : "bg-black text-white hover:bg-gray-100 hover:text-black cursor-pointer"
                    }`}
                >
                    {checkOutDisabled ? (
                        <MdLock className="w-4 h-4 text-gray-400" />
                    ) : (
                        <MdLogout className="w-5 h-5" />
                    )}
                    <span className="hidden sm:inline">Check Out</span>
                </button>

 {/* Tooltip shown when disabled */}
 {checkOutDisabled && (
 <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[180px] bg-gray-800 text-white text-xs font-medium rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-center leading-tight z-50">
 Stop your current task before checking out
 <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
 </div>
 )}
 </div>

 {/* ── Productive Hours & Clock In Stats ── */}
 <div className="hidden xl:flex flex-col items-end gap-0.5 px-3 border-r border-gray-100 mr-1">
 <div className="flex items-center gap-1.5 leading-none">
 <span className="text-[10px] text-gray-400 uppercase tracking-tight font-medium">Productive:</span>
 <span className="text-xs font-mono font-bold text-gray-700">{formatTime(status?.workSeconds || 0)}</span>
 </div>
 <div className="flex items-center gap-1.5 leading-none">
 <span className="text-[10px] text-gray-400 uppercase tracking-tight font-medium">Clock In:</span>
 <span className="text-xs font-mono font-bold text-gray-600">{status?.clock_in || "--:--"}</span>
 </div>
 </div>

 {/* ── Start / Stop Work Timer Button ── */}
             <button
                onClick={onStartStop}
                className={`group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 shadow-md ${isOnBreak
                        ? "bg-amber-50 text-amber-800 border-2 border-amber-300 hover:bg-amber-100"
                        : isWorking
                            ? "bg-black text-white hover:bg-gray-100 hover:text-black"
                            : "bg-black text-white hover:bg-gray-100 hover:text-black shadow-gray-100"
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
 {/* Label row */}
 <span className="text-[10px] uppercase tracking-wider opacity-70 mb-0.5 text-inherit">
 {isOnBreak ? "On Break" : isWorking ? "Working" : "Work"}
 </span>
 {/* Timer or "Start" */}
 <span className="font-mono text-sm font-bold text-inherit">
 {isWorking || isOnBreak ? formatTime(timerSeconds) : "Start"}
 </span>
 </div>

 {/* Secondary info pill */}
 {isWorking && (
 <div className="ml-1 hidden lg:flex flex-col items-start border-l border-white/20 pl-3 gap-0.5">
 <div className="text-[9px] opacity-60 truncate max-w-[80px]">
 {status?.current_work_session?.task_name || "Active Session"}
 </div>
 <div className="text-[9px] opacity-50">
 Productive
 </div>
 </div>
 )}

 {isOnBreak && (
 <div className="ml-1 hidden lg:flex flex-col items-start border-l border-amber-400/30 pl-3 gap-0.5">
 <div className="text-[9px] opacity-70 truncate max-w-[80px]">
 {status?.active_type === "support" ? "Support" : "Break"}
 </div>
 <div className="text-[9px] opacity-50">
 Not Productive
 </div>
 </div>
 )}
 </button>
 </div>
 );
};

export default WorkTimerButton;