import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MdFilterList,
  MdClose,
  MdKeyboardArrowDown,
  MdDownload,
  MdAdd,
  MdPushPin,
  MdEdit,
  MdDelete,
  MdArchive,
} from "react-icons/md";
import { FiSearch } from "react-icons/fi";
import LayoutComponents from "../../../components/LayoutComponents";
import { useNavigate } from "react-router";
import apiClient from "../../../helpers/apiClient";
import toast from "react-hot-toast";

const ProjectsView = () => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate("/operations/projects/projectarchive");
  };

  const handleProjectCreate = () => {
    navigate("/operations/projects/projectcreate");
  };

  const handleProjectTemplate = () => {
    navigate("/operations/projects/projecttemplate");
  };

  const [isPinnedModalOpen, setIsPinnedModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    projectStatus: "",
    clientName: "",
    projectCategory: "",
    department: "",
    projectMember: "",
  });

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const [statuses, setStatuses] = useState([]);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [pinnedProjects, setPinnedProjects] = useState([]);

  const activeFilterCount = Object.values(filters).filter(
    (v) => v !== ""
  ).length;

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({
      projectStatus: "",
      clientName: "",
      projectCategory: "",
      department: "",
      projectMember: "",
    });
    setSearch("");
  };

  // Fetch projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get("/operation/projects/");
        const projectData = Array.isArray(response.data)
          ? response.data
          : response.data.results || [];
        setProjects(projectData);
      } catch (error) {
        console.error("Error fetching projects:", error);
        toast.error("Failed to load projects");
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  // Add this useEffect to fetch statuses
  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const response = await apiClient.get("/operation/statuses/");
        const statusData = Array.isArray(response.data)
          ? response.data
          : response.data.results || [];
        setStatuses(statusData);
      } catch (error) {
        console.error("Error fetching statuses:", error);
        // Optional: fallback to common statuses
        setStatuses([
          { id: 1, name: "Not Started" },
          { id: 2, name: "In Progress" },
          { id: 3, name: "Completed" },
        ]);
      }
    };

    fetchStatuses();
  }, []);

  const handleStatusChange = async (projectId, newStatusId) => {
    const parsedId = parseInt(newStatusId);
    const newStatusObj = statuses.find((s) => s.id === parsedId);

    if (!newStatusObj) {
      toast.error("Invalid status");
      return;
    }

    try {
      await apiClient.patch(`/operation/projects/${projectId}/`, {
        status_id: parsedId,
      });

      // Update local state with full status object
      setProjects((prev) =>
        prev.map((project) =>
          project.id === projectId
            ? { ...project, status: newStatusObj, status_id: parsedId }
            : project
        )
      );

      toast.success("Status updated successfully!");
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error("Failed to update status");
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (
      !window.confirm("Are you sure? This project will be moved to archive.")
    ) {
      return;
    }

    try {
      // This triggers the soft delete in backend (sets is_active = false)
      await apiClient.delete(`/operation/projects/${projectId}/`);

      // Remove from the list in frontend
      setProjects((prev) => prev.filter((p) => p.id !== projectId));

      toast.success("Project moved to archive!");
    } catch (error) {
      console.error("Failed to archive project:", error);
      toast.error("Failed to move project to archive");
    }
  };

 const handlePinProject = (project) => {
  setPinnedProjects((prev) => {
    const isAlreadyPinned = prev.some((p) => p.id === project.id);

    if (isAlreadyPinned) {
      // Unpin: remove from pinned list
      toast.success("Project unpinned");
      return prev.filter((p) => p.id !== project.id);
    } else {
      // Pin: add to list
      toast.success("Project pinned successfully!");
      return [...prev, { ...project }];
    }
  });
};

  const stats = useMemo(() => {
    const getStatusName = (project) => {
      const name =
        project.status?.name ||
        (project.status_id &&
          statuses.find((s) => s.id === project.status_id)?.name) ||
        "Not Started";

      // Normalize to lowercase for safe comparison
      return name ? name.toLowerCase().trim() : "not started";
    };

    const total = projects.length;

    const overdue = projects.filter((project) => {
      if (!project.deadline) return false;
      const deadlineDate = new Date(project.deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const isOverdue = deadlineDate < today;
      const statusName = getStatusName(project);
      return isOverdue && statusName !== "completed";
    }).length;

    const notStarted = projects.filter(
      (project) => getStatusName(project) === "not started"
    ).length;

    const completed = projects.filter(
      (project) => getStatusName(project) === "completed"
    ).length;

    return { total, overdue, notStarted, completed };
  }, [projects, statuses]);

  // Client-side filtering
  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name?.toLowerCase().includes(search.toLowerCase()) ||
      project.summary?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      !filters.projectStatus || project.status === filters.projectStatus;
    return matchesSearch && matchesStatus;
  });

  const ActionsDropdown = ({ project, onEdit, onArchive, onPin }) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = () => setIsOpen(false);
    if (isOpen) {
      document.addEventListener("click", handleClickOutside);
    }
    return () => document.removeEventListener("click", handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-2 rounded-lg hover:bg-gray-100 transition"
      >
        <svg
          className="w-5 h-5 text-gray-600"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
          <div className="py-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            >
              <MdEdit className="w-4 h-4" /> Edit
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onPin();
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            >
              <MdPushPin className="w-4 h-4" /> Pin Project
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onArchive();
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            >
              <MdArchive className="w-4 h-4" /> Archive
            </button>

            <hr className="my-1 border-gray-200" />

            <button
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm("Permanently delete this project? This cannot be undone.")) {
                  // You can use same handleDeleteProject or make a hard delete
                  // For now using archive logic
                  onArchive();
                }
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
            >
              <MdDelete className="w-4 h-4" /> Delete Permanently
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

  if (loading) {
    return (
      <div className="p-6">
        <LayoutComponents title="Projects" subtitle="Loading...">
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center py-12">
            <p className="text-gray-500">Loading projects...</p>
          </div>
        </LayoutComponents>
      </div>
    );
  }

  return (
    <div className="p-6">
      <LayoutComponents title="Projects" subtitle={`${projects.length} Total`}>
        {/* Top Stats Row - Exactly matching the reference design with hardcoded numbers */}
        <div className="bg-white flex flex-row justify-between rounded-2xl shadow-sm p-8 mb-8">
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-black text-white rounded-full flex items-center justify-center text-2xl font-bold mb-3">
              {stats.total}
            </div>
            <p className="text-sm text-gray-600">Total Projects</p>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-black text-white rounded-full flex items-center justify-center text-2xl font-bold mb-3">
              {stats.overdue}
            </div>
            <p className="text-sm text-gray-600">Overdue Projects</p>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-black text-white rounded-full flex items-center justify-center text-2xl font-bold mb-3">
              {stats.notStarted}
            </div>
            <p className="text-sm text-gray-600">Not Started Projects</p>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-black text-white rounded-full flex items-center justify-center text-2xl font-bold mb-3">
              {stats.completed}
            </div>
            <p className="text-sm text-gray-600">Completed Projects</p>
          </div>

          <div>
            <button
              onClick={handleProjectCreate}
              className="gap-3 px-4 py-3 flex flex-row items-center justify-center bg-black text-white rounded-xl hover:bg-gray-900 transition text-sm font-semibold"
            >
              <MdAdd className="w-5 h-5" /> Add New Project
            </button>
          </div>
        </div>

        <div className="max-w-full mx-auto">
          {/* Search and Filters - Exactly same as reference */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex items-center gap-4 flex-1">
                <div className="relative flex-1 max-w-2xl">
                  <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search projects..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black outline-none text-base transition"
                  />
                </div>
                <button
                  onClick={() => setFiltersOpen(!filtersOpen)}
                  className="flex items-center gap-3 px-5 py-4 border border-gray-300 rounded-xl hover:bg-gray-50 transition text-sm font-semibold whitespace-nowrap"
                >
                  <MdFilterList className="w-5 h-5" />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="ml-2 bg-black text-white text-xs font-medium rounded-full w-6 h-6 flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                  <MdKeyboardArrowDown
                    className={`w-5 h-5 transition-transform ${
                      filtersOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setIsPinnedModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-3 border border-black hover:bg-gray-100 text-black rounded-lg transition text-sm font-medium"
                >
                  <MdPushPin className="w-5 h-5" />
                  Pinned Project
                </button>
                <button
                  onClick={handleClick}
                  className="px-4 py-3 border border-black text-black hover:bg-gray-100 rounded-lg transition text-sm font-medium"
                >
                  View Archive
                </button>
                <button
                  onClick={handleProjectTemplate}
                  className="px-4 py-3 border border-black text-black rounded-lg hover:bg-gray-100 transition text-sm font-medium"
                >
                  Project Templates
                </button>
                <button className="flex items-center gap-2 px-5 py-4 border border-gray-300 rounded-xl hover:bg-gray-100 transition text-sm font-semibold">
                  <MdDownload className="w-5 h-5" /> Export
                </button>
              </div>
            </div>
          </div>

          {/* Filters Panel - Identical */}
          <AnimatePresence>
            {filtersOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden mb-6"
              >
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-medium text-gray-900">
                      Advanced Filters
                    </h3>
                    <button
                      onClick={() => setFiltersOpen(false)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition"
                    >
                      <MdClose className="w-6 h-6 text-gray-600" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Project Status
                      </label>
                      <select
                        value={filters.projectStatus}
                        onChange={(e) =>
                          handleFilterChange("projectStatus", e.target.value)
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black outline-none"
                      >
                        <option value="">All</option>
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                        <option value="overdue">Overdue</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Client Name
                      </label>
                      <select
                        value={filters.clientName}
                        onChange={(e) =>
                          handleFilterChange("clientName", e.target.value)
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black outline-none"
                      >
                        <option value="">All</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Project Category
                      </label>
                      <select
                        value={filters.projectCategory}
                        onChange={(e) =>
                          handleFilterChange("projectCategory", e.target.value)
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black outline-none"
                      >
                        <option value="">All</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Department
                      </label>
                      <select
                        value={filters.department}
                        onChange={(e) =>
                          handleFilterChange("department", e.target.value)
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black outline-none"
                      >
                        <option value="">All</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Project Member
                      </label>
                      <select
                        value={filters.projectMember}
                        onChange={(e) =>
                          handleFilterChange("projectMember", e.target.value)
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black outline-none"
                      >
                        <option value="">All</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-4 mt-8 pt-6 border-t border-gray-200">
                    <button className="px-6 py-3.5 bg-black text-white font-semibold rounded-xl hover:bg-gray-900 transition">
                      Apply Filters
                    </button>
                    <button
                      onClick={resetFilters}
                      className="px-6 py-3.5 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition"
                    >
                      Reset All Filters
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pinned Modal - Identical */}
          <AnimatePresence>
            {isPinnedModalOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsPinnedModalOpen(false)}
                className="fixed inset-0 bg-white/30 backdrop-blur-md z-50 flex items-start justify-center p-4 pt-20"
              >
                <motion.div
                  initial={{ x: 300, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 300, opacity: 0 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
                >
                  <div className="bg-black text-white px-6 py-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Pinned Project</h3>
                    <button
                      onClick={() => setIsPinnedModalOpen(false)}
                      className="text-white hover:bg-blue-600 rounded-lg p-2 transition"
                    >
                      <MdClose className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="p-6">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="border-b border-gray-200">
                          <tr>
                            <th className="text-left text-sm font-medium text-gray-600 pb-3">
                              #
                            </th>
                            <th className="text-left text-sm font-medium text-gray-600 pb-3">
                              PROJECT
                            </th>
                            <th className="text-right text-sm font-medium text-gray-600 pb-3">
                              ACTION
                            </th>
                          </tr>
                        </thead>
                       <tbody>
  {pinnedProjects.length > 0 ? (
    pinnedProjects.map((project, index) => (
      <tr key={project.id}>
        <td className="text-left text-sm font-medium text-gray-600 py-3">
          {index + 1}
        </td>
        <td className="text-left text-sm text-gray-900 py-3">
          {project.name}
        </td>
        <td className="text-right py-3">
          <button
            onClick={() => handlePinProject(project)} // optional: unpin logic later
            className="text-gray-500 hover:text-red-600"
          >
            <MdPushPin className="w-5 h-5 rotate-45" /> {/* rotated to indicate unpin */}
          </button>
        </td>
      </tr>
    ))
  ) : (
    <tr>
      <td colSpan="3" className="text-center py-12 text-gray-500">
        No pinned projects yet
      </td>
    </tr>
  )}
</tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Table - Structure same, but shows "Project list will be rendered here" when empty */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">Show</span>
                <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option>50</option>
                  <option>100</option>
                </select>
                <span className="text-sm text-gray-600">entries</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Project Name
                    </th>
                    <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Members
                    </th>
                    <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Deadline
                    </th>
                    <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Completions
                    </th>
                    <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-5 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                  {filteredProjects.length > 0 ? (
                    filteredProjects.map((project, index) => (
                      <tr key={project.id || index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {project.name}
                        </td>

                        {/* MEMBERS COLUMN - Updated with Avatars + Hover Tooltip */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center -space-x-2 relative group">
                            {/* Show up to 4 members */}
                            {project.members?.slice(0, 4).map((member, i) => (
                              <div
                                key={member.id}
                                className="w-8 h-8 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-700 shadow-sm"
                                title={member.name || member.email}
                              >
                                {member.name
                                  ? member.name.charAt(0).toUpperCase()
                                  : "?"}
                              </div>
                            ))}

                            {/* Show "+X" if more than 4 members */}
                            {project.members && project.members.length > 4 && (
                              <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-600">
                                +{project.members.length - 4}
                              </div>
                            )}

                            {/* Hover Tooltip - Shows all members */}
                            {project.members && project.members.length > 0 && (
                              <div className="absolute left-0 top-full mt-2 w-64 bg-white shadow-lg rounded-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                                <div className="p-4">
                                  <p className="text-sm font-semibold text-gray-900 mb-2">
                                    Project Members ({project.members.length})
                                  </p>
                                  <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {project.members.map((member) => (
                                      <div
                                        key={member.id}
                                        className="flex items-center gap-3"
                                      >
                                        <div className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center text-xs font-medium text-gray-700">
                                          {member.name
                                            ? member.name
                                                .charAt(0)
                                                .toUpperCase()
                                            : "?"}
                                        </div>
                                        <div className="text-sm">
                                          <p className="font-medium text-gray-900">
                                            {member.name || "Unnamed"}
                                          </p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Fallback if no members */}
                            {(!project.members ||
                              project.members.length === 0) && (
                              <span className="text-sm text-gray-500">
                                No members
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {project.deadline
                            ? new Date(project.deadline).toLocaleDateString(
                                "en-GB"
                              )
                            : "No deadline"}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          Progress <span className="text-gray-900">0%</span>
                          <div className="text-xs text-red-600 mt-1">
                            Loss : ₹0
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={
                              project.status?.id || project.status_id || ""
                            }
                            onChange={(e) =>
                              handleStatusChange(project.id, e.target.value)
                            }
                            className="text-xs font-medium px-4 py-2 rounded-full border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-black cursor-pointer min-w-32"
                          >
                            {statuses.length > 0 ? (
                              statuses.map((status) => (
                                <option key={status.id} value={status.id}>
                                  {status.name}
                                </option>
                              ))
                            ) : (
                              <>
                                <option value="">Loading...</option>
                              </>
                            )}
                          </select>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                         <ActionsDropdown
  project={project}
  onEdit={() => navigate(`/operations/projects/projectedit/${project.id}`)}
  onArchive={() => handleDeleteProject(project.id)}
  onPin={() => handlePinProject(project)}
/>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="7"
                        className="text-center py-20 text-gray-500"
                      >
                        Project list will be rendered here
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </LayoutComponents>
    </div>
  );
};

export default ProjectsView;
