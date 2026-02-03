import { useEffect, useState } from "react";
import apiClient from "../../helpers/apiClient";
import Input from "../Input";
import LayoutComponents from "../LayoutComponents";

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
    onClose();
  };

  const handleCheckoutConfirm = () => {
    onCheckOut();
    onClose();
  };

  if (!open) return null;

  return (
    <LayoutComponents
      variant="modal"
      title="Work & Break Timers"
      onCloseModal={onClose}
      modal={
        <div className="space-y-6">
          {!showWorkForm && !showCheckoutConfirm && (
            <div
              className="space-y-4"
            >
              <button
                onClick={() => setShowWorkForm(true)}
                className="w-full bg-black text-white font-medium py-3 rounded-xl hover:bg-gray-900 transition-all duration-200 shadow-lg text-sm"
              >
                {status?.today_total_work && status.today_total_work !== "00:00:00"
                  ? "Resume Work Timer"
                  : "Start Work Timer"}
              </button>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={onBreak}
                  className="bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium py-3 px-6 rounded-xl shadow-md transition-all"
                >
                  Break Timer
                </button>
                <button
                  onClick={onSupport}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-3 px-6 rounded-xl shadow-md transition-all"
                >
                  Support Timer
                </button>
              </div>

              {checkedIn && (
                <button
                  onClick={() => setShowCheckoutConfirm(true)}
                  className="w-full border-2 border-gray-300 text-gray-800 text-sm font-medium py-3 px-6 rounded-xl hover:bg-gray-50 transition-all"
                >
                  Check Out
                </button>
              )}
            </div>
          )}
          {showWorkForm && (
            <div
              className="space-y-5"
            >
              <div className="space-y-4">
                <button
                  onClick={() => setShowWorkForm(false)}
                  className="text-gray-500 hover:text-black text-sm font-bold flex items-center gap-2 transition"
                >
                  ← Back to Dashboard
                </button>

                <h3 className="text-2xl font-bold text-center text-gray-900">Start Work Timer</h3>
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-6">
                  <div className="space-y-4">
                    <Input
                      type="select"
                      label="Select Project"
                      required
                      placeholder="Choose a project to work on"
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
                      placeholder={!project ? "Select a project first" : "Choose a task"}
                      options={taskOptions}
                      value={task}
                      onChange={setTask}
                      disabled={!project || taskOptions.length === 0}
                    />
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700">Work Memo</label>
                      <textarea
                        rows={3}
                        placeholder="What exactly are you working on right now?"
                        value={memo}
                        onChange={(e) => setMemo(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-100 rounded-xl focus:ring-2 focus:ring-black outline-none resize-none bg-gray-50 text-sm font-medium transition placeholder:text-gray-400"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-lg border border-red-100 flex items-center gap-2 animate-pulse">
                      ⚠️ {error}
                    </div>
                  )}

                  <div className="flex gap-4 pt-2">
                    <button
                      onClick={handleStartWork}
                      className="flex-3 bg-black text-white text-sm font-bold py-4 rounded-xl hover:bg-gray-800 transition-all shadow-lg active:scale-95"
                    >
                      Start Working Now
                    </button>
                    <button
                      onClick={() => setShowWorkForm(false)}
                      className="flex-1 border-2 border-gray-200 text-gray-600 text-sm font-bold py-4 rounded-xl hover:bg-gray-50 transition active:scale-95"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {showCheckoutConfirm && (
            <div
              className="text-center space-y-6 py-6"
            >
              <div className="text-2xl font-medium">Finish your work & check out?</div>
              <p className="text-gray-600 text-lg">Make sure you've stopped all active timers</p>

              <div className="flex gap-4 justify-center pt-4">
                <button
                  onClick={handleCheckoutConfirm}
                  className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl shadow-lg transition-all text-sm"
                >
                  Yes, Check Out
                </button>
                <button
                  onClick={() => setShowCheckoutConfirm(false)}
                  className="px-8 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-all text-lg"
                >
                  Cancel
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