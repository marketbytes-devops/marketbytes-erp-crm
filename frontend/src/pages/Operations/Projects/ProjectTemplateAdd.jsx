import { useState } from "react";
import { MdArrowBack, MdAdd } from "react-icons/md";
import { Link } from "react-router-dom";
import LayoutComponents from "../../../components/LayoutComponents";
import Input from "../../../components/Input";

const AddProjectFromTemplatePage = () => {
  const [clientManageTasks, setClientManageTasks] = useState(false);
  const [allowManualTimeLogs, setAllowManualTimeLogs] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const categoryModalContent = (
    <div className="space-y-6">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">#</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Category Name</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            <tr>
              <td className="px-6 py-4 text-sm">1</td>
              <td className="px-6 py-4 text-sm font-medium">Graphic Designing</td>
              <td className="px-6 py-4">
                <button className="px-4 py-2 border border-orange-500 text-orange-600 rounded-lg hover:bg-orange-50 transition text-sm font-medium">
                  Remove
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div>
        <label className="block text-sm font-semibold text-black mb-2">
          Add Category Name <span className="text-red-500">*</span>
        </label>
        <Input placeholder="Enter category name" />
      </div>

      <div className="flex justify-end">
        <button className="px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-900 transition font-medium">
          Save
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <LayoutComponents
        title="Add Project From Template"
        subtitle="Create a new project using an existing template"
        variant="card"
      >
        <div className="mb-8">
          <Link
            to="/operations/projects"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
          >
            <MdArrowBack className="w-5 h-5" />
            Back to Projects
          </Link>
        </div>

        <form className="space-y-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Project Details</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Project Name"
                required
                placeholder="Enter project name"
              />

              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  Project Category
                </label>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setIsCategoryModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-3 bg-black text-white rounded-xl hover:bg-gray-900 transition font-medium text-sm"
                  >
                    <MdAdd className="w-5 h-5" />
                    Add Category
                  </button>
                  <Input
                    type="select"
                    options={[
                      { value: "", label: "Select category" },
                      { value: "development", label: "Development" },
                      { value: "design", label: "Design" },
                      { value: "marketing", label: "Marketing" },
                    ]}
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-8">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={clientManageTasks}
                  onChange={(e) => setClientManageTasks(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-400 text-black focus:ring-black"
                />
                <span className="font-medium">Client can manage tasks of this project</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowManualTimeLogs}
                  onChange={(e) => setAllowManualTimeLogs(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-400 text-black focus:ring-black"
                />
                <span className="font-medium">Allow manual time logs</span>
              </label>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Project Summary</h3>
            <div className="border border-gray-300 rounded-xl overflow-hidden">
              <div className="bg-gray-50 p-3 flex flex-wrap gap-2">
                <button type="button" onClick={() => document.execCommand("bold", false)} className="px-3 py-1.5 hover:bg-gray-200 rounded font-bold text-sm">B</button>
                <button type="button" onClick={() => document.execCommand("italic", false)} className="px-3 py-1.5 hover:bg-gray-200 rounded italic text-sm">I</button>
                <button type="button" onClick={() => document.execCommand("underline", false)} className="px-3 py-1.5 hover:bg-gray-200 rounded underline text-sm">U</button>
                <button type="button" onClick={() => document.execCommand("strikeThrough", false)} className="px-3 py-1.5 hover:bg-gray-200 rounded line-through text-sm">S</button>
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      document.execCommand("fontSize", false, e.target.value);
                      e.target.value = "";
                    }
                  }}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded bg-white"
                >
                  <option value="">Font Size</option>
                  <option value="1">10</option>
                  <option value="2">13</option>
                  <option value="3">16</option>
                  <option value="4">18</option>
                  <option value="5">24</option>
                  <option value="6">32</option>
                  <option value="7">48</option>
                </select>
              </div>
              <div
                contentEditable
                className="min-h-[200px] px-4 py-4 focus:outline-none"
                suppressContentEditableWarning
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Internal Note</h3>
            <textarea
              rows={6}
              placeholder="Add any internal notes..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black outline-none resize-none"
            />
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition font-medium"
            >
              Reset
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-900 transition font-medium"
            >
              Create Project
            </button>
          </div>
        </form>
      </LayoutComponents>

      {isCategoryModalOpen && (
        <LayoutComponents
          title="Manage Project Categories"
          variant="modal"
          modal={categoryModalContent}
          onCloseModal={() => setIsCategoryModalOpen(false)}
        />
      )}
    </div>
  );
};

export default AddProjectFromTemplatePage;