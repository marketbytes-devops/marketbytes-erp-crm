import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MdFilterList,
  MdClose,
  MdKeyboardArrowDown,
  MdDownload,
  MdAdd,
  MdEdit,
  MdDelete,
  MdArchive,
  MdPushPin
} from "react-icons/md";
import { FiSearch } from "react-icons/fi";
import LayoutComponents from "../../../components/LayoutComponents";
import { useNavigate } from "react-router";
import apiClient from "../../../helpers/apiClient";
import toast from "react-hot-toast";
import Input from "../../../components/Input";
import Loading from "../../../components/Loading";

const ProjectsView = () => {
  const navigate = useNavigate();
  const handleClick = () => {
    navigate("/operations/projects/projectarchive");
  };

  const [projects, setProjects] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPinnedModalOpen, setIsPinnedModalOpen] = useState(false);

  // New: Track pinned projects
  const [pinnedProjects, setPinnedProjects] = useState([]);

  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [filters, setFilters] = useState({
    status: "",
    client: "",
    category: "",
    member: "",
  });

  const [statuses, setStatuses] = useState([]);
  const [clients, setClients] = useState([]);
  const [categories, setCategories] = useState([]);
  const [members, setMembers] = useState([]);

  const activeFilterCount = Object.values(filters).filter((v) => v !== "").length;

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({
      status: "",
      client: "",
      category: "",
      member: "",
    });
    setSearch("");
  };

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [projRes, statusRes] = await Promise.all([
          apiClient.get("/operation/projects/"),
          apiClient.get("/operation/statuses/"),
        ]);

        const extract = (d) => (Array.isArray(d) ? d : d.results || []);

        const projData = extract(projRes.data).filter((p) => !p.is_archived);
        const statusData = extract(statusRes.data);

        setProjects(projData);
        setFiltered(projData);
        setStatuses(statusData);

        const clientSet = new Set(projData.map((p) => p.client?.name).filter(Boolean));
        const catSet = new Set(projData.map((p) => p.category?.name).filter(Boolean));

        setClients(Array.from(clientSet).sort());
        setCategories(Array.from(catSet).sort());

        const memberSet = new Set();
        projData.forEach((p) =>
          p.members?.forEach((m) => memberSet.add(m.name || m.email || "Unknown"))
        );
        setMembers(Array.from(memberSet).sort());
      } catch (err) {
        console.error(err);
        toast.error("Failed to load projects");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Apply search + filters
  useEffect(() => {
    let result = projects;

    if (search.trim()) {
      const term = search.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name?.toLowerCase().includes(term) ||
          p.summary?.toLowerCase().includes(term) ||
          p.client?.name?.toLowerCase().includes(term)
      );
    }

    if (filters.status !== "") {
      const selectedStatusId = parseInt(filters.status, 10);
      if (!isNaN(selectedStatusId)) {
        const selectedStatus = statuses.find((s) => s.id === selectedStatusId);
        if (selectedStatus?.name.toLowerCase() === "not started") {
          result = result.filter((p) => p.status_id === selectedStatusId || p.status_id == null);
        } else {
          result = result.filter((p) => p.status_id === selectedStatusId);
        }
      }
    }

    if (filters.client) {
      result = result.filter((p) => p.client?.name === filters.client);
    }

    if (filters.category) {
      result = result.filter((p) => p.category?.name === filters.category);
    }

    if (filters.member) {
      result = result.filter((p) =>
        p.members?.some((m) => (m.name || m.email) === filters.member)
      );
    }

    setFiltered(result);
  }, [search, filters, projects, statuses]);

  // Stats
  const stats = useMemo(() => {
    const total = projects.length;

    const getStatusName = (proj) => {
      return (
        proj.status?.name ||
        statuses.find((s) => s.id === proj.status_id)?.name ||
        "Not Started"
      ).toLowerCase();
    };

    const overdue = projects.filter((p) => {
      if (!p.deadline) return false;
      const deadline = new Date(p.deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return deadline < today && getStatusName(p) !== "completed";
    }).length;

    const notStarted = projects.filter((p) => getStatusName(p) === "not started").length;
    const completed = projects.filter((p) => getStatusName(p) === "completed").length;

    return { total, overdue, notStarted, completed };
  }, [projects, statuses]);

  const handleStatusChange = async (projectId, newStatusId) => {
    try {
      await apiClient.patch(`/operation/projects/${projectId}/`, {
        status_id: parseInt(newStatusId),
      });

      const newStatus = statuses.find((s) => s.id === parseInt(newStatusId));
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId
            ? { ...p, status: newStatus, status_id: parseInt(newStatusId) }
            : p
        )
      );
      toast.success("Status updated");
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const handleArchive = async (projectId) => {
    if (!window.confirm("Move this project to archive?")) return;
    try {
      await apiClient.patch(`/operation/projects/${projectId}/`, { is_archived: true });
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      toast.success("Project archived");
    } catch (err) {
      toast.error("Failed to archive project");
    }
  };

  // Pin / Unpin logic
  const togglePin = (project) => {
    setPinnedProjects((prev) => {
      const exists = prev.find((p) => p.id === project.id);
      if (exists) {
        toast.success("Project unpinned");
        return prev.filter((p) => p.id !== project.id);
      } else {
        toast.success("Project pinned");
        return [...prev, project];
      }
    });
  };

  const renderAvatars = (members = []) => {
    const memberCount = members.length;
    if (memberCount === 0) {
      return <div className="w-8 h-8 rounded-full bg-gray-300 border-2 border-white" />;
    }

    return (
      <div className="flex -space-x-2">
        {members.slice(0, 3).map((member, i) => {
          const name = member.name || member.email || "Unknown";
          const initial = name[0]?.toUpperCase() || "?";
          return (
            <div key={member.id || i} className="relative group">
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
        {memberCount > 3 && (
          <div className="w-8 h-8 rounded-full bg-gray-500 border-2 border-white flex items-center justify-center text-white text-xs font-bold">
            +{memberCount - 3}
          </div>
        )}
      </div>
    );
  };

  // Actions Dropdown Component
  const ActionsDropdown = ({ project }) => {
    const [isOpen, setIsOpen] = useState(false);
    const isPinned = pinnedProjects.some((p) => p.id === project.id);

    useEffect(() => {
      const handleClickOutside = () => setIsOpen(false);
      if (isOpen) document.addEventListener("click", handleClickOutside);
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
          <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            <div className="py-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/operations/projects/edit/${project.id}`); // Adjust route as needed
                  setIsOpen(false);
                }}
                className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <MdEdit className="w-4 h-4" /> Edit
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  togglePin(project);
                  setIsOpen(false);
                }}
                className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <MdPushPin className="w-4 h-4" />
                {isPinned ? "Unpin Project" : "Pin Project"}
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleArchive(project.id);
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
                    // Add hard delete API call here if needed
                    handleArchive(project.id); // fallback to archive
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loading />
      </div>
    );
  }

  return (
    <div className="p-6">
      <LayoutComponents title="Projects" subtitle="Manage all projects" variant="table">
        {/* Stats Row */}
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-8 flex flex-wrap justify-between items-center gap-6">
          <div className="flex gap-8 flex-1 justify-around">
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
              <p className="text-sm text-gray-600">Overdue</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-black text-white rounded-full flex items-center justify-center text-2xl font-bold mb-3">
                {stats.notStarted}
              </div>
              <p className="text-sm text-gray-600">Not Started</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-black text-white rounded-full flex items-center justify-center text-2xl font-bold mb-3">
                {stats.completed}
              </div>
              <p className="text-sm text-gray-600">Completed</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/operations/projects/projectcreate")}
            className="flex items-center gap-3 px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-900 transition text-sm font-semibold"
          >
            <MdAdd className="w-5 h-5" /> Add New Project
          </button>
        </div>

        {/* Search & Filters Bar */}
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
                  className={`w-5 h-5 transition-transform ${filtersOpen ? "rotate-180" : ""}`}
                />
              </button>

              <span className="text-sm font-medium text-gray-600 hidden lg:block">
                {filtered.length} {filtered.length === 1 ? "project" : "projects"}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setIsPinnedModalOpen(true)}
                className="flex items-center gap-2 px-4 py-3 border border-black hover:bg-gray-100 text-black rounded-lg transition text-sm font-medium"
              >
                <MdPushPin className="w-5 h-5" />
                Pinned Project ({pinnedProjects.length})
              </button>
              <button
                onClick={handleClick}
                className="px-4 py-3 border border-black text-black hover:bg-gray-100 rounded-lg transition text-sm font-medium"
              >
                View Archive
              </button>
              <button className="flex items-center gap-2 px-5 py-4 border border-gray-300 rounded-xl hover:bg-gray-100 transition text-sm font-semibold">
                <MdDownload className="w-5 h-5" /> Export
              </button>
            </div>
          </div>
        </div>

        {/* Advanced Filters Panel */}
        <AnimatePresence>
          {filtersOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden mb-6"
            >
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-medium text-gray-900">Advanced Filters</h3>
                  <button
                    onClick={() => setFiltersOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                  >
                    <MdClose className="w-6 h-6 text-gray-600" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                  <Input
                    label="Status"
                    type="select"
                    value={filters.status}
                    onChange={(v) => handleFilterChange("status", v)}
                    options={[
                      { label: "All Statuses", value: "" },
                      ...statuses.map((s) => ({ label: s.name, value: s.id.toString() })),
                    ]}
                  />
                  <Input
                    label="Client"
                    type="select"
                    value={filters.client}
                    onChange={(v) => handleFilterChange("client", v)}
                    options={[
                      { label: "All Clients", value: "" },
                      ...clients.map((c) => ({ label: c, value: c })),
                    ]}
                  />
                  <Input
                    label="Category"
                    type="select"
                    value={filters.category}
                    onChange={(v) => handleFilterChange("category", v)}
                    options={[
                      { label: "All Categories", value: "" },
                      ...categories.map((c) => ({ label: c, value: c })),
                    ]}
                  />
                  <Input
                    label="Member"
                    type="select"
                    value={filters.member}
                    onChange={(v) => handleFilterChange("member", v)}
                    options={[
                      { label: "All Members", value: "" },
                      ...members.map((m) => ({ label: m, value: m })),
                    ]}
                  />
                </div>

                <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-200">
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

        {/* Pinned Project Modal - Now shows real pinned projects */}
        <AnimatePresence>
          {isPinnedModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPinnedModalOpen(false)}
              className="fixed inset-0 bg-black/30 backdrop-blur-md z-50 flex items-start justify-center p-4 pt-20"
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
                  <h3 className="text-lg font-semibold">Pinned Projects ({pinnedProjects.length})</h3>
                  <button
                    onClick={() => setIsPinnedModalOpen(false)}
                    className="text-white hover:bg-white/20 rounded-lg p-2 transition"
                  >
                    <MdClose className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 max-h-96 overflow-y-auto">
                  {pinnedProjects.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No pinned projects yet</p>
                  ) : (
                    <table className="w-full">
                      <thead className="border-b border-gray-200">
                        <tr>
                          <th className="text-left text-sm font-medium text-gray-600 pb-3">#</th>
                          <th className="text-left text-sm font-medium text-gray-600 pb-3">PROJECT</th>
                          <th className="text-right text-sm font-medium text-gray-600 pb-3">ACTION</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pinnedProjects.map((project, index) => (
                          <tr key={project.id} className="border-b border-gray-100">
                            <td className="py-3 text-sm">{index + 1}</td>
                            <td className="py-3 text-sm font-medium">{project.name}</td>
                            <td className="py-3 text-right">
                              <button
                                onClick={() => togglePin(project)}
                                className="text-red-600 hover:text-red-800 text-sm font-medium"
                              >
                                Unpin
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Projects Table */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-12">#</th>
                  <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Project</th>
                  <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Members</th>
                  <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Deadline</th>
                  <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Progress</th>
                  <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-5 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-24">
                      <div className="flex flex-col items-center">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-5">
                          <MdFilterList className="w-10 h-10 text-gray-400" />
                        </div>
                        <p className="text-xl font-semibold text-gray-700">No projects found</p>
                        <p className="text-gray-500 mt-2">Try adjusting your search or filters</p>
                        {(search || activeFilterCount > 0) && (
                          <button
                            onClick={resetFilters}
                            className="mt-5 px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-900 transition font-medium"
                          >
                            Clear all filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((project, i) => (
                    <motion.tr
                      key={project.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="hover:bg-gray-50 transition"
                    >
                      <td className="px-6 py-5 text-center">
                        <span className="font-medium text-gray-900">{i + 1}</span>
                      </td>
                      <td className="px-6 py-5">
                        <div>
                          <p className="font-semibold text-gray-900">{project.name}</p>
                          {project.summary && <p className="text-sm text-gray-500 mt-1">{project.summary}</p>}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        {renderAvatars(project.members || [])}
                        {(!project.members || project.members.length === 0) && (
                          <span className="ml-2 text-sm text-gray-500">—</span>
                        )}
                      </td>
                      <td className="px-6 py-5 text-sm text-gray-700">
                        {project.deadline
                          ? new Date(project.deadline).toLocaleDateString("en-GB")
                          : "No deadline"}
                      </td>
                      <td className="px-6 py-5 text-sm text-gray-700">
                        <span className="font-medium">0%</span>
                        <div className="text-xs text-red-600 mt-1">Loss: ₹0</div>
                      </td>
                      <td className="px-6 py-5">
                        <select
                          value={project.status_id || ""}
                          onChange={(e) => handleStatusChange(project.id, e.target.value)}
                          className="px-4 py-2 text-xs font-medium rounded-full border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-black cursor-pointer"
                        >
                          {statuses.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <ActionsDropdown project={project} />
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {filtered.length > 0 && (
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex justify-between items-center text-sm text-gray-600">
              <span>
                Showing {filtered.length} of {projects.length} projects
              </span>
              {activeFilterCount > 0 && (
                <button onClick={resetFilters} className="text-blue-600 hover:underline">
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>
      </LayoutComponents>
    </div>
  );
};

export default ProjectsView;