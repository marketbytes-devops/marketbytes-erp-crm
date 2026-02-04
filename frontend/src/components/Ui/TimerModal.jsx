import { useEffect, useState } from "react";
import apiClient from "../../helpers/apiClient";
import Input from "../Input";
import LayoutComponents from "../LayoutComponents";

const formatTime = (s) => {
  const h = String(Math.floor(s / 3600)).padStart(2, "0");
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const sec = String(s % 60).padStart(2, "0");
  return `${h}:${m}:${sec}`;
};

const TimerModal = ({ open, onClose, onStartWork, onBreak, onSupport, onCheckOut, checkedIn, status }) => {
  const [projects, setProjects] = useState([]);
  const [showWorkForm, setShowWorkForm] = useState(false);
  const [showCheckoutConfirm, setShowCheckoutConfirm] = useState(false);

  const [project, setProject] = useState("");
  const [task, setTask] = useState("");
  const [memo, setMemo] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      apiClient
        .get("/hr/timer/projects_tasks/")
        .then((res) => {
          setProjects(res.data);
        })
        .catch((err) => console.error("Error fetching timer projects:", err));
    }
  }, [open]);

  const projectOptions = projects.map((p) => ({ value: p.id, label: p.name }));
  const selectedProject = projects.find((p) => String(p.id) === String(project));
  const taskOptions =
    selectedProject?.tasks.map((t) => ({
      value: t.id,
      label: t.name,
    })) || [];

  const handleStartWork = () => {
    if (!project) {
      setError("Please select a project");
      return;
    }
    if (!task && taskOptions.length > 0) {
      setError("Please select a task");
      return;
    }
    setError("");

    onStartWork({
      project: project || null,
      task: task || null,
      memo: memo.trim(),
    });
  };

  const handleCheckoutConfirm = () => {
    onCheckOut();
    onClose();
  };

  if (!open) return null;

  const workGoalSeconds = 8 * 3600;
  const progress = Math.min(100, ((status?.workSeconds || 0) / workGoalSeconds) * 100);

  return (
    <LayoutComponents
      variant="modal"
      title="Daily Timer Dashboard"
      onCloseModal={onClose}
      modal={
        <div className="space-y-6 min-w-[320px]">
          {!showWorkForm && !showCheckoutConfirm && (
            <div className="space-y-6">
              {/* Daily Progress Section */}
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 shadow-inner">
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <h4 className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-1">Productive Goal</h4>
                    <p className="text-3xl font-mono font-medium text-black">{formatTime(status?.workSeconds || 0)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{Math.round(progress)}%</p>
                    <p className="text-xs text-gray-400">of 8h target</p>
                  </div>
                </div>
                <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden shadow-inner">
                  <div
                    className="h-full bg-black transition-all duration-1000 ease-out rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-4 rounded-xl border transition-all ${status?.active_type === "break" ? "bg-orange-100 border-orange-300 ring-2 ring-orange-200" : "bg-orange-50 border-orange-100"}`}>
                  <p className="text-orange-600 text-[10px] font-medium uppercase tracking-tight mb-1">
                    {status?.active_type === "break" ? "Current Break" : "Total Break"}
                  </p>
                  <p className="text-lg font-mono font-medium text-orange-700">
                    {formatTime(status?.active_type === "break" ? (status?.sessionSeconds || 0) : (status?.breakSeconds || 0))}
                  </p>
                  {status?.active_type === "break" && (
                    <p className="text-[10px] text-orange-500 mt-1">Total today: {formatTime(status?.breakSeconds || 0)}</p>
                  )}
                </div>
                <div className={`p-4 rounded-xl border transition-all ${status?.active_type === "support" ? "bg-indigo-100 border-indigo-300 ring-2 ring-indigo-200" : "bg-indigo-50 border-indigo-100"}`}>
                  <p className="text-indigo-600 text-[10px] font-medium uppercase tracking-tight mb-1">
                    {status?.active_type === "support" ? "Current Support" : "Total Support"}
                  </p>
                  <p className="text-lg font-mono font-medium text-indigo-700">
                    {formatTime(status?.active_type === "support" ? (status?.sessionSeconds || 0) : (status?.supportSeconds || 0))}
                  </p>
                  {status?.active_type === "support" && (
                    <p className="text-[10px] text-indigo-500 mt-1">Total today: {formatTime(status?.supportSeconds || 0)}</p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <button
                  onClick={() => setShowWorkForm(true)}
                  className="w-full bg-black text-white font-medium py-4 rounded-xl hover:bg-gray-900 transition-all duration-200 shadow-xl active:scale-95 flex items-center justify-center gap-2"
                >
                  {status?.is_working ? "Update Current Task" : (status?.workSeconds > 0 ? "Resume Work Timer" : "Start Work Timer")}
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={onBreak}
                    className={`font-medium py-3.5 px-4 rounded-xl shadow-md transition-all active:scale-95 text-sm ${status?.active_type === "break"
                      ? "bg-orange-600 text-white"
                      : "bg-white text-orange-600 border-2 border-orange-600 hover:bg-orange-50"
                      }`}
                  >
                    {status?.active_type === "break" ? "Running Break" : "Break Timer"}
                  </button>
                  <button
                    onClick={onSupport}
                    className={`font-medium py-3.5 px-4 rounded-xl shadow-md transition-all active:scale-95 text-sm ${status?.active_type === "support"
                      ? "bg-indigo-600 text-white"
                      : "bg-white text-indigo-600 border-2 border-indigo-600 hover:bg-indigo-50"
                      }`}
                  >
                    {status?.active_type === "support" ? "Running Support" : "Support Timer"}
                  </button>
                </div>

                {checkedIn && (
                  <button
                    onClick={() => setShowCheckoutConfirm(true)}
                    className="w-full border-2 border-gray-200 text-gray-500 text-xs font-medium py-3 px-6 rounded-xl hover:bg-gray-50 transition-all mt-4 uppercase tracking-widest"
                  >
                    Daily Check Out
                  </button>
                )}
              </div>
            </div>
          )}

          {showWorkForm && (
            <div className="space-y-5">
              <div className="space-y-4">
                <button
                  onClick={() => setShowWorkForm(false)}
                  className="text-gray-400 hover:text-black text-xs font-medium flex items-center gap-2 transition uppercase tracking-wider"
                >
                  ← Back to Dashboard
                </button>

                <h3 className="text-xl font-medium text-gray-900">Configure Work Session</h3>
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-6">
                  <div className="space-y-4">
                    <Input
                      type="select"
                      label="Select Project"
                      required
                      placeholder="Choose a project"
                      options={projectOptions}
                      value={project}
                      onChange={(val) => {
                        setProject(val);
                        setTask("");
                      }}
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
                    <div className="p-3 bg-red-50 text-red-600 text-[10px] font-medium rounded-lg border border-red-100 flex items-center gap-2">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-4 pt-2">
                    <button
                      onClick={handleStartWork}
                      className="flex-3 bg-black text-white text-sm font-medium py-4 rounded-xl hover:bg-gray-800 transition-all shadow-lg active:scale-95"
                    >
                      {status?.is_working ? "Update & Resume" : "Start Working"}
                    </button>
                    <button
                      onClick={() => setShowWorkForm(false)}
                      className="flex-1 border-2 border-gray-100 text-gray-400 text-sm font-medium py-4 rounded-xl hover:bg-gray-50 transition active:scale-95"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {showCheckoutConfirm && (
            <div className="text-center space-y-6 py-6 px-4">
              <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-medium text-gray-900 mb-2">Ready to finish?</h3>
                <p className="text-gray-500 text-sm">Logging out will stop all active timers and conclude your workday.</p>
              </div>

              <div className="flex flex-col gap-3 pt-4">
                <button
                  onClick={handleCheckoutConfirm}
                  className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl shadow-xl transition-all active:scale-95"
                >
                  End Workday & Check Out
                </button>
                <button
                  onClick={() => setShowCheckoutConfirm(false)}
                  className="w-full py-4 border-2 border-gray-200 text-gray-400 font-medium rounded-xl hover:bg-gray-50 transition-all"
                >
                  Stay & Continue
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