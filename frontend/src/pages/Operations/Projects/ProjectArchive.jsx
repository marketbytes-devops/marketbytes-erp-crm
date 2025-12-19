import { useEffect, useState } from "react";
import LayoutComponents from "../../../components/LayoutComponents"; 
import apiClient from "../../../helpers/apiClient";
import toast from "react-hot-toast";

const ProjectsPage = () => {
  const [projects, setProjects] = useState([]);
const [loading, setLoading] = useState(true);
const [showEntries, setShowEntries] = useState(10);
const [search, setSearch] = useState("");

useEffect(() => {
  const fetchArchivedProjects = async () => {
    try {
      setLoading(true);
      // This endpoint returns only inactive (archived) projects
      const response = await apiClient.get("/operation/projects/inactive/");
      setProjects(response.data);
    } catch (error) {
      console.error("Error fetching archived projects:", error);
      toast.error("Failed to load archived projects");
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  fetchArchivedProjects();
}, []);



    return (
      <div className="p-6">
      <LayoutComponents
        title="Add Project From Template"
        subtitle="Fill in the details to create a new project from template"
        variant="card"
      >

    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Archived Projects Badge */}
      <div className="bg-gray-100 px-6 py-4 flex items-center gap-3">
       <div className="w-12 h-12 bg-gray-600 text-white rounded-full flex items-center justify-center text-lg font-semibold">
  {projects.length}
</div>
<span className="text-gray-700 font-medium">Total Archived Projects</span>
      </div>

      {/* Controls: Show entries + Search */}
      <div className="px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200">
        <div className="flex items-center gap-3 text-gray-700">
          <span>Show</span>
          <select
            value={showEntries}
            onChange={(e) => setShowEntries(Number(e.target.value))}
            className="border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
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
            className="flex-1 sm:flex-initial px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            placeholder=""
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
            <tr>
              <th className="px-6 py-4 text-left">Project ID</th>
              <th className="px-6 py-4 text-left">Project Name</th>
              <th className="px-6 py-4 text-left">Project Members</th>
              <th className="px-6 py-4 text-left">Deadline</th>
              <th className="px-6 py-4 text-left">Client</th>
              <th className="px-6 py-4 text-left">Completion</th>
              <th className="px-6 py-4 text-left">Action</th>
            </tr>
          </thead>
         <tbody>
  {loading ? (
    <tr>
      <td colSpan={7} className="text-center py-12 text-gray-500">
        Loading archived projects...
      </td>
    </tr>
  ) : projects.length > 0 ? (
    projects
      .filter((project) =>
        project.name?.toLowerCase().includes(search.toLowerCase())
      )
      .slice(0, showEntries)
      .map((project, index) => (
        <tr key={project.id}>
          <td className="px-6 py-4">{project.id}</td>
          <td className="px-6 py-4">{project.name}</td>
          <td className="px-6 py-4">
            {project.members?.length > 0
              ? project.members.map((m) => m.name || m.username).join(", ")
              : "No members"}
          </td>
          <td className="px-6 py-4">
            {project.deadline
              ? new Date(project.deadline).toLocaleDateString("en-GB")
              : "No deadline"}
          </td>
          <td className="px-6 py-4">{project.client?.name || "-"}</td>
          <td className="px-6 py-4">0%</td>
          <td className="px-6 py-4">
            <button
              onClick={() => handleRestore(project.id)}
              className="text-green-600 hover:text-green-800 font-medium"
            >
              Restore
            </button>
          </td>
        </tr>
      ))
  ) : (
    <tr>
      <td colSpan={7} className="text-center py-12 text-gray-500">
        No archived projects found
      </td>
    </tr>
  )}
</tbody>
        </table>
      </div>

      {/* Footer: Showing entries + Pagination */}
      <div className="px-6 py-4 flex flex-col sm:flex-row justify-between items-center text-sm text-gray-600 border-t border-gray-200">
        <div>Showing 0 to 0 of 0 entries</div>
        <div className="flex gap-2 mt-3 sm:mt-0">
          <button disabled className="px-4 py-2 border border-gray-300 rounded bg-gray-100 text-gray-500 cursor-not-allowed">
            Previous
          </button>
          <button disabled className="px-4 py-2 border border-gray-300 rounded bg-gray-100 text-gray-500 cursor-not-allowed">
            Next
          </button>
        </div>
      </div>
    </div>
          </LayoutComponents>
          </div>
)

 
};

export default ProjectsPage;