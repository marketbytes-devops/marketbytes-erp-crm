import React, { useState } from "react";
import LayoutComponents from "../../../components/LayoutComponents";
import { useNavigate } from "react-router";
const TaskLabelsPage = () => {
  const navigate = useNavigate();
  const handleClick = () => {
    navigate("/operations/tasks/task-label-create")
  }
  return (
    <div className="p-6">
      <LayoutComponents
        title="Tasks"
        variant="card"
      >
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Header with Title and Create Button */}
          <div className="px-6 py-5 flex items-center justify-between border-b border-gray-200">
            <h2 className="text-xl font-medium text-gray-900 flex items-center gap-3">
              <span className="text-2xl">🏷️</span> Task Labels
            </h2>
            <button onClick={handleClick} className="bg-black hover:bg-teal-600 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2">
              Create Label
              <span className="text-lg">+</span>
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 text-gray-600 text-xs uppercase">
                <tr>
                  <th className="px-6 py-4 text-left">#</th>
                  <th className="px-6 py-4 text-left">Label Name</th>
                  <th className="px-6 py-4 text-left">Description</th>
                  <th className="px-6 py-4 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={4} className="text-center py-16 text-gray-500 font-medium">
                    No data available in table
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </LayoutComponents>
    </div>
  );
};

export default TaskLabelsPage;