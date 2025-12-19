import React, { useState, useEffect } from "react";
import LayoutComponents from "../../../components/LayoutComponents";
import { useNavigate, useLocation } from "react-router";
import apiClient from "../../../helpers/apiClient";
import Loading from "../../../components/Loading";
import toast from "react-hot-toast";
import Input from "../../../components/Input"; // Adjust path if needed

const TasksPage = () => {
  const [showEntries, setShowEntries] = useState(50);
  const [search, setSearch] = useState("");
  const [isPinnedModalOpen, setIsPinnedModalOpen] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = () => {
    navigate("/operations/tasks/tasklabel");
  };

  const handleNewtaskClick = () => {
    navigate("/operations/tasks/newtask");
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/operation/tasks/");
      const tasksData = response.data?.results || response.data || [];
      setTasks(tasksData);
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
      toast.error("Failed to load tasks");
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [location.state?.refetch]);

  const handleStatusChange = async (taskId, newStatusValue) => {
    try {
   
      const statusMap = {
        "To Do": "todo",
        "In progress": "in_progress",
        "Review":"review",
        "Done": "done",
      };

      const backendStatus = statusMap[newStatusValue];

      await apiClient.patch(`/operation/tasks/${taskId}/`, {
        status: backendStatus,
      });

      toast.success("Status updated successfully");
      fetchTasks(); // Refetch to reflect changes immediately
    } catch (err) {
      console.error("Failed to update status:", err);
      toast.error("Failed to update status");
    }
  };

  const statusOptions = [
    { value: "To Do", label: "To Do" },
    { value: "In progress", label: "In progress" },
    { value: "Done", label: "Done" },
    { value: "Review", label: "Review" },
  ];

  const getCurrentStatusLabel = (status) => {
    const map = {
      todo: "To Do",
      in_progress: "In progress",
      done: "Done",
      review:"Review",
    };
    return map[status] || "To Do";
  };

  const renderAvatars = (assignees = []) => {
    const assigneeCount = assignees.length;

    if (assigneeCount === 0) {
      return <div className="w-8 h-8 rounded-full bg-gray-300 border-2 border-white" />;
    }

    return (
      <div className="flex -space-x-2">
        {assignees.slice(0, 3).map((assignee, i) => {
          const name = assignee.name || assignee.username || "Unknown";
          const initial = name[0]?.toUpperCase() || "?";

          return (
            <div key={assignee.id || i} className="relative group">
              <div className="w-8 h-8 rounded-full bg-gray-400 border-2 border-white flex items-center justify-center text-white text-xs font-bold cursor-pointer">
                {initial}
              </div>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-black text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                {name}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-black"></div>
              </div>
            </div>
          );
        })}
        {assigneeCount > 3 && (
          <div className="w-8 h-8 rounded-full bg-gray-500 border-2 border-white flex items-center justify-center text-white text-xs font-bold">
            +{assigneeCount - 3}
          </div>
        )}
      </div>
    );
  };

  const filteredTasks = tasks.filter((task) => {
    const searchLower = search.toLowerCase();
    return (
      task.name?.toLowerCase().includes(searchLower) ||
      task.project_name?.toLowerCase().includes(searchLower)
    );
  });

  const pinnedModalContent = (
    <div className="p-6">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase">#</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase">Task</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={3} className="text-center py-12 text-gray-500">
                No pinned item found
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loading />
      </div>
    );
  }

  return (
    <div className="p-6">
      <LayoutComponents title="Tasks" variant="card">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Top Buttons Bar */}
          <div className="px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsPinnedModalOpen(true)}
                className="border border-black text-black px-4 py-2 rounded-lg hover:bg-blue-50 flex items-center gap-2"
              >
                Pinned Task
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <button onClick={handleClick} className="border border-black text-black px-4 py-2 rounded-lg hover:bg-purple-50">
                Task Labels
              </button>
              <button onClick={handleNewtaskClick} className="bg-black text-white px-4 py-2 rounded-lg flex items-center gap-2">
                <span className="text-lg">+</span> New Task
              </button>
            </div>
            <button className="bg-black text-white px-4 py-2 rounded-lg flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          <div className="px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50">
            <div className="flex items-center gap-3 text-gray-700">
              <span>Show</span>
              <select
                value={showEntries}
                onChange={(e) => setShowEntries(Number(e.target.value))}
                className="border border-gray-300 rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option>10</option>
                <option>25</option>
                <option>50</option>
                <option>100</option>
              </select>
              <span>entries</span>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="text-gray-700">Search:</span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder=""
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 text-gray-600 text-xs uppercase">
                <tr>
                  <th className="px-6 py-4 text-left">#</th>
                  <th className="px-6 py-4 text-left">Task</th>
                  <th className="px-6 py-4 text-left">Project</th>
                  <th className="px-6 py-4 text-left">Assigned To</th>
                  <th className="px-6 py-4 text-left">Due Date</th>
                  <th className="px-6 py-4 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-500">
                      No tasks found
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((task, index) => (
                    <tr key={task.id} className="hover:bg-gray-50">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{index + 1}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 font-medium text-gray-900">
                        {task.name}
                      </td>
                      <td className="px-6 py-5 text-gray-700">
                        {task.project_name || "-"}
                      </td>
                      <td className="px-6 py-5">
                        {renderAvatars(task.assignees || [])}
                      </td>
                      <td className="px-6 py-5 text-gray-700">
                        {task.due_date
                          ? new Date(task.due_date).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            }).replace(/\//g, "-")
                          : "-"}
                      </td>
                      <td className="px-6 py-5">
                        <div className="w-48">
                          <Input
                            type="select"
                            options={statusOptions}
                            value={getCurrentStatusLabel(task.status)}
                            onChange={(newValue) =>
                              handleStatusChange(task.id, newValue)
                            }
                            className="text-sm"
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </LayoutComponents>

      {/* Pinned Task Modal */}
      {isPinnedModalOpen && (
        <LayoutComponents
          title="Pinned Task"
          variant="modal"
          modal={pinnedModalContent}
          onCloseModal={() => setIsPinnedModalOpen(false)}
        />
      )}
    </div>
  );
};

export default TasksPage;