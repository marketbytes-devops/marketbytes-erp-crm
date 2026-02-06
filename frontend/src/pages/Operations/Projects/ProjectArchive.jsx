import { useEffect, useState } from "react";
import { MdArrowBack, MdDownload, MdRestoreFromTrash } from "react-icons/md";
import { FiSearch } from "react-icons/fi";
import LayoutComponents from "../../../components/LayoutComponents";
import apiClient from "../../../helpers/apiClient";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

const ProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchArchivedProjects = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get("/operation/projects/inactive/");
        setProjects(response.data || []);
        setFiltered(response.data || []);
      } catch (error) {
        toast.error("Failed to load archived projects");
        setProjects([]);
        setFiltered([]);
      } finally {
        setLoading(false);
      }
    };
    fetchArchivedProjects();
  }, []);

  useEffect(() => {
    const term = search.toLowerCase();
    setFiltered(
      projects.filter(
        (p) =>
          p.name?.toLowerCase().includes(term) ||
          p.client?.name?.toLowerCase().includes(term)
      )
    );
  }, [search, projects]);

  const handleRestore = async (id) => {
    if (!window.confirm("Restore this project? It will return to active projects.")) return;
    try {
      await apiClient.patch(`/operation/projects/${id}/`, { is_archived: false });
      setProjects((prev) => prev.filter((p) => p.id !== id));
      setFiltered((prev) => prev.filter((p) => p.id !== id));
      toast.success("Project restored successfully");
    } catch (error) {
      toast.error("Failed to restore project");
    }
  };

  const renderAvatars = (members = []) => {
    const count = members.length;
    if (count === 0) return <span className="text-sm text-gray-500">—</span>;

    return (
      <div className="flex -space-x-2">
        {members.slice(0, 3).map((m, i) => {
          const name = m.name || m.username || "Unknown";
          const initial = name[0]?.toUpperCase() || "?";
          return (
            <div key={m.id || i} className="relative group">
              <div className="w-8 h-8 rounded-full bg-linear-to-br from-blue-500 to-purple-600 border-2 border-white flex items-center justify-center text-white text-xs font-medium shadow-md">
                {initial}
              </div>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-black text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                {name}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-black"></div>
              </div>
            </div>
          );
        })}
        {count > 3 && (
          <div className="w-8 h-8 rounded-full bg-gray-600 border-2 border-white flex items-center justify-center text-white text-xs font-medium shadow-md">
            +{count - 3}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <LayoutComponents title="Archived Projects" subtitle="View and restore archived projects" variant="card">
        <div className="mb-8">
          <Link
            to="/operations/projects"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
          >
            <MdArrowBack className="w-5 h-5" />
            Back to Projects
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-2xl">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by project name or client..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black outline-none text-base transition"
                />
              </div>
              <span className="text-sm font-medium text-gray-600 hidden lg:block">
                {filtered.length} {filtered.length === 1 ? "project" : "projects"}
              </span>
            </div>
            <div className="flex gap-3">
              <button className="flex items-center gap-2 px-5 py-4 border border-gray-300 rounded-xl hover:bg-gray-50 transition text-sm font-medium">
                <MdDownload className="w-5 h-5" /> Export
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">ID</th>
                  <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">Project</th>
                  <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">Members</th>
                  <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">Deadline</th>
                  <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">Client</th>
                  <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">Completion</th>
                  <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-24 text-gray-500">
                      Loading archived projects...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-24">
                      <div className="flex flex-col items-center">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-5">
                          <MdRestoreFromTrash className="w-10 h-10 text-gray-400" />
                        </div>
                        <p className="text-xl font-medium text-gray-700">No archived projects found</p>
                        <p className="text-gray-500 mt-2">All projects are currently active</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((project, i) => (
                    <tr key={project.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-5 text-sm font-medium text-gray-900 whitespace-nowrap">
                        {project.id}
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div>
                          <div className="font-medium text-gray-900">{project.name}</div>
                          {project.summary && <p className="text-sm text-gray-500 mt-1">{project.summary}</p>}
                        </div>
                      </td>
                      <td className="px-6 py-5">{renderAvatars(project.members || [])}</td>
                      <td className="px-6 py-5 text-sm text-gray-700 whitespace-nowrap">
                        {project.deadline
                          ? new Date(project.deadline).toLocaleDateString("en-GB")
                          : "No deadline"}
                      </td>
                      <td className="px-6 py-5 text-sm text-gray-700 whitespace-nowrap">
                        {project.client?.name || "—"}
                      </td>
                      <td className="px-6 py-5 text-sm font-medium text-gray-900">
                        0%
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <button
                          onClick={() => handleRestore(project.id)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium text-sm"
                        >
                          <MdRestoreFromTrash className="w-4 h-4" />
                          Restore
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {filtered.length > 0 && (
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-3 text-sm text-gray-600">
              <span>Showing {filtered.length} archived {filtered.length === 1 ? "project" : "projects"}</span>
            </div>
          )}
        </div>
      </LayoutComponents>
    </div>
  );
};

export default ProjectsPage;