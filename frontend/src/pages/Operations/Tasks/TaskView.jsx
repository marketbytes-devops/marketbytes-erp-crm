import React, { useState, useEffect } from "react";
import LayoutComponents from "../../../components/LayoutComponents";
import { useNavigate, useLocation } from "react-router";
import apiClient from "../../../helpers/apiClient";
import Loading from "../../../components/Loading";
import toast from "react-hot-toast";
import Input from "../../../components/Input";

const TasksPage = () => {
  const [search, setSearch] = useState("");
  const [isPinnedModalOpen, setIsPinnedModalOpen] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null); 
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);

  // Advanced Filters State
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState("All Statuses");
  const [filterProject, setFilterProject] = useState("All Projects");
  const [filterAssignee, setFilterAssignee] = useState("All Members");
  const [filterDueDateFrom, setFilterDueDateFrom] = useState("");
  const [filterDueDateTo, setFilterDueDateTo] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

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
        "Review": "review",
        "Done": "done",
      };

      const backendStatus = statusMap[newStatusValue];

      await apiClient.patch(`/operation/tasks/${taskId}/`, {
        status: backendStatus,
      });

      toast.success("Status updated successfully");
      fetchTasks();
    } catch (err) {
      console.error("Failed to update status:", err);
      toast.error("Failed to update status");
    }
  };

  const handleMarkAsComplete = async () => {
    if (!selectedTask) return;

    try {
      await apiClient.patch(`/operation/tasks/${selectedTask.id}/`, {
        status: "done",
      });

      toast.success("Task marked as complete!");
      fetchTasks();
      setIsTaskDetailOpen(false); 
      setSelectedTask(null);
    } catch (err) {
      console.error("Failed to mark task as complete:", err);
      toast.error("Failed to complete task");
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
      review: "Review",
    };
    return map[status] || "To Do";
  };
  const [pinnedTasks, setPinnedTasks] = useState([]);

const togglePinTask = (task) => {
  setPinnedTasks((prev) => {
    const isPinned = prev.some((t) => t.id === task.id);
    if (isPinned) {
      toast.success("Task unpinned");
      return prev.filter((t) => t.id !== task.id);
    } else {
      toast.success("Task pinned!");
      return [...prev, task];
    }
  });
};

const isTaskPinned = (task) => pinnedTasks.some((t) => t.id === task.id);

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

  // Filtering logic
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = 
      task.name?.toLowerCase().includes(search.toLowerCase()) ||
      task.project_name?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = filterStatus === "All Statuses" || getCurrentStatusLabel(task.status) === filterStatus;
    const matchesProject = filterProject === "All Projects" || task.project_name === filterProject;
    const matchesAssignee = filterAssignee === "All Members" || 
      (task.assignees || []).some(a => (a.name || a.username) === filterAssignee);

    const taskDueDate = task.due_date ? new Date(task.due_date) : null;
    const fromDate = filterDueDateFrom ? new Date(filterDueDateFrom) : null;
    const toDate = filterDueDateTo ? new Date(filterDueDateTo) : null;

    const matchesDueDate = (!fromDate || !taskDueDate || taskDueDate >= fromDate) &&
                           (!toDate || !taskDueDate || taskDueDate <= toDate);

    return matchesSearch && matchesStatus && matchesProject && matchesAssignee && matchesDueDate;
  });

  const openTaskDetail = (task) => {
    setSelectedTask(task);
    setIsTaskDetailOpen(true);
  };

  const resetFilters = () => {
    setFilterStatus("All Statuses");
    setFilterProject("All Projects");
    setFilterAssignee("All Members");
    setFilterDueDateFrom("");
    setFilterDueDateTo("");
  };

 
  const statusFilterOptions = [
    { value: "All Statuses", label: "All Statuses" },
    { value: "To Do", label: "To Do" },
    { value: "In progress", label: "In progress" },
    { value: "Review", label: "Review" },
    { value: "Done", label: "Done" },
  ];

  const projectFilterOptions = [
    { value: "All Projects", label: "All Projects" },
    ...[...new Set(tasks.map(t => t.project_name).filter(Boolean))].map(proj => ({
      value: proj,
      label: proj,
    })),
  ];

  const assigneeFilterOptions = [
    { value: "All Members", label: "All Members" },
    ...[...new Set(tasks.flatMap(t => (t.assignees || []).map(a => a.name || a.username)).filter(Boolean))].map(member => ({
      value: member,
      label: member,
    })),
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loading />
      </div>
    );
  }

  // === MODAL CONTENTS ===
const pinnedModalContent = (
  <div className="p-6 min-w-96">
    <h3 className="text-lg font-semibold mb-4">Pinned Tasks ({pinnedTasks.length})</h3>
    {pinnedTasks.length === 0 ? (
      <div className="text-center text-gray-500 py-8">
        No pinned tasks yet.
      </div>
    ) : (
      <div className="space-y-4">
        {pinnedTasks.map((task) => (
          <div
            key={task.id}
            className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition"
            onClick={() => {
              setSelectedTask(task);
              setIsTaskDetailOpen(true);
              setIsPinnedModalOpen(false);
            }}
          >
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium text-gray-900">{task.name}</h4>
                <p className="text-sm text-gray-600 mt-1">{task.project_name || "No project"}</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  togglePinTask(task);
                }}
                className="text-yellow-600 hover:text-yellow-800"
              >
               <svg
  className="w-6 h-6"
  viewBox="0 0 24 24"
  fill="currentColor"
>
  <path d="M16 9V4h1c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1h1v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1 1-1v-7H19v-2c-1.66 0-3-1.34-3-3z" />
</svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

const taskDetailModalContent = selectedTask && (
  <div className="p-6 max-w-4xl mx-auto">
    <div className="mb-6 flex justify-between items-start">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{selectedTask.name}</h2>
        <p className="text-sm text-gray-500 mt-1">TASK #{selectedTask.id}</p>
      </div>
      {/* Pin/Unpin Button */}
      <button
        onClick={() => togglePinTask(selectedTask)}
        className={`p-2 rounded-lg transition ${
          isTaskPinned(selectedTask)
            ? "text-blue-600 bg-blue-50"
            : "text-gray-400 hover:text-blue-600 hover:bg-blue-50"
        }`}
        title={isTaskPinned(selectedTask) ? "Unpin task" : "Pin task"}
      >
        {isTaskPinned(selectedTask) ? (
          /* Pinned state: normal pushpin */
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16 9V4h1c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1h1v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1 1-1v-7H19v-2c-1.66 0-3-1.34-3-3z" />
          </svg>
        ) : (
          /* Unpinned state: pushpin with slash */
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16 9V4h1c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1h1v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1 1-1v-7H19v-2c-1.66 0-3-1.34-3-3z" />
            <path
              d="M18.36 18.36L5.64 5.64"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        )}
      </button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div>
        <p className="text-sm font-medium text-gray-600">Project</p>
        <p className="text-gray-900">{selectedTask.project_name || "No project"}</p>
      </div>
      <div>
        <p className="text-sm font-medium text-gray-600">Status</p>
        <p className="text-gray-900">{getCurrentStatusLabel(selectedTask.status)}</p>
      </div>
      <div>
        <p className="text-sm font-medium text-gray-600">Priority</p>
        <p className="text-gray-900">{selectedTask.priority || "Not set"}</p>
      </div>
      <div>
        <p className="text-sm font-medium text-gray-600">Category</p>
        <p className="text-gray-900">{selectedTask.category || "Not set"}</p>
      </div>
      <div>
        <p className="text-sm font-medium text-gray-600">Start Date</p>
        <p className="text-gray-900">
          {selectedTask.start_date
            ? new Date(selectedTask.start_date).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              }).replace(/\//g, "-")
            : "Not set"}
        </p>
      </div>
      <div>
        <p className="text-sm font-medium text-gray-600">Due Date</p>
        <p className="text-gray-900">
          {selectedTask.due_date
            ? new Date(selectedTask.due_date).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              }).replace(/\//g, "-")
            : "No due date"}
        </p>
      </div>
      <div>
        <p className="text-sm font-medium text-gray-600">Allocated Hours</p>
        <p className="text-gray-900">{selectedTask.allocated_hours || "Not set"}</p>
      </div>
    </div>

    <div className="mb-8">
      <p className="text-sm font-medium text-gray-600 mb-2">Assigned To</p>
      <div className="flex items-center gap-3">
        {renderAvatars(selectedTask.assignees || [])}
      </div>
    </div>

    {selectedTask.description && (
      <div className="mb-8">
        <p className="text-sm font-medium text-gray-600 mb-2">Description</p>
        <p className="text-gray-700 whitespace-pre-wrap">{selectedTask.description}</p>
      </div>
    )}

    <div className="flex justify-end gap-4 mt-8">
      <button
        onClick={() => setIsTaskDetailOpen(false)}
        className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
      >
        Close
      </button>
      {getCurrentStatusLabel(selectedTask.status) !== "Done" && (
        <button
          onClick={handleMarkAsComplete}
          className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800"
        >
          Mark as Complete
        </button>
      )}
    </div>
  </div>
);
  // === END OF MODAL CONTENTS ===

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
             
              <button onClick={handleNewtaskClick} className="bg-black text-white px-4 py-2 rounded-lg flex items-center gap-2">
                <span className="text-lg">+</span> New Task
              </button>
            </div>
           
          </div>

          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between mb-4">
              <div className="relative flex-1 max-w-2xl">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search tasks..."
                  className="w-full pl-12 pr-6 py-4 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                />
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                  className="flex items-center gap-2 px-6 py-4 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 shadow-sm"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Filters
                  <svg className={`w-4 h-4 transition-transform ${isFiltersOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <span className="text-gray-700 font-medium">{filteredTasks.length} tasks</span>

                <button className="flex items-center gap-2 px-6 py-4 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 shadow-sm">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Export
                </button>
              </div>
            </div>

            {isFiltersOpen && (
              <div className="mt-6 p-6 bg-white rounded-xl border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <Input
                    label="Status"
                    type="select"
                    value={filterStatus}
                    onChange={setFilterStatus}
                    options={statusFilterOptions}
                    placeholder="All Statuses"
                  />

                  <Input
                    label="Project"
                    type="select"
                    value={filterProject}
                    onChange={setFilterProject}
                    options={projectFilterOptions}
                    placeholder="All Projects"
                  />

                  <Input
                    label="Assigned To"
                    type="select"
                    value={filterAssignee}
                    onChange={setFilterAssignee}
                    options={assigneeFilterOptions}
                    placeholder="All Members"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <Input
                    label="Due Date From"
                    type="date"
                    value={filterDueDateFrom}
                    onChange={setFilterDueDateFrom}
                  />

                  <Input
                    label="Due Date To"
                    type="date"
                    value={filterDueDateTo}
                    onChange={setFilterDueDateTo}
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={resetFilters}
                    className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    Reset All Filters
                  </button>
                </div>
              </div>
            )}
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
                        <button
                          onClick={() => openTaskDetail(task)}
                          className="text-blue-600 hover:underline"
                        >
                          {task.name}
                        </button>
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

      {/* Task Detail Modal */}
      {isTaskDetailOpen && selectedTask && (
        <LayoutComponents
          title={`TASK #${selectedTask.id}`}
          variant="modal"
          modal={taskDetailModalContent}
          onCloseModal={() => setIsTaskDetailOpen(false)}
        />
      )}
    </div>
  );
};
export default TasksPage;