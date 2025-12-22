import React, { useState, useEffect } from "react";
import LayoutComponents from "../../../components/LayoutComponents";
import apiClient from "../../../helpers/apiClient";
import Loading from "../../../components/Loading";
import toast from "react-hot-toast";

const TaskBoardPage = () => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [filterDueDateFrom, setFilterDueDateFrom] = useState("");
  const [filterDueDateTo, setFilterDueDateTo] = useState("");
  const [filterProject, setFilterProject] = useState("All");
  const [filterClient, setFilterClient] = useState("All");
  const [filterAssignee, setFilterAssignee] = useState("All");
  const [filterAssignedBy, setFilterAssignedBy] = useState("All");

  // Data from backend
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);

  // Fetch all data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [tasksRes, projectsRes, clientsRes, usersRes] = await Promise.all([
          apiClient.get("/operation/tasks/"),
          apiClient.get("/operation/projects/"),
          apiClient.get("/operation/clients/"),
          apiClient.get("/auth/users/"), 
        ]);

        setTasks(tasksRes.data?.results || tasksRes.data || []);
        setProjects(projectsRes.data?.results || projectsRes.data || []);
        setClients(clientsRes.data?.results || clientsRes.data || []);
        setUsers(usersRes.data?.results || usersRes.data || []);
      } catch (err) {
        console.error("Failed to fetch data:", err);
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

const filteredTasks = tasks.filter((task) => {

  if (filterDueDateFrom && task.due_date) {
    if (new Date(task.due_date) < new Date(filterDueDateFrom)) return false;
  }
  if (filterDueDateTo && task.due_date) {
    if (new Date(task.due_date) > new Date(filterDueDateTo)) return false;
  }

  if (filterProject !== "All") {
    if (!task.project) return false; 
    if (task.project.id != filterProject) return false; 
  }

  if (filterClient !== "All") {
    if (!task.project) return false; 
    const projectObj = projects.find(p => p.id == task.project.id);
    if (!projectObj || !projectObj.client) return false;
    if (projectObj.client.id != filterClient) return false;
  }


  if (filterAssignee !== "All") {
    if (!task.assignees || task.assignees.length === 0) return false;
    const hasAssignee = task.assignees.some(a => a.id == filterAssignee);
    if (!hasAssignee) return false;
  }

  return true;
});

  const handleApply = () => {
  
    setIsFilterOpen(false);
    toast.success("Filters applied!");
  };

  const handleReset = () => {
    setFilterDueDateFrom("");
    setFilterDueDateTo("");
    setFilterProject("All");
    setFilterClient("All");
    setFilterAssignee("All");
    setFilterAssignedBy("All");
    toast.success("Filters reset");
  };

 
  const tasksByStatus = {
    todo: filteredTasks.filter(t => t.status === "todo"),
    in_progress: filteredTasks.filter(t => t.status === "in_progress"),
    review: filteredTasks.filter(t => t.status === "review"),
    done: filteredTasks.filter(t => t.status === "done"),
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loading />
      </div>
    );
  }

  return (
    <div className="p-6">
      <LayoutComponents title="Task Board" variant="card">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12h4l3 9 4-17 3 9h4" />
              </svg>
              Task Board
            </h1>
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="px-4 py-2 border border-gray-300 rounded-lg flex items-center gap-2 hover:bg-gray-50 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filter Results
              <svg className={`w-4 h-4 transition-transform ${isFilterOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Filter Panel */}
          {isFilterOpen && (
            <div className="mt-6 p-6 bg-white rounded-xl border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Date Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Date Range</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="date"
                      value={filterDueDateFrom}
                      onChange={(e) => setFilterDueDateFrom(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg w-full"
                    />
                    <div className="px-4 py-2 bg-black text-white font-medium rounded-lg">
                      To
                    </div>
                    <input
                      type="date"
                      value={filterDueDateTo}
                      onChange={(e) => setFilterDueDateTo(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg w-full"
                    />
                  </div>
                </div>

                {/* Project */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Project</label>
                  <select
                    value={filterProject}
                    onChange={(e) => setFilterProject(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg w-full"
                  >
                    <option value="All">All Projects</option>
                    {projects.map((proj) => (
                      <option key={proj.id} value={proj.id}>
                        {proj.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Client */}
                
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Assigned To */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Assigned To</label>
                  <select
                    value={filterAssignee}
                    onChange={(e) => setFilterAssignee(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg w-full"
                  >
                    <option value="All">All Members</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name || user.username}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <button
                  onClick={handleReset}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Reset All Filters
                </button>
                <button
                  onClick={handleApply}
                  className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition"
                >
                  Apply
                </button>
              </div>
            </div>
          )}

          {/* Date Display */}
          <div className="px-6 py-4 flex justify-between items-center bg-gray-50">
            <p className="text-lg font-medium text-gray-700">
              Tasks From {filterDueDateFrom || "Start"} → {filterDueDateTo || "End"}
            </p>
          </div>

          {/* Kanban Board */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* TO DO */}
            <div>
              <h3 className="text-lg font-semibold text-red-600 mb-4">TO DO</h3>
              <div className="space-y-3">
                {tasksByStatus.todo.map((task) => (
                  <div key={task.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <h4 className="font-medium text-gray-900">{task.name}</h4>
               <p className="text-sm text-gray-600 mt-1">
  {task.project 
    ? projects.find(p => p.id === task.project)?.name || "No Project"
    : "No Project"
  }
</p>
                    {task.due_date && (
                      <p className="text-xs text-gray-500 mt-2">Due: {new Date(task.due_date).toLocaleDateString("en-GB")}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* IN PROGRESS */}
            <div>
              <h3 className="text-lg font-semibold text-cyan-600 mb-4">IN PROGRESS</h3>
              <div className="space-y-3">
                {tasksByStatus.in_progress.map((task) => (
                  <div key={task.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <h4 className="font-medium text-gray-900">{task.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{task.project?.name || "No Project"}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* REVIEW */}
            <div>
              <h3 className="text-lg font-semibold text-orange-600 mb-4">REVIEW</h3>
              <div className="space-y-3">
                {tasksByStatus.review.map((task) => (
                  <div key={task.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <h4 className="font-medium text-gray-900">{task.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{task.project?.name || "No Project"}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* DONE */}
            <div>
              <h3 className="text-lg font-semibold text-green-600 mb-4">DONE</h3>
              <div className="space-y-3">
                {tasksByStatus.done.map((task) => (
                  <div key={task.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <h4 className="font-medium text-gray-900">{task.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{task.project?.name || "No Project"}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </LayoutComponents>
    </div>
  );
};

export default TaskBoardPage;