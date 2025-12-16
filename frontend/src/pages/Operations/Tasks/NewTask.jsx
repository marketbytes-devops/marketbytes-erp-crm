import React, { useState } from "react";
import LayoutComponents from "../../../components/LayoutComponents";

const NewTaskPage = () => {
  const [isProductive, setIsProductive] = useState(true);
  const [isBillable, setIsBillable] = useState(true);

  return (
    <div className="p-6">
      <LayoutComponents
        title="Tasks"
        variant="card"
      >
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Header */}
          <div className="px-8 py-6 bg-gray-100 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">NEW TASK</h2>
          </div>

          <div className="p-8 max-w-5xl mx-auto space-y-10">
            {/* Project & Task Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project
                </label>
                <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500">
                  <option>--</option>
                  <option>Lanware Solution</option>
                  <option>Seed and Scale</option>
                  <option>Marketbytes</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Task category
                  <button className="ml-3 bg-teal-500 hover:bg-teal-600 text-white px-3 py-1 rounded-lg text-sm font-medium">
                    + Task Category
                  </button>
                </label>
                <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500">
                  <option>Internal</option>
                  <option>Development</option>
                  <option>Design</option>
                </select>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder=""
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Description (Rich Text Editor) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                <div className="bg-gray-50 border-b border-gray-300 px-4 py-2 flex items-center gap-2 flex-wrap">
                  <button className="p-2 hover:bg-gray-200 rounded font-bold">B</button>
                  <button className="p-2 hover:bg-gray-200 rounded italic">I</button>
                  <button className="p-2 hover:bg-gray-200 rounded underline">U</button>
                  <button className="p-2 hover:bg-gray-200 rounded line-through">S</button>
                  <select className="px-3 py-1 text-sm border border-gray-300 rounded">
                    <option>15</option>
                  </select>
                  <button className="p-2 hover:bg-gray-200 rounded">Align Left</button>
                  <button className="p-2 hover:bg-gray-200 rounded">Align Center</button>
                  <button className="p-2 hover:bg-gray-200 rounded">Align Right</button>
                  <button className="p-2 hover:bg-gray-200 rounded">List</button>
                </div>
                <div
                  contentEditable="true"
                  className="w-full px-4 py-4 min-h-[200px] focus:outline-none"
                  placeholder="Write description here..."
                />
              </div>
            </div>

            {/* Status & Priority */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500">
                  <option>To Do</option>
                  <option>In progress</option>
                  <option>Done</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="priority" className="text-red-600" />
                    <span className="text-red-600">High</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="priority" defaultChecked className="text-yellow-500" />
                    <span className="text-yellow-600">Medium</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="priority" className="text-teal-600" />
                    <span className="text-teal-600">Low</span>
                  </label>
                </div>
              </div>
            </div>

            {/* File Upload Area */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-16 text-center">
              <p className="text-gray-600 text-lg">Drop files here to upload</p>
            </div>

            {/* Dates & Hours */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value="16-12-2025"
                  readOnly
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value="16-12-2025"
                  readOnly
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Allocated Hours <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder=""
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Assigned To */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assigned To <span className="text-red-500">*</span>
                <button className="ml-3 bg-teal-500 hover:bg-teal-600 text-white px-3 py-1 rounded-lg text-sm font-medium">
                  +
                </button>
              </label>
              <div className="flex items-center gap-4">
                <select className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500">
                  <option>Choose Assignee</option>
                </select>
                <button className="text-teal-600 hover:underline">Assign to me</button>
              </div>
            </div>

            {/* Labels */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Label
                <button className="ml-3 bg-teal-500 hover:bg-teal-600 text-white px-3 py-1 rounded-lg text-sm font-medium">
                  + Add Task Labels
                </button>
              </label>
              <div className="px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-500">
                Nothing selected
              </div>
            </div>

            {/* Checkboxes */}
            <div className="flex flex-wrap gap-8 items-center">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={isProductive}
                  onChange={(e) => setIsProductive(e.target.checked)}
                  className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500"
                />
                <span className="text-gray-700">Is productive?</span>
              </label>

              <label className="flex items-center gap-3">
                <input type="checkbox" className="w-5 h-5 text-gray-400 rounded" />
                <span className="text-gray-700">Make Private</span>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={isBillable}
                  onChange={(e) => setIsBillable(e.target.checked)}
                  className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500"
                />
                <span className="text-gray-700">Billable</span>
              </label>

              <label className="flex items-center gap-3">
                <input type="checkbox" className="w-5 h-5 text-gray-400 rounded" />
                <span className="text-gray-700">Set time estimate</span>
              </label>

              <label className="flex items-center gap-3">
                <input type="checkbox" className="w-5 h-5 text-gray-400 rounded" />
                <span className="text-gray-700">Repeat</span>
              </label>
            </div>

            {/* Task Dependency */}
            <div>
              <label className="flex items-center gap-3">
                <input type="checkbox" className="w-5 h-5 text-gray-400 rounded" />
                <span className="text-gray-700">Task is dependent on another task</span>
              </label>
            </div>

            {/* Save Button */}
            <div className="pt-6">
              <button className="bg-teal-500 hover:bg-teal-600 text-white px-8 py-3 rounded-lg font-medium flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save
              </button>
            </div>
          </div>
        </div>
      </LayoutComponents>
    </div>
  );
};

export default NewTaskPage;