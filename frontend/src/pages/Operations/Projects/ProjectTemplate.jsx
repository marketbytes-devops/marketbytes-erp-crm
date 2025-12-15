import { useState } from "react";
import { FiSearch } from "react-icons/fi";
import { MdEdit, MdVisibility, MdDelete } from "react-icons/md";
import LayoutComponents from "../../../components/LayoutComponents";

const ProjectTemplatesView = () => {
  const [entries, setEntries] = useState(10);
  const [search, setSearch] = useState("");

  // Mock data exactly as in screenshot
  const templates = [
    {
      id: 1,
      name: "Cms",
      membersMessage: "No member added to this project.",
      category: "-",
    },
  ];

  return (
     <div classname="p-6">
      <LayoutComponents title="Project Template" variant="table">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
       
    
            <button className="px-6 py-3 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition font-medium flex items-center gap-2">
              Add New Template
              <span className="text-xl font-bold">+</span>
            </button>
          
          {/* Show Entries + Search */}
          <div className="px-8 py-5 bg-gray-100 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <span>Show</span>
              <select
                value={entries}
                onChange={(e) => setEntries(e.target.value)}
                className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none"
              >
                <option>10</option>
                <option>25</option>
                <option>50</option>
                <option>100</option>
              </select>
              <span>entries</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-700">Search:</span>
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-4 pr-10 py-2 border border-gray-300 rounded-lg w-72 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder=""
                />
                <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-8 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Template Name
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Template Members
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {templates.map((template) => (
                  <tr key={template.id} className="hover:bg-gray-50">
                    <td className="px-8 py-6 text-sm text-gray-900">{template.id}</td>
                    <td className="px-8 py-6 text-sm text-blue-600 font-medium">
                      {template.name}
                    </td>
                    <td className="px-8 py-6 text-sm text-gray-700">
                      {template.membersMessage}
                      <div className="mt-4">
                        <button className="text-teal-600 text-sm font-medium hover:underline flex items-center gap-1">
                          <span className="text-xl">+</span> Add Template Members
                        </button>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-sm text-gray-700 text-center">
                      {template.category}
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <button className="p-2.5 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition">
                          <MdEdit className="w-4 h-4" />
                        </button>
                        <button className="p-2.5 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition">
                          <MdVisibility className="w-4 h-4" />
                        </button>
                        <button className="p-2.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition">
                          <MdDelete className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer: Showing entries + Pagination */}
          <div className="px-8 py-5 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-sm text-gray-600">
              Showing 1 to 1 of 1 entries
            </div>
            <div className="flex items-center gap-2">
              <button className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50">
                Previous
              </button>
              <button className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg text-sm font-medium">
                1
              </button>
              <button className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-100">
                Next
              </button>
            </div>
          </div>
        </div>
      </LayoutComponents>
   </div>
  );
};

export default ProjectTemplatesView;