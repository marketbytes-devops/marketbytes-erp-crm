import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import LayoutComponents from "../../../components/LayoutComponents";
import { MdArrowBack } from "react-icons/md";
import toast from "react-hot-toast";
import apiClient from "../../../helpers/apiClient";
import Loading from "../../../components/Loading";
import Dropdown from "../../../components/Dropdown"; 
import { MdPerson, MdClose } from "react-icons/md";

const NewTaskPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(true);

  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);

  const [formData, setFormData] = useState({
    project: "",
    name: "",
    description: "",
    status: "todo",
    priority: "medium",
    start_date: "",
    due_date: "",
    allocated_hours: "",
    category: "",
    assignees: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setFormLoading(true);

        const [projectsRes, usersRes, categoriesRes] = await Promise.all([
          apiClient.get("/operation/projects/"),
          apiClient.get("/auth/users/"),
          apiClient.get("/operation/categories/"),
        ]);

        const extractData = (response) => {
          const data = response?.data;
          if (Array.isArray(data)) return data;
          if (data?.results && Array.isArray(data.results)) return data.results;
          return [];
        };

        setProjects(extractData(projectsRes));
        setUsers(extractData(usersRes));
        setCategories(extractData(categoriesRes));

        const today = new Date().toISOString().split("T")[0];

        setFormData((prev) => ({
          ...prev,
          start_date: today,
        }));
      } catch (err) {
        toast.error("Failed to load required data");
        console.error(err);
      } finally {
        setFormLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAssigneeToggle = (userId) => {
    setFormData((prev) => {
      const assignees = prev.assignees.includes(userId)
        ? prev.assignees.filter((id) => id !== userId)
        : [...prev.assignees, userId];
      return { ...prev, assignees };
    });
  };

  const removeAssignee = (userId) => {
    setFormData((prev) => ({
      ...prev,
      assignees: prev.assignees.filter((id) => id !== userId),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        project: formData.project ? Number(formData.project) : null,
        name: formData.name ? formData.name.trim() : null,
        description: formData.description?.trim() || null,
        status: formData.status, 
        priority: formData.priority,
        start_date: formData.start_date || null,
        due_date: formData.due_date || null,
        allocated_hours: formData.allocated_hours ? parseFloat(formData.allocated_hours) : null,
        category: formData.category ? Number(formData.category) : null,
        assignee_ids: formData.assignees || [],
      };

     
      Object.keys(payload).forEach((key) => {
        if (payload[key] === null || payload[key] === "" || (Array.isArray(payload[key]) && payload[key].length === 0)) {
          delete payload[key];
        }
      });

      console.log("FINAL PAYLOAD SENT:", payload);

      await apiClient.post("/operation/tasks/", payload);

      toast.success("Task created successfully!");
      navigate("/tasks");
    } catch (err) {
      console.error("Full error response:", err.response);
      console.error("Error data from backend:", err.response?.data);

      const errorData = err.response?.data || {};

      let errorMessages = [];

      if (typeof errorData === "object" && errorData !== null && Object.keys(errorData).length > 0) {
        Object.keys(errorData).forEach((field) => {
          const msgs = errorData[field];
          if (Array.isArray(msgs)) {
            msgs.forEach((msg) => errorMessages.push(`${field}: ${msg}`));
          } else {
            errorMessages.push(`${field}: ${msgs}`);
          }
        });
      } else if (typeof errorData === "string") {
        errorMessages.push(errorData);
      } else {
        errorMessages.push("Unknown error from server");
      }

      const finalError = errorMessages.length > 0 
        ? errorMessages.join(" | ") 
        : "Failed to create task";

      toast.error(finalError);
    } finally {
      setLoading(false);
    }
  };

  if (formLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loading />
      </div>
    );
  }

  const todayFormatted = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).replace(/\//g, "-");

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <LayoutComponents title="New Task" subtitle="Create a new task for a project" variant="card">
        <div className="mb-8">
          <Link
            to="/tasks"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
          >
            <MdArrowBack className="w-5 h-5" />
            Back to Tasks
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden p-8">
            {/* Project */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.project}
                onChange={(e) => setFormData({ ...formData, project: e.target.value ? Number(e.target.value) : "" })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Select Project</option>
                {projects.map((proj) => (
                  <option key={proj.id} value={proj.id}>
                    {proj.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Enter task title"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Description */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                rows={6}
                placeholder="Write description here..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Status & Priority */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="review">Review</option>
                  <option value="done">Done</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <div className="flex flex-wrap items-center gap-6">
                  {["urgent", "high", "medium", "low"].map((level) => (
                    <label key={level} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="priority"
                        value={level}
                        checked={formData.priority === level}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                        className={`text-${level === "urgent" || level === "high" ? "red" : level === "medium" ? "yellow" : "teal"}-600`}
                      />
                      <span className={`capitalize text-${level === "urgent" || level === "high" ? "red" : level === "medium" ? "yellow" : "teal"}-600`}>
                        {level}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Dates & Hours */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <p className="text-sm text-gray-500 mt-1">Default: Today ({todayFormatted})</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date
                </label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Allocated Hours
                </label>
                <input
                  type="number"
                  step="0.5"
                  placeholder="e.g., 8.5"
                  value={formData.allocated_hours}
                  onChange={(e) => setFormData({ ...formData, allocated_hours: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Category / Label */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category / Label
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value ? Number(e.target.value) : "" })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">None</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Assigned To - Only Name Shown */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assigned To
              </label>

              <Dropdown
                dropdownId="assignees-dropdown"
                align="left"
                width="w-full"
                trigger={
                  <div className="w-full px-4 py-3 border border-gray-300 rounded-lg flex items-center justify-between hover:border-gray-400 transition cursor-pointer">
                    <div className="flex flex-wrap gap-2">
                      {formData.assignees.length === 0 ? (
                        <span className="text-gray-500">
                          {users.length === 0 ? "No users available" : "Choose Assignee(s)"}
                        </span>
                      ) : (
                        formData.assignees.map((assigneeId) => {
                          const user = users.find((u) => u.id === assigneeId);
                          if (!user) return null;
                          return (
                            <span
                              key={assigneeId}
                              className="inline-flex items-center gap-1.5 bg-teal-100 text-teal-800 px-3 py-1.5 rounded-lg text-sm"
                            >
                              <MdPerson className="w-4 h-4" />
                              {user.name || user.username}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeAssignee(assigneeId);
                                }}
                                className="ml-1 hover:text-teal-900"
                              >
                                <MdClose className="w-4 h-4" />
                              </button>
                            </span>
                          );
                        })
                      )}
                    </div>
                    <span className="text-gray-500">▼</span>
                  </div>
                }
              >
                {users.length === 0 ? (
                  <div className="px-4 py-8 text-center text-gray-500 text-sm">
                    {formLoading ? "Loading users..." : "No users available"}
                  </div>
                ) : (
                  users.map((user) => {
                    const isSelected = formData.assignees.includes(user.id);
                    const displayName = user.name || user.username;

                    return (
                      <Dropdown.Item
                        key={user.id}
                        onClick={() => handleAssigneeToggle(user.id)}
                        icon={MdPerson}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="font-medium">{displayName}</div>
                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center">
                              <span className="text-white text-xs">✓</span>
                            </div>
                          )}
                        </div>
                      </Dropdown.Item>
                    );
                  })
                )}
              </Dropdown>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end gap-4 pt-6">
              <Link
                to="/tasks"
                className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-medium disabled:opacity-50"
              >
                {loading ? "Creating Task..." : "Create Task"}
              </button>
            </div>
          </div>
        </form>
      </LayoutComponents>
    </div>
  );
};

export default NewTaskPage;