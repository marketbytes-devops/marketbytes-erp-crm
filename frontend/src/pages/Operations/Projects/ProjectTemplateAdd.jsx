import React, { useState } from "react";
import LayoutComponents from "../../../components/LayoutComponents";

const AddProjectFromTemplatePage = () => {
  const [clientManageTasks, setClientManageTasks] = useState(false);
  const [allowManualTimeLogs, setAllowManualTimeLogs] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false); // New state
  const categoryModalContent = (
    <div className="p-2">
    
      <div className="overflow-x-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">#</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Category Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            <tr>
              <td className="px-6 py-4">1</td>
              <td className="px-6 py-4">Graphic Designing</td>
              <td className="px-6 py-4">
                <button className="border border-orange-400 text-orange-600 px-4 py-1 rounded-lg hover:bg-orange-50">
                  Remove
                </button>
              </td>
            </tr>
          
          </tbody>
        </table>
      </div>

      {/* Add New Category Input */}
      <div className="mt-8">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Add Category Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          placeholder=""
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>
      <button className=" rounded-md mt-4 px-6 py-3 bg-black text-white">save</button>
    </div>
  );

  return (
    <div className="p-6">
      <LayoutComponents
        title="Add Project From Template"
        subtitle="Fill in the details to create a new project from template"
        variant="card"
      >
        <div className="p-8 max-w-4xl mx-auto space-y-10">
          {/* Project Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder=""
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Project Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project Category
            </label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsCategoryModalOpen(true)}
                className="bg-black hover:bg-black text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
              >
                <span className="text-lg">+</span> Add Project Category
              </button>
              <select className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option>Development</option>
                <option>Design</option>
                <option>Marketing</option>
              </select>
            </div>
          </div>

          {/* Checkboxes */}
          <div className="flex flex-wrap gap-8">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={clientManageTasks}
                onChange={(e) => setClientManageTasks(e.target.checked)}
                className="w-5 h-5 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
              />
              <span className="text-gray-700">Client can manage tasks of this project</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={allowManualTimeLogs}
                onChange={(e) => setAllowManualTimeLogs(e.target.checked)}
                className="w-5 h-5 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
              />
              <span className="text-gray-700">Allow manual time logs?</span>
            </label>
          </div>

          {/* Project Summary (Rich Text Editor - Now Fully Functional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project Summary
            </label>
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              {/* Toolbar */}
              <div className="bg-gray-50 border-b border-gray-300 px-4 py-2 flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => document.execCommand('bold', false)}
                  className="p-2 hover:bg-gray-200 rounded font-bold"
                >
                  B
                </button>
                <button
                  type="button"
                  onClick={() => document.execCommand('italic', false)}
                  className="p-2 hover:bg-gray-200 rounded italic"
                >
                  I
                </button>
                <button
                  type="button"
                  onClick={() => document.execCommand('underline', false)}
                  className="p-2 hover:bg-gray-200 rounded underline"
                >
                  U
                </button>
                <button
                  type="button"
                  onClick={() => document.execCommand('strikeThrough', false)}
                  className="p-2 hover:bg-gray-200 rounded line-through"
                >
                  S
                </button>
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      document.execCommand('fontSize', false, e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="px-3 py-1 text-sm border border-gray-300 rounded"
                >
                  <option value="">15</option>
                  <option value="1">10</option>
                  <option value="2">13</option>
                  <option value="3">16</option>
                  <option value="4">18</option>
                  <option value="5">24</option>
                  <option value="6">32</option>
                  <option value="7">48</option>
                </select>
                <button
                  type="button"
                  onClick={() => document.execCommand('justifyLeft', false)}
                  className="p-2 hover:bg-gray-200 rounded"
                >
                  Align Left
                </button>
                <button
                  type="button"
                  onClick={() => document.execCommand('justifyCenter', false)}
                  className="p-2 hover:bg-gray-200 rounded"
                >
                  Align Center
                </button>
                <button
                  type="button"
                  onClick={() => document.execCommand('justifyRight', false)}
                  className="p-2 hover:bg-gray-200 rounded"
                >
                  Align Right
                </button>
                <button
                  type="button"
                  onClick={() => document.execCommand('insertUnorderedList', false)}
                  className="p-2 hover:bg-gray-200 rounded"
                >
                  List
                </button>
              </div>
              {/* Editor Area */}
              <div
                contentEditable="true"
                className="w-full px-4 py-4 min-h-[200px] focus:outline-none prose max-w-none"
                placeholder="Write project summary here..."
                suppressContentEditableWarning={true}
              />
            </div>
          </div>

          {/* Note Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Note
            </label>
            <textarea
              rows={6}
              placeholder=""
              className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            />
          </div>

          {/* Save / Reset Buttons */}
          <div className="flex justify-start gap-4 pt-6">
            <button className="bg-black hover:bg-black text-white px-8 py-3 rounded-lg font-medium flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Save
            </button>
            <button className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-8 py-3 rounded-lg font-medium">
              Reset
            </button>
          </div>
        </div>
      </LayoutComponents>

      {/* Category Modal - using your LayoutComponents variant="modal" */}
      {isCategoryModalOpen && (
        <LayoutComponents
          title="Project Category"
          variant="modal"
          modal={categoryModalContent}
          onCloseModal={() => setIsCategoryModalOpen(false)}
        />
      )}
    </div>
  );
};

export default AddProjectFromTemplatePage;