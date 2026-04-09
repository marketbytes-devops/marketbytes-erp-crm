import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import LayoutComponents from "../../../components/LayoutComponents";
import apiClient from "../../../helpers/apiClient";
import toast from "react-hot-toast";
import { MdArrowBack, MdAdd, MdOutlineAccessTime, MdTrendingUp, MdPerson } from "react-icons/md";
import Loading from "../../../components/Loading";
import Input from "../../../components/Input";

const NewTaskPage = () => {
 const navigate = useNavigate();
 const location = useLocation();
 const [loading, setLoading] = useState(false);
 const [formLoading, setFormLoading] = useState(true);
 const [projectDetails, setProjectDetails] = useState(null);
 const [projectTasks, setProjectTasks] = useState([]);

 const [projects, setProjects] = useState([]);
 const [users, setUsers] = useState([]);

  // Monthly productive hours policy (FY)
  const MONTHLY_EXPECTED_PRODUCTIVE_HOURS = 176;
  const [existingMonthAllocatedByEmp, setExistingMonthAllocatedByEmp] = useState({});
  const [existingMonthLoading, setExistingMonthLoading] = useState(false);

 const [formData, setFormData] = useState({
    project: location.state?.projectId || "",
    tasks: [
      {
        id: Date.now(),
        name: "",
        description: "",
        status: "todo",
        priority: "medium",
        start_date: new Date().toISOString().split("T")[0],
        due_date: "",
        allocated_hours: "",
        assignees: [],
      },
    ],
  });

 useEffect(() => {
 const fetchData = async () => {
 try {
 setFormLoading(true);

 const [projectsRes, usersRes] = await Promise.all([
 apiClient.get("/operation/projects/"),
 apiClient.get("/auth/users/"),
 ]);

 const extractData = (response) => {
 const data = response?.data;
 if (Array.isArray(data)) return data;
 if (data?.results && Array.isArray(data.results)) return data.results;
 return [];
 };

 setProjects(extractData(projectsRes));
 setUsers(extractData(usersRes));
 } catch (err) {
 toast.error("Failed to load required data");
 console.error(err);
 } finally {
 setFormLoading(false);
 }
 };

 fetchData();
 }, [location.state?.projectId]);

  useEffect(() => {
    const fetchProjectContext = async () => {
        if (formData.project) {
            const selectedProj = projects.find(p => p.id.toString() === formData.project.toString());
            if (selectedProj) {
                setProjectDetails(selectedProj);
                try {
                    const tasksRes = await apiClient.get(`/operation/tasks/?project=${formData.project}&is_active=true`);
                    const data = Array.isArray(tasksRes.data) ? tasksRes.data : tasksRes.data.results || [];
                    setProjectTasks(data);
                } catch (err) {
                    console.error("Failed to fetch project tasks", err);
                }
            } else {
                setProjectDetails(null);
                setProjectTasks([]);
            }
        } else {
            setProjectDetails(null);
            setProjectTasks([]);
        }
    };
    fetchProjectContext();
  }, [formData.project, projects]);

  // Monthly 176 hours remaining / overtime calculation for task allocation
  const pad2 = (n) => String(n).padStart(2, "0");
  const toYMD = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  const now = new Date();
  const monthStartStr = toYMD(new Date(now.getFullYear(), now.getMonth(), 1));
  const monthEndStr = toYMD(new Date(now.getFullYear(), now.getMonth() + 1, 0));

  const selectedAssigneeIds = Array.from(
    new Set(formData.tasks.flatMap((t) => (t.assignees || []).map(String)))
  ).filter(Boolean);

  const selectedAssigneeKey = selectedAssigneeIds.slice().sort().join(",");

  useEffect(() => {
    const fetchExistingMonthAllocated = async () => {
      if (!selectedAssigneeIds.length) {
        setExistingMonthAllocatedByEmp({});
        return;
      }

      setExistingMonthLoading(true);
      try {
        const results = await Promise.all(
          selectedAssigneeIds.map(async (empId) => {
            const url = `/operation/tasks/?assignees=${empId}&is_active=true&start_date__gte=${monthStartStr}&start_date__lte=${monthEndStr}`;
            const res = await apiClient.get(url);
            const data = Array.isArray(res.data)
              ? res.data
              : res.data?.results || [];
            const totalAllocated = data.reduce(
              (sum, t) => sum + parseFloat(t.allocated_hours || 0),
              0
            );
            return [String(empId), totalAllocated];
          })
        );

        const map = {};
        results.forEach(([empId, hours]) => {
          map[empId] = Number.isFinite(hours) ? hours : 0;
        });
        setExistingMonthAllocatedByEmp(map);
      } catch (err) {
        console.error("Failed to fetch existing month allocated hours:", err);
        setExistingMonthAllocatedByEmp({});
      } finally {
        setExistingMonthLoading(false);
      }
    };

    fetchExistingMonthAllocated();
  }, [selectedAssigneeKey]);

  const monthlySummaryByEmp = selectedAssigneeIds.map((empId) => {
    const existing = existingMonthAllocatedByEmp[empId] || 0;
    let batch = 0;
    formData.tasks.forEach((task) => {
      const taskHours = parseFloat(task.allocated_hours || 0);
      if (!task.assignees || !task.assignees.length) return;
      if (task.assignees.map(String).includes(String(empId))) {
        batch += Number.isFinite(taskHours) ? taskHours : 0;
      }
    });

    const total = existing + batch;
    const remaining = Math.max(
      0,
      MONTHLY_EXPECTED_PRODUCTIVE_HOURS - total
    );
    const overtime = Math.max(0, total - MONTHLY_EXPECTED_PRODUCTIVE_HOURS);

    const u = users.find((x) => String(x.id) === String(empId));
    return {
      empId,
      name: u?.name || u?.username || u?.email || `Employee ${empId}`,
      existingHours: existing,
      batchHours: batch,
      totalHours: total,
      remainingHours: remaining,
      overtimeHours: overtime,
    };
  });

  const dateWarnings = (() => {
    if (!projectDetails) return [];
    let allWarnings = [];
    
    formData.tasks.forEach((task, index) => {
        let warnings = [];
        if (task.start_date && projectDetails.start_date) {
            if (new Date(task.start_date) < new Date(projectDetails.start_date)) {
                warnings.push(`Start date is before project start date (${new Date(projectDetails.start_date).toLocaleDateString()})`);
            }
        }
        if (task.due_date && projectDetails.deadline && !projectDetails.no_deadline) {
            if (new Date(task.due_date) > new Date(projectDetails.deadline)) {
                warnings.push(`Due date is after project deadline (${new Date(projectDetails.deadline).toLocaleDateString()})`);
            }
        }
        if (warnings.length > 0) {
            allWarnings.push({ index, taskName: task.name || `Task #${index + 1}`, warnings });
        }
    });

    // Allocated Hours Calculation for the whole batch
    if (projectDetails.hours_allocated) {
        const existingHours = projectTasks.reduce((sum, t) => sum + parseFloat(t.allocated_hours || 0), 0);
        const batchHours = formData.tasks.reduce((sum, t) => sum + parseFloat(t.allocated_hours || 0), 0);
        const totalHours = existingHours + batchHours;
        
        if (totalHours > parseFloat(projectDetails.hours_allocated)) {
            allWarnings.push({ 
                index: -1, 
                taskName: "Total Batch", 
                warnings: [`Total allocated hours (${totalHours.toFixed(2)}) exceeds project allocated hours (${projectDetails.hours_allocated})`] 
            });
        }
    }

    return allWarnings;
  })();

  const addTaskRow = () => {
    setFormData(prev => ({
        ...prev,
        tasks: [
            ...prev.tasks,
            {
                id: Date.now(),
                name: "",
                description: "",
                status: "todo",
                priority: "medium",
                start_date: new Date().toISOString().split("T")[0],
                due_date: "",
                allocated_hours: "",
                assignees: [],
            }
        ]
    }));
  };

  const removeTaskRow = (id) => {
    if (formData.tasks.length === 1) return;
    setFormData(prev => ({
        ...prev,
        tasks: prev.tasks.filter(t => t.id !== id)
    }));
  };

  const updateTask = (id, field, value) => {
    setFormData(prev => ({
        ...prev,
        tasks: prev.tasks.map(t => t.id === id ? { ...t, [field]: value } : t)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
        const createPromises = formData.tasks.map(task => {
            const payload = {
                project: formData.project ? Number(formData.project) : null,
                name: task.name ? task.name.trim() : null,
                description: task.description?.trim() || null,
                status: task.status,
                priority: task.priority,
                start_date: task.start_date || null,
                due_date: task.due_date || null,
                allocated_hours: task.allocated_hours ? parseFloat(task.allocated_hours) : null,
                assignee_ids: task.assignees || [],
            };

            Object.keys(payload).forEach((key) => {
                if (payload[key] === null || payload[key] === "" || (Array.isArray(payload[key]) && payload[key].length === 0)) {
                    delete payload[key];
                }
            });
            return apiClient.post("/operation/tasks/", payload);
        });

        await Promise.all(createPromises);
        toast.success(`Successfully created ${formData.tasks.length} tasks!`);
        navigate("/operations/tasks");
    } catch (err) {
        console.error("Error creating tasks:", err);
        toast.error("Failed to create some tasks. Check logs.");
    } finally {
        setLoading(false);
    }
  };

 if (formLoading) {
 return (
 <div className="min-h-screen flex items-center justify-center bg-transparent">
 <Loading />
 </div>
 );
 }

 const projectOptions = projects.map((proj) => ({
 value: proj.id,
 label: proj.name,
 }));

 const statusOptions = [
 { value: "todo", label: "To Do" },
 { value: "in_progress", label: "In Progress" },
 { value: "review", label: "Review" },
 { value: "done", label: "Done" },
 ];

  const selectedProject = projects.find((p) => String(p.id) === String(formData.project));
  const projectMembers = selectedProject?.members || [];

  const assigneeOptions = projectMembers.map((user) => ({
    value: user.id,
    label: user.name || user.username || user.email,
  }));

 return (
 <div className="p-6 mx-auto">
 <LayoutComponents title="New Task" subtitle="Create a new task for a project" variant="card">
 <div className="mb-8">
 <Link
 to="/operations/tasks"
 className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 hover:bg-gray-50 transition px-4 py-3 text-sm rounded-xl font-medium"
 >
 <MdArrowBack className="w-5 h-5" />
 Back to Tasks
 </Link>
 </div>

 <form onSubmit={handleSubmit} className="space-y-10">
  <div className="bg-white rounded-xl shadow-sm overflow-hidden p-8">
    {/* Project Selection (Single for all tasks in this batch) */}
    <div className="mb-10 p-6 bg-gray-50 rounded-2xl border border-gray-100">
        <Input
            label="Project"
            type="select"
            required
            placeholder="Select Project"
            options={[{ value: "", label: "Select Project" }, ...projectOptions]}
            value={formData.project}
            onChange={(val) => setFormData({ ...formData, project: val })}
        />
    </div>

    {/* Batch Status Warnings */}
    {dateWarnings.length > 0 && (
        <div className="mb-8 space-y-3">
            {dateWarnings.map((warn, i) => (
                <div key={i} className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex flex-col gap-1">
                    <p className="text-xs font-bold uppercase text-amber-800">{warn.taskName}</p>
                    <div className="space-y-1">
                        {warn.warnings.map((w, j) => (
                            <div key={j} className="flex items-center gap-2 text-amber-700 text-sm font-medium">
                                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                                {w}
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )}

    {/* Monthly productive hours remaining / overtime (no blocking) */}
    <div className="mb-8 p-6 bg-gray-50 rounded-2xl border border-gray-100">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <MdOutlineAccessTime className="w-5 h-5 text-black" />
            <p className="text-sm font-bold text-black">
              Monthly Productivity (176 hrs)
            </p>
          </div>
          <p className="text-xs text-gray-600 font-medium">
            Remaining / overtime is calculated for selected assignees using existing month allocations + this batch allocations.
          </p>
        </div>
        {existingMonthLoading && (
          <p className="text-xs text-gray-500 font-medium">Calculating...</p>
        )}
      </div>

      {monthlySummaryByEmp.length > 0 && (
        <div className="mt-4 space-y-3">
          {monthlySummaryByEmp.map((row) => (
            <div
              key={row.empId}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-4 bg-white rounded-xl border border-gray-100"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center text-sm font-bold">
                  {row.name?.[0]?.toUpperCase() || "E"}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {row.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    Month total: {row.totalHours.toFixed(2)} hrs
                  </p>
                </div>
              </div>

              {row.totalHours < MONTHLY_EXPECTED_PRODUCTIVE_HOURS ? (
                <div className="text-right">
                  <p className="text-xs text-gray-500 font-medium">
                    Remaining
                  </p>
                  <p className="text-sm font-bold text-black">
                    {row.remainingHours.toFixed(2)} hrs
                  </p>
                </div>
              ) : (
                <div className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <MdTrendingUp className="w-4 h-4 text-emerald-600" />
                    <p className="text-xs text-emerald-700 font-bold">
                      176 hrs completed
                    </p>
                  </div>
                  <p className="text-xs text-emerald-700 font-medium">
                    Overtime: {row.overtimeHours.toFixed(2)} hrs
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>

    {/* Repeating Task Sections */}
    <div className="space-y-12">
        {formData.tasks.map((task, index) => (
            <div key={task.id} className="relative p-8 border border-gray-200 rounded-2xl bg-white shadow-xs">
                <div className="absolute -top-4 left-6 px-4 py-1 bg-black text-white text-xs font-bold rounded-full uppercase tracking-widest">
                    Task #{index + 1}
                </div>
                
                {formData.tasks.length > 1 && (
                    <button 
                        type="button"
                        onClick={() => removeTaskRow(task.id)}
                        className="absolute -top-4 right-6 px-4 py-1 bg-red-600 text-white text-xs font-bold rounded-full hover:bg-red-700 transition"
                    >
                        Remove
                    </button>
                )}

                <div className="space-y-8 mt-4">
                    {/* Title */}
                    <Input
                        label="Title"
                        type="text"
                        required
                        placeholder="Enter task title"
                        value={task.name}
                        onChange={(e) => updateTask(task.id, "name", e.target.value)}
                    />

                    {/* Description */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea
                            rows={4}
                            placeholder="Write description here..."
                            value={task.description}
                            onChange={(e) => updateTask(task.id, "description", e.target.value)}
                            className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black transition"
                        />
                    </div>

                    {/* Status & Priority */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <Input
                            label="Status"
                            type="select"
                            required
                            options={statusOptions}
                            value={task.status}
                            onChange={(val) => updateTask(task.id, "status", val)}
                        />

                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-700">Priority</label>
                            <div className="flex flex-wrap items-center gap-6">
                                {["urgent", "high", "medium", "low"].map((level) => (
                                    <label key={level} className="flex items-center gap-2 cursor-pointer group">
                                        <input
                                            type="radio"
                                            name={`priority-${task.id}`}
                                            value={level}
                                            checked={task.priority === level}
                                            onChange={(e) => updateTask(task.id, "priority", e.target.value)}
                                            className="w-4 h-4 text-black border-gray-300 focus:ring-black"
                                        />
                                        <span className={`capitalize text-sm font-medium group-hover:text-black transition ${task.priority === level ? 'text-black' : 'text-gray-400'}`}>
                                            {level}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Dates & Hours */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <Input
                            label="Start Date"
                            type="date"
                            value={task.start_date}
                            onChange={(e) => updateTask(task.id, "start_date", e.target.value)}
                        />
                        <Input
                            label="Due Date"
                            type="date"
                            value={task.due_date}
                            onChange={(e) => updateTask(task.id, "due_date", e.target.value)}
                        />
                        <Input
                            label="Allocated Hours"
                            type="number"
                            step="0.5"
                            placeholder="e.g., 8.5"
                            value={task.allocated_hours}
                            onChange={(e) => updateTask(task.id, "allocated_hours", e.target.value)}
                        />
                    </div>

                    {/* Assigned To */}
                    <Input
                        label="Assigned To"
                        type="select"
                        multiple
                        placeholder={users.length === 0 ? "No users available" : "Choose Assignee(s)"}
                        options={assigneeOptions}
                        value={task.assignees}
                        onChange={(val) => updateTask(task.id, "assignees", val)}
                    />
                </div>
            </div>
        ))}
    </div>

    {/* Batch Controls */}
    <div className="mt-10 pt-10 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
        <button
            type="button"
            onClick={addTaskRow}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium transition px-6 py-3 bg-blue-50 rounded-xl"
        >
            <MdAdd className="w-5 h-5" />
            Add Another Task
        </button>

        <div className="flex gap-4 w-full md:w-auto">
            <Link
                to="/operations/tasks"
                className="flex-1 md:flex-none text-center border border-gray-300 text-gray-700 hover:bg-gray-50 transition px-8 py-3 text-sm rounded-xl font-medium"
            >
                Cancel
            </Link>
            <button
                type="submit"
                disabled={loading || !formData.project}
                className="flex-1 md:flex-none bg-black text-white hover:bg-gray-900 transition px-8 py-3 text-sm rounded-xl font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
                {loading ? "Creating Tasks..." : `Create ${formData.tasks.length} Task(s)`}
            </button>
        </div>
    </div>
  </div>
</form>
 </LayoutComponents>
 </div>
 );
};

export default NewTaskPage;