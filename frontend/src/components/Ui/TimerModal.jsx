import { useEffect, useState } from "react";
import { MdStop, MdPlayArrow, MdTimer, MdFreeBreakfast, MdSupportAgent } from "react-icons/md";
import apiClient from "../../helpers/apiClient";
import Input from "../Input";
import LayoutComponents from "../LayoutComponents";

const formatTime = (s) => {
  const h = String(Math.floor(s / 3600)).padStart(2, "0");
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const sec = String(s % 60).padStart(2, "0");
  return `${h}:${m}:${sec}`;
};

const StatCard = ({ label, value, active, icon: Icon, colorClass }) => (
  <div className={`p-4 rounded-xl border transition-all ${active ? `bg-white ${colorClass} ring-2 ring-offset-1` : "bg-white border-gray-100"}`}>
    <div className="flex items-center gap-2 mb-1">
      {Icon && <Icon className={`w-3.5 h-3.5 ${active ? "text-current" : "text-gray-400"}`} />}
      <p className="text-gray-500 text-[10px] font-medium uppercase tracking-tight">{label}</p>
    </div>
    <p className={`text-lg font-mono font-semibold ${active ? "text-gray-900" : "text-gray-600"}`}>{value}</p>
  </div>
);

const TimerModal = ({ open, onClose, onStartWork, onStopWork, onBreak, onSupport, onCheckOut, checkedIn, status }) => {
  const [projects, setProjects] = useState([]);
  const [showWorkForm, setShowWorkForm] = useState(false);
  const [showCheckoutConfirm, setShowCheckoutConfirm] = useState(false);

  const [project, setProject] = useState("");
  const [task, setTask] = useState("");
  const [memo, setMemo] = useState("");
  const [error, setError] = useState("");

  const isWorking = !!status?.is_working;
  const isOnBreak = !!status?.is_on_break;

  useEffect(() => {
    if (open) {
      apiClient
        .get("/hr/timer/projects_tasks/")
        .then((res) => { setProjects(res.data); })
        .catch((err) => console.error("Error fetching timer projects:", err));

      if (!isWorking && !showCheckoutConfirm) {
        setShowWorkForm(true);
      }
    }
  }, [open, isWorking]);

  const projectOptions = projects.map((p) => ({ value: p.id, label: p.name }));
  const selectedProject = projects.find((p) => String(p.id) === String(project));
  const taskOptions = selectedProject?.tasks.map((t) => ({ value: t.id, label: t.name })) || [];

  const handleStartWork = () => {
    if (!project) { setError("Please select a project"); return; }
    if (!task && taskOptions.length > 0) { setError("Please select a task"); return; }
    setError("");
    onStartWork({ project: project || null, task: task || null, memo: memo.trim() });
    setShowWorkForm(false);
  };

  const handleCheckoutConfirm = () => {
    onCheckOut();
    onClose();
  };

  if (!open) return null;

  const workGoalSeconds = 8 * 3600;
  const progress = Math.min(100, ((status?.workSeconds || 0) / workGoalSeconds) * 100);

  // ── Determine active section color
  const activeBreak = status?.active_type === "break";
  const activeSupport = status?.active_type === "support";

  return (
    <LayoutComponents
      variant="modal"
      title={isWorking ? "Stop Timer" : "Daily Timer Dashboard"}
      onCloseModal={onClose}
      modal={
        <div className="space-y-6 min-w-[320px]">

          {/* ───────────── WORKING STATE ───────────── */}
          {isWorking && (
            <div className="space-y-6 py-2">
              {/* Current task info */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest mb-1">Currently Working On</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {status.current_work_session?.task_name || "General Work"}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {status.current_work_session?.project_name || "No Project"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 rounded-full border border-green-100">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider">Productive</span>
                  </div>
                </div>
                {status.current_work_session?.memo && (
                  <p className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-200">
                    <span className="font-medium text-gray-700">Memo: </span>
                    {status.current_work_session.memo}
                  </p>
                )}
              </div>

              {/* Productive timer display */}
              <div className="text-center py-4 border-b border-gray-100">
                <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Session Productive Time</p>
                <p className="text-5xl font-mono font-semibold text-gray-900 tracking-wider tabular-nums">
                  {formatTime(status?.sessionSeconds || 0)}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Total today: <span className="font-medium text-gray-600">{formatTime(status?.workSeconds || 0)}</span>
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  onClick={onStopWork}
                  className="w-full bg-black hover:bg-gray-900 text-white font-bold py-4 rounded-xl shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95 text-base"
                >
                  <MdStop className="w-5 h-5" /> Stop Task Timer
                </button>

                <button
                  onClick={() => setShowCheckoutConfirm(true)}
                  className="w-full border-2 border-gray-200 text-gray-500 text-xs font-medium py-3 px-6 rounded-xl hover:bg-gray-50 transition-all uppercase tracking-widest mt-1"
                >
                  Daily Check Out
                </button>
              </div>
            </div>
          )}

          {/* ───────────── IDLE / BREAK STATE (not working, not in work-form, not checkout) ───────────── */}
          {!isWorking && !showWorkForm && !showCheckoutConfirm && (
            <div className="space-y-5">

              {/* Daily Progress */}
              <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 shadow-inner">
                <div className="flex justify-between items-end mb-3">
                  <div>
                    <p className="text-gray-400 text-[10px] font-medium uppercase tracking-wider mb-1">Productive Hours Today</p>
                    <p className="text-3xl font-mono font-semibold text-black">{formatTime(status?.workSeconds || 0)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{Math.round(progress)}%</p>
                    <p className="text-xs text-gray-400">of 8h target</p>
                  </div>
                </div>
                <div className="h-2.5 w-full bg-gray-200 rounded-full overflow-hidden shadow-inner">
                  <div
                    className="h-full bg-black transition-all duration-1000 ease-out rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Break / Support status cards */}
              <div className="grid grid-cols-2 gap-3">
                <StatCard
                  label={activeBreak ? "Break (Running)" : "Break Total"}
                  value={formatTime(activeBreak ? (status?.sessionSeconds || 0) : (status?.breakSeconds || 0))}
                  active={activeBreak}
                  icon={MdFreeBreakfast}
                  colorClass="border-amber-300 text-amber-700 ring-amber-200"
                />
                <StatCard
                  label={activeSupport ? "Support (Running)" : "Support Total"}
                  value={formatTime(activeSupport ? (status?.sessionSeconds || 0) : (status?.supportSeconds || 0))}
                  active={activeSupport}
                  icon={MdSupportAgent}
                  colorClass="border-blue-300 text-blue-700 ring-blue-200"
                />
              </div>
              {/* Sub-totals when active */}
              {activeBreak && (
                <p className="text-center text-[10px] text-amber-700 -mt-2">Total break today: {formatTime(status?.breakSeconds || 0)}</p>
              )}
              {activeSupport && (
                <p className="text-center text-[10px] text-blue-700 -mt-2">Total support today: {formatTime(status?.supportSeconds || 0)}</p>
              )}

              {/* Actions */}
              <div className="space-y-3 pt-1">
                {/* Start/Resume work */}
                <button
                  onClick={() => setShowWorkForm(true)}
                  className="w-full bg-black text-white font-medium py-4 rounded-xl hover:bg-gray-900 transition-all duration-200 shadow-lg active:scale-95 flex items-center justify-center gap-2"
                >
                  <MdPlayArrow className="w-5 h-5" />
                  {status?.workSeconds > 0 ? "Resume / Start New Task" : "Start Work Timer"}
                </button>

                {/* Break / Support toggles */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={onBreak}
                    className={`font-medium py-3.5 px-4 rounded-xl shadow-md transition-all active:scale-95 text-sm flex items-center justify-center gap-1.5 ${activeBreak
                      ? "bg-amber-500 text-white border-amber-500"
                      : "bg-white text-gray-700 border-2 border-gray-200 hover:bg-gray-50"
                      }`}
                  >
                    <MdFreeBreakfast className="w-4 h-4" />
                    {activeBreak ? "Stop Break" : "Break Timer"}
                  </button>
                  <button
                    onClick={onSupport}
                    className={`font-medium py-3.5 px-4 rounded-xl shadow-md transition-all active:scale-95 text-sm flex items-center justify-center gap-1.5 ${activeSupport
                      ? "bg-blue-500 text-white border-blue-500"
                      : "bg-white text-gray-700 border-2 border-gray-200 hover:bg-gray-50"
                      }`}
                  >
                    <MdSupportAgent className="w-4 h-4" />
                    {activeSupport ? "Stop Support" : "Support Timer"}
                  </button>
                </div>

                {/* Check Out — only when genuinely idle (not working, not on active break/support mid-task) */}
                {checkedIn && (
                  <button
                    onClick={() => setShowCheckoutConfirm(true)}
                    className="w-full border-2 border-gray-200 text-gray-500 text-xs font-medium py-3 px-6 rounded-xl hover:bg-gray-50 transition-all mt-2 uppercase tracking-widest"
                  >
                    Daily Check Out
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ───────────── START WORK FORM ───────────── */}
          {!isWorking && showWorkForm && (
            <div className="space-y-5">
              <div className="space-y-4">
                <button
                  onClick={() => setShowWorkForm(false)}
                  className="text-gray-400 hover:text-black text-xs font-medium flex items-center gap-2 transition uppercase tracking-wider"
                >
                  ← Back to Dashboard
                </button>

                <h3 className="text-xl font-medium text-gray-900">Configure Work Session</h3>
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-5">
                  <div className="bg-green-50 border border-green-100 rounded-lg px-4 py-2.5 text-xs text-green-700 font-medium flex items-center gap-2">
                    <MdTimer className="w-4 h-4" />
                    Productive hours will start tracking when you begin
                  </div>

                  <div className="space-y-4">
                    <Input
                      type="select"
                      label="Select Project"
                      required
                      placeholder="Choose a project"
                      options={projectOptions}
                      value={project}
                      onChange={(val) => { setProject(val); setTask(""); }}
                    />
                    <Input
                      type="select"
                      label="Select Task"
                      required
                      placeholder={!project ? "Select project first" : "Choose a task"}
                      options={taskOptions}
                      value={task}
                      onChange={setTask}
                      disabled={!project || taskOptions.length === 0}
                    />
                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Memo / Note</label>
                      <textarea
                        rows={2}
                        placeholder="What's the focus of this session?"
                        value={memo}
                        onChange={(e) => setMemo(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none resize-none bg-gray-50 text-sm font-medium transition placeholder:text-gray-300"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 text-red-600 text-xs font-medium rounded-lg border border-red-100">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-4 pt-1">
                    <button
                      onClick={handleStartWork}
                      className="flex-1 bg-black text-white text-sm font-medium py-4 rounded-xl hover:bg-gray-800 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                    >
                      <MdPlayArrow className="w-5 h-5" />
                      Start Working
                    </button>
                    <button
                      onClick={() => setShowWorkForm(false)}
                      className="flex-none px-5 border-2 border-gray-100 text-gray-400 text-sm font-medium py-4 rounded-xl hover:bg-gray-50 transition active:scale-95"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ───────────── CHECKOUT CONFIRM ───────────── */}
          {showCheckoutConfirm && (
            <div className="text-center space-y-6 py-4 px-4">
              <div className="w-20 h-20 bg-gray-100 text-gray-900 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-medium text-gray-900 mb-2">Ready to finish?</h3>
                <p className="text-gray-500 text-sm">This will end your workday and close all open sessions.</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-left space-y-1">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2">Today's Summary</p>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Productive Hours</span>
                  <span className="font-semibold text-gray-900">{formatTime(status?.workSeconds || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Break Time</span>
                  <span className="font-medium text-amber-700">{formatTime(status?.breakSeconds || 0)}</span>
                </div>
                {(status?.supportSeconds || 0) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Support Time</span>
                    <span className="font-medium text-blue-700">{formatTime(status?.supportSeconds || 0)}</span>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-3 pt-2">
                <button
                  onClick={handleCheckoutConfirm}
                  className="w-full py-4 bg-black hover:bg-gray-900 text-white font-medium rounded-xl shadow-xl transition-all active:scale-95"
                >
                  End Workday &amp; Check Out
                </button>
                <button
                  onClick={() => setShowCheckoutConfirm(false)}
                  className="w-full py-4 border-2 border-gray-200 text-gray-400 font-medium rounded-xl hover:bg-gray-50 transition-all"
                >
                  Stay &amp; Continue
                </button>
              </div>
            </div>
          )}
        </div>
      }
    />
  );
};

export default TimerModal;