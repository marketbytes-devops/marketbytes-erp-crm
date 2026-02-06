  "use client";

  import React, { useState, useEffect } from "react";
  import { MdClose, MdFilterList } from "react-icons/md";
  import { Toaster, toast } from "react-hot-toast";
  import apiClient from "../../../helpers/apiClient";

  const Scrum = () => {
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const [filters, setFilters] = useState({
      project: "",
      task: "",
      employees: "",
      startDate: "",
      morningMemo: "",
      eveningMemo: "",
      status: "",
    });

    const [createForm, setCreateForm] = useState({
      project: "",
      task: "",
      employeeName: "",
      status: "",
      memo: "",
      project_name: "",
      task_name: "",
    });

    const [projects, setProjects] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [scrumData, setScrumData] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
      let isMounted = true;

      const loadData = async () => {
        setIsLoading(true);

        try {
          console.log("Fetching fresh data...");

          const [projRes, empRes, tasksRes, scrumRes] = await Promise.allSettled([
            apiClient.get("/operation/projects/"),
            apiClient.get("/auth/users/"),
            apiClient.get("/operation/tasks/"),
            apiClient.get("/operation/scrum/")
          ]);

          if (!isMounted) return;

          if (projRes.status === 'fulfilled') {
            const projectsList = Array.isArray(projRes.value.data?.results)
              ? projRes.value.data.results
              : Array.isArray(projRes.value.data) ? projRes.value.data : [];
            setProjects(projectsList);
          } else setProjects([]);

          if (empRes.status === 'fulfilled') {
            const employeesList = Array.isArray(empRes.value.data?.results)
              ? empRes.value.data.results
              : Array.isArray(empRes.value.data) ? empRes.value.data : [];
            setEmployees(employeesList);
          } else setEmployees([]);

          if (tasksRes.status === 'fulfilled') {
            const taskList = Array.isArray(tasksRes.value.data?.results)
              ? tasksRes.value.data.results
              : Array.isArray(tasksRes.value.data) ? tasksRes.value.data : [];
            setTasks(taskList);
          } else setTasks([]);

         
          if (scrumRes.status === 'fulfilled') {
            let scrumList = Array.isArray(scrumRes.value.data?.results)
              ? scrumRes.value.data.results
              : Array.isArray(scrumRes.value.data) ? scrumRes.value.data : [];

            console.log(`Fresh API returned ${scrumList.length} scrum items`);

            if (scrumList.length > 0) {
              const formatted = scrumList.map(s => ({
                id: s.id,
                project_id:   s.project || "",         
                project_name: s.project_name || "—",
                task_id:      s.task || "",             
                task_name:    s.task_name || "—",
                employee_id:  s.employee || "",         
                employee_name: s.employee_name || "—",
                task: {
                  due_date: s.due_date || "No deadline"  
                },
                morning_memo: s.morning_memo || "",
                evening_memo: s.evening_memo || "",
                status: s.reported_status || "todo",
                date: s.date,
              }));

              console.log("Fresh formatted count:", formatted.length);
              setScrumData(formatted);
              sessionStorage.setItem("scrumData", JSON.stringify(formatted));
            }
          } else {
            console.error("Scrum fetch failed:", scrumRes.reason);
            toast.error("Could not load fresh scrum data");

           
            const saved = sessionStorage.getItem("scrumData");
            if (saved) {
              try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) setScrumData(parsed);
              } catch {}
            }
          }

        } catch (err) {
          console.error("Critical fetch error:", err);
          toast.error("Network or auth error");
        } finally {
          if (isMounted) setIsLoading(false);
        }
      };

      loadData();

      return () => { isMounted = false; };
    }, []);



    const handleFilterChange = (field, value) => {
      setFilters((prev) => ({ ...prev, [field]: value }));
    };

    const handleCreateFormChange = (field, value) => {
      if (field === "project") {
        const selectedProject = projects.find(p => String(p.id) === value);
        setCreateForm(prev => ({
          ...prev,
          project: value,
          project_name: selectedProject ? selectedProject.name : "",
        }));
      } else if (field === "task") {
        const selectedTask = tasks.find(t => String(t.id) === value);
        setCreateForm(prev => ({
          ...prev,
          task: value,
          task_name: selectedTask ? selectedTask.name : "",
        }));
      } else {
        setCreateForm(prev => ({ ...prev, [field]: value }));
      }
    };

    const handleCreateSubmit = async () => {
      if (!createForm.project || !createForm.task || !createForm.employeeName || !createForm.status) {
        toast.error("Please fill all required fields");
        return;
      }

      try {
        const today = new Date().toISOString().split('T')[0];

        const response = await apiClient.post("/operation/scrum/", {
          task: createForm.task,
          employee: createForm.employeeName,
          reported_status: createForm.status,
          morning_memo: createForm.memo || "",
          evening_memo: "",
          date: today,
        });

        const newScrum = response.data;

        const selectedEmployee = employees.find(emp => String(emp.id) === String(createForm.employeeName));

        const formattedNewScrum = {
          id: newScrum.id,
          project_name: createForm.project_name || "—",
          task_name: createForm.task_name || "—",
          project_id: createForm.project || "",
          task_id: createForm.task || "",
          employee_name: selectedEmployee
            ? `${selectedEmployee.first_name || ''} ${selectedEmployee.last_name || selectedEmployee.username || ''}`.trim() || "—"
            : "—",
          employee_id: createForm.employeeName || "",
          task: {
            due_date: newScrum.due_date || newScrum.task?.due_date || "No deadline"
          },
          morning_memo: newScrum.morning_memo || "",
          evening_memo: newScrum.evening_memo || "",
          status: newScrum.reported_status || "todo",
          date: today,
        };

        setScrumData(prev => [...prev, formattedNewScrum]);

        toast.success("Scrum created successfully!");

        setShowCreateModal(false);

        setCreateForm({
          project: "",
          task: "",
          employeeName: "",
          status: "",
          memo: "",
          project_name: "",
          task_name: "",
        });
      } catch (err) {
        console.error("Create error:", err.response?.data || err);
        toast.error("Failed to create scrum");
      }
    };

    const handleResetFilters = () => {
      setFilters({
        project: "",
        task: "",
        employees: "",
        startDate: "",
        morningMemo: "",
        eveningMemo: "",
        status: "",
      });
      setSearchQuery("");
    };

    const filteredScrumData = scrumData.filter((item) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          (item.project_name && item.project_name.toLowerCase().includes(query)) ||
          (item.task_name && item.task_name.toLowerCase().includes(query)) ||
          (item.employee_name && item.employee_name.toLowerCase().includes(query));
        
        if (!matchesSearch) return false;
      }

      if (filters.project && String(item.project_id) !== String(filters.project)) return false;
      if (filters.task && String(item.task_id) !== String(filters.task)) return false;
      if (filters.employees && String(item.employee_id) !== String(filters.employees)) return false;
      if (filters.status && item.status !== filters.status) return false;
      if (filters.startDate && item.date !== filters.startDate) return false;

      return true;
    });

    const totalTasks = filteredScrumData.length;
    const pinnedCount = 0;

    console.log("Current scrumData state:", scrumData.length);
    console.log("Current filteredScrumData:", filteredScrumData.length);

    return (
      <>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: "#000",
              color: "#fff",
              fontSize: "14px",
            },
            success: { iconTheme: { primary: "#10b981", secondary: "#fff" } },
            error: { iconTheme: { primary: "#ef4444", secondary: "#fff" } },
          }}
        />

        <div className="w-full min-h-screen p-6">
          <div className="mt-4 mb-4">
            <h1 className="text-bold text-2xl">Scrum</h1>
            <h2 className="text-gray-600">Manage sprints and workflows</h2>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-12">
                <div className="text-center">
                  <div className="text-4xl font-bold text-gray-900 mb-2">{totalTasks}</div>
                  <div className="text-sm text-gray-600">Total Scrums</div>
                </div>

                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-600 mb-2">
                    {filteredScrumData.filter((s) => s.status === "todo").length}
                  </div>
                  <div className="text-sm text-gray-600">To Do</div>
                </div>

                <div className="text-center">
                  <div className="text-4xl font-bold text-orange-600 mb-2">
                    {filteredScrumData.filter((s) => s.status === "in_progress").length}
                  </div>
                  <div className="text-sm text-gray-600">In Progress</div>
                </div>

                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600 mb-2">
                    {filteredScrumData.filter((s) => s.status === "done").length}
                  </div>
                  <div className="text-sm text-gray-600">Completed</div>
                </div>
              </div>

              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors font-medium"
              >
                <span className="text-xl">+</span>
                Create Scrum
              </button>
            </div>
          </div>
          {showCreateModal && (
            <div className="bg-gray-100 rounded-2xl border border-gray-200 p-8 mb-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center">
                  <span className="text-xl">+</span>
                </div>
                <h3 className="text-2xl font-semibold text-gray-900">CREATE</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Select Project <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={createForm.project}
                    onChange={(e) => handleCreateFormChange("project", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 bg-white"
                  >
                    <option value="">--</option>
                    {Array.isArray(projects) &&
                      projects.map((p) => (
                        <option key={p.id} value={String(p.id)}>
                          {p.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Select Task <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={createForm.task}
                    onChange={(e) => handleCreateFormChange("task", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 bg-white"
                  >
                    <option value="">--</option>
                    {Array.isArray(tasks) && tasks.length > 0 ? (
                      tasks.map((t) => (
                        <option key={t.id} value={String(t.id)}>
                          {t.name}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>
                        No tasks available
                      </option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Employee Name <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={createForm.employeeName}
                    onChange={(e) => handleCreateFormChange("employeeName", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 bg-white"
                  >
                    <option value="">--</option>
                    {Array.isArray(employees) &&
                      employees.map((emp) => (
                        <option key={emp.id} value={String(emp.id)}>
                          {emp.first_name} {emp.last_name || emp.username}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={createForm.status}
                    onChange={(e) => handleCreateFormChange("status", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 bg-white"
                  >
                    <option value="">--</option>
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="done">Done</option>
                  </select>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-900 mb-2">Memo</label>
                <textarea
                  value={createForm.memo}
                  onChange={(e) => handleCreateFormChange("memo", e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 resize-none"
                  placeholder="Enter memo..."
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleCreateSubmit}
                  className="flex items-center gap-2 px-6 py-3 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors font-medium"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save
                </button>

                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex items-center gap-2 px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Close
                </button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 ">
                <div className="relative">
                  <svg
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search tasks, projects"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700"
                  />
                </div>
              </div>

              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="flex items-center gap-2 px-6 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-700 font-medium"
              >
                <MdFilterList className="w-5 h-5" />
                Filters
                <svg
                  className={`w-4 h-4 transition-transform ${
                    showAdvancedFilters ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              <div className="px-6 py-3 border border-gray-200 rounded-xl text-gray-700 font-medium">
                {totalTasks} scrums
              </div>

              <button className="flex items-center gap-2 px-6 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-700 font-medium">
                <span className="text-yellow-500">⭐</span>
                Pinned ({pinnedCount})
              </button>

              <button className="px-6 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-700 font-medium">
                View Archive
              </button>

              <button className="flex items-center gap-2 px-6 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-700 font-medium">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Export
              </button>
            </div>
          </div>

          {showAdvancedFilters && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-semibold text-gray-900">
                  Advanced Filters
                </h3>
                <button
                  onClick={() => setShowAdvancedFilters(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <MdClose className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project
                  </label>
                  <select
                    value={filters.project}
                    onChange={(e) => handleFilterChange("project", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 bg-white"
                  >
                    <option value="">All Projects</option>
                    {Array.isArray(projects) &&
                      projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Task
                  </label>
                  <select
                    value={filters.task}
                    onChange={(e) => handleFilterChange("task", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 bg-white"
                  >
                    <option value="">All Tasks</option>
                    {Array.isArray(tasks) &&
                      tasks.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assignee
                  </label>
                  <select
                    value={filters.employees}
                    onChange={(e) => handleFilterChange("employees", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 bg-white"
                  >
                    <option value="">All Members</option>
                    {Array.isArray(employees) && employees.length > 0 ? (
                      employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.first_name} {emp.last_name || emp.username}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>
                        No employees available
                      </option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange("status", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 bg-white"
                  >
                    <option value="">All Statuses</option>
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="done">Done</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange("startDate", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700"
                  />
                </div>
              </div>

              <div>
                <button
                  onClick={handleResetFilters}
                  className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors text-gray-700 font-medium"
                >
                  Reset All Filters
                </button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      #
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      PROJECT
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      TASK
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      MEMBERS
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      DEADLINE
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      MORNING MEMO
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      EVENING MEMO
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      STATUS
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      ACTIONS
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan="9" className="text-center py-10">
                        <div className="flex flex-col items-center justify-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
                          <div className="text-gray-500">Loading scrums...</div>
                        </div>
                      </td>
                    </tr>
                  ) : filteredScrumData.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="text-center py-10 text-gray-500">
                        No scrums found
                      </td>
                    </tr>
                  ) : (
                    filteredScrumData.map((item, index) => (
                      <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-6 py-6 text-gray-900 font-medium">{index + 1}</td>
                        <td className="px-6 py-6 text-gray-900 font-medium">{item.project_name || "—"}</td>
                        <td className="px-6 py-6 text-gray-700">{item.task_name || "—"}</td>
                        <td className="px-6 py-6">
                          {item.employee_name ? (
                            <div className="relative group">
                              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-500 text-white font-semibold cursor-pointer">
                                {item.employee_name.charAt(0)}
                              </div>
                              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-10">
                                {item.employee_name}
                                <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-6 text-gray-700">
                          {item.task?.due_date || "No deadline"}
                        </td>
                        <td className="px-6 py-6">
                          <div className="text-sm text-gray-700">
                            {item.morning_memo || "No"}
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          <textarea
                            value={item.evening_memo || ""}
                            onChange={(e) => {
                              const updatedData = [...scrumData];
                              const originalIndex = scrumData.findIndex(s => s.id === item.id);
                              updatedData[originalIndex].evening_memo = e.target.value;
                              setScrumData(updatedData);
                            }}
                            rows={2}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            placeholder="Write evening memo..."
                          />
                        </td>
                        <td className="px-6 py-6">
                          <select
                            value={item.status || "todo"}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 cursor-pointer"
                          >
                            <option value="todo">To Do</option>
                            <option value="in_progress">In Progress</option>
                            <option value="review">Review</option>
                            <option value="done">Done</option>
                          </select>
                        </td>
                        <td className="px-6 py-6">
                          <div className="flex items-center gap-3">
                            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="View">
                              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>

                            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Edit">
                              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>

                            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Pin">
                              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                              </svg>
                            </button>

                            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Archive">
                              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </>
    );
  };

  export default Scrum;