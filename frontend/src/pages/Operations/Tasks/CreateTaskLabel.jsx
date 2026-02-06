import React, { useState } from "react";
import LayoutComponents from "../../../components/LayoutComponents";

const AddTaskLabelPage = () => {
  const [labelName, setLabelName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedColor, setSelectedColor] = useState("#428BCA");

  const suggestedColors = [
    "#428BCA", "#5BC0DE", "#D9534F", "#5CB85C", "#B0E0A8", "#4CAF50",
    "#2E7D32", "#212121", "#9E9E9E", "#B39DDB", "#7B1FA2", "#D81B60",
    "#FFCCBC", "#E91E63", "#F44336", "#FF5722", "#FFC107", "#FF9800", "#795548"
  ];

  return (
    <div className="p-6">
      <LayoutComponents
        title="Task Label"
        variant="card"
      >
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Header */}
          <div className="px-8 py-6 bg-gray-100 border-b border-gray-200">
            <h2 className="text-xl font-medium text-gray-900">ADD TASK LABELS</h2>
          </div>

          <div className="p-8 max-w-3xl mx-auto space-y-8">
            {/* Label Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Label Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={labelName}
                onChange={(e) => setLabelName(e.target.value)}
                placeholder=""
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder=""
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
              />
            </div>

            {/* Color Picker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-4 mb-4">
                <input
                  type="text"
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  className="w-48 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <div
                  className="w-16 h-12 rounded border border-gray-300"
                  style={{ backgroundColor: selectedColor }}
                />
              </div>

              <p className="text-sm text-gray-600 mb-4">
                Choose any color. Or you can choose one of the suggested colors below.
              </p>

              {/* Suggested Colors Grid */}
              <div className="grid grid-cols-10 sm:grid-cols-20 gap-3">
                {suggestedColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`w-10 h-10 rounded border-2 transition-all ${selectedColor === color ? "border-gray-800 scale-110" : "border-gray-300"
                      }`}
                    style={{ backgroundColor: color }}
                    aria-label={color}
                  />
                ))}
              </div>
            </div>

            {/* Save / Reset Buttons */}
            <div className="flex justify-start gap-4 pt-6">
              <button className="bg-black hover:bg-gray-700 text-white px-8 py-3 rounded-lg font-medium">
                Save
              </button>
              <button className="bg-black hover:bg-gray-700 text-white px-8 py-3 rounded-lg font-medium">
                Reset
              </button>
            </div>
          </div>
        </div>
      </LayoutComponents>
    </div>
  );
};

export default AddTaskLabelPage;