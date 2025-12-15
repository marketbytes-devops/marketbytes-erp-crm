import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MdFilterList, MdClose, MdKeyboardArrowDown, MdDownload, MdAdd, MdPushPin } from "react-icons/md";
import { FiSearch } from "react-icons/fi";
import LayoutComponents from "../../../components/LayoutComponents"; 
import { useNavigate } from "react-router";
const ProjectsView = () => {
  const navigate =useNavigate();
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

  const activeFilterCount = Object.values(filters).filter(v => v !== "").length;

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
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
const handleProjectCreate =() =>{
  navigate("/hr/projects/projectcreate");}
const handleProjectTemplate =() =>{
  navigate("/hr/projects/projecttemplate");
}  

  return (
    <div className="p-6">
      <LayoutComponents title="Projects" subtitle="18 Total">
      <div className="  bg-white flex flex-row justify-between  rounded-2xl shadow-sm p-8 mb-8">
      <div className="flex flex-col items-center">
      <div className="w-20 h-20 bg-black text-white rounded-full flex items-center justify-center text-2xl font-bold mb-3">18</div>
      <p className="text-sm text-gray-600">Total Projects</p>
      </div>
        <div className="flex flex-col items-center">
      <div className="w-20 h-20 bg-black text-white rounded-full flex items-center justify-center text-2xl font-bold mb-3">13</div>
      <p className="text-sm text-gray-600">Overdue Projects</p>
      </div>
        <div className="flex flex-col items-center">
      <div className="w-20 h-20 bg-black text-white rounded-full flex items-center justify-center text-2xl font-bold mb-3">16</div>
      <p className="text-sm text-gray-600">Not Started Projects</p>
      </div>
        <div className="flex flex-col items-center">

      <div className="w-20 h-20 bg-black text-white rounded-full flex items-center justify-center text-2xl font-bold mb-3">0</div>
      <p className="text-sm text-gray-600">Completed Projects</p>
      </div>
        <div className="f">
      <button onClick={handleProjectCreate} className=" gap-3 px-4 py-3 flex flex-row items-center justify-center bg-black text-white rounded-xl hover:bg-gray-900 transition text-sm font-semibold">
      <MdAdd className="w-5  h-5" /> Add New Project
      </button>
      </div>
       </div>
              
          


        <div className="max-w-full mx-auto">
          
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex items-center gap-4 flex-1">
                {/* Search Bar */}
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

                {/* Filters Button */}
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
                
              </div>
                   
              {/* Action Buttons  */}
              <div className="flex flex-wrap items-center gap-3">
                
                <button onClick={() => setIsPinnedModalOpen(true)} className="flex items-center gap-2 px-4 py-3 border border-teal-500 text-teal-600 rounded-lg hover:bg-teal-50 transition text-sm font-medium">
                  <MdPushPin className="w-5 h-5" />
                  Pinned Project
                </button>
                <button className="px-4 py-3 border border-orange-300 text-orange-700 rounded-lg hover:bg-orange-50 transition text-sm font-medium">
                  View Archive
                </button>
                <button onClick={handleProjectTemplate } className="px-4 py-3 border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 transition text-sm font-medium">
                  Project Templates
                </button>
                 <button className="flex items-center gap-2 px-5 py-4 border border-gray-300 rounded-xl hover:bg-gray-50 transition text-sm font-semibold">
                  <MdDownload className="w-5 h-5" /> Export
                </button>
               
               
               
              </div>
            </div>
          </div>

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
                    <h3 className="text-xl font-medium text-gray-900">Advanced Filters</h3>
                    <button
                      onClick={() => setFiltersOpen(false)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition"
                    >
                      <MdClose className="w-6 h-6 text-gray-600" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Project Status</label>
                      <select
                        value={filters.projectStatus}
                        onChange={(e) => handleFilterChange("projectStatus", e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black outline-none"
                      >
                        <option value="">All</option>
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                        <option value="overdue">Overdue</option>
                        {/* Add more as needed */}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Client Name</label>
                      <select
                        value={filters.clientName}
                        onChange={(e) => handleFilterChange("clientName", e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black outline-none"
                      >
                        <option value="">All</option>
                        {/* Populate dynamically */}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Project Category</label>
                      <select
                        value={filters.projectCategory}
                        onChange={(e) => handleFilterChange("projectCategory", e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black outline-none"
                      >
                        <option value="">All</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                      <select
                        value={filters.department}
                        onChange={(e) => handleFilterChange("department", e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black outline-none"
                      >
                        <option value="">All</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Project Member</label>
                      <select
                        value={filters.projectMember}
                        onChange={(e) => handleFilterChange("projectMember", e.target.value)}
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
          {/* Pinned Project Modal */}
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
        {/* Header */}
        <div className="bg-black text-white px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Pinned Project</h3>
          <button
            onClick={() => setIsPinnedModalOpen(false)}
            className="text-white hover:bg-blue-600 rounded-lg p-2 transition"
          >
            <MdClose className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200">
                <tr>
                  <th className="text-left text-sm font-medium text-gray-600 pb-3">#</th>
                  <th className="text-left text-sm font-medium text-gray-600 pb-3">PROJECT</th>
                  <th className="text-right text-sm font-medium text-gray-600 pb-3">ACTION</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan="3" className="text-center py-12 text-gray-500">
                    No pinned item found
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>

          {/* Table Placeholder */}
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
              <div className="text-sm text-gray-600">
                {/* Search inside table if needed */}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">#</th>
                    <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Project Name</th>
                    <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Members</th>
                    <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Deadline</th>
                    <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Completions</th>
                    <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-5 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td colSpan="7" className="text-center py-20 text-gray-500">
                      Project list will be rendered here
                    </td>
                  </tr>
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