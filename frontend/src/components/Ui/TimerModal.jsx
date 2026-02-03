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

  useEffect(() => {
    if (open) {
      apiClient.get("/hr/timer/projects_tasks/").then((res) => {
        setProjects(res.data);
      });
    }
  }, [open]);

  const projectOptions = projects.map((p) => ({ value: p.id, label: p.name }));
  const selectedProject = projects.find((p) => p.id === Number(project));
  const taskOptions = selectedProject?.tasks.map((t) => ({ value: t.id, label: t.name })) || [];

  const handleStartWork = () => {
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
              <button
                onClick={() => setShowWorkForm(false)}
                className="text-gray-500 hover:text-gray-700 text-sm font-medium mb-2"
              >
                ← Back
              </button>

              <h3 className="text-xl font-medium text-center">Start Work Timer</h3>
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 space-y-5">
                <Input
                  type="select"
                  label="Project (optional)"
                  placeholder="Choose project"
                  options={projectOptions}
                  value={project}
                  onChange={setProject}
                />
                <Input
                  type="select"
                  label="Task (optional)"
                  placeholder="Choose task"
                  options={taskOptions}
                  value={task}
                  onChange={setTask}
                  disabled={!project}
                />
                <div className="space-y-2">
                  <label className="block text-sm font-semibold">Memo (optional)</label>
                  <textarea
                    rows={3}
                    placeholder="What are you working on?"
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-black outline-none resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleStartWork}
                    className="flex-1 bg-black text-white text-sm font-medium py-3 rounded-xl hover:bg-gray-900 transition-all shadow-md"
                  >
                    Start Timer
                  </button>
                  <button
                    onClick={() => setShowWorkForm(false)}
                    className="px-6 border border-gray-300 text-gray-700 text-sm font-medium py-3 rounded-xl hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
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