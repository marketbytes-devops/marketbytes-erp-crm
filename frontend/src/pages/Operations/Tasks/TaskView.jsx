import React, { useState } from "react";
import LayoutComponents from "../../../components/LayoutComponents";
import { useNavigate } from "react-router";

const TasksPage = () => {
  const [showEntries, setShowEntries] = useState(50);
  const [search, setSearch] = useState("");
  const [isPinnedModalOpen, setIsPinnedModalOpen] = useState(false); // Added state
  const navigate =useNavigate();
const handleClick=()=>
  {
    navigate("/operations/tasks/tasklabel")
  };
 const handleNewtaskClick=()=>
  {
    navigate("/operations/tasks/newtask")
  };
  const tasks = [
    {
      id: 539,
      task: "Content Calendar",
      project: "Lanware Solution",
      assignedTo: 2,
      dueDate: "04-12-2025",
      status: "In progress",
    },
    {
      id: 538,
      task: "Content Planning",
      project: "Seed and Scale",
      assignedTo: 2,
      dueDate: "01-12-2025",
      status: "In progress",
    },
  ];

  const getStatusColor = (status) => {
    return status === "To Do" ? "text-white border-black bg-black" : "text-teal-600 border-teal-300 bg-teal-50";
  };

  const renderAvatars = (count) => {
    return Array.from({ length: count }, (_, i) => (
      <div
        key={i}
        className="w-8 h-8 rounded-full bg-gray-400 border-2 border-white -ml-2"
      />
    ));
  };

  // Pinned Task Modal Content
  const pinnedModalContent = (
    <div className="p-6">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase">#</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase">Task</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={3} className="text-center py-12 text-gray-500">
                No pinned item found
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <LayoutComponents
        title="Tasks"
        variant="card"
      >
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Top Buttons Bar */}
          <div className="px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsPinnedModalOpen(true)} // Open modal
                className="border border-black text-black px-4 py-2 rounded-lg hover:bg-blue-50 flex items-center gap-2"
              >
                Pinned Task
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <button onClick={handleClick} className="border border-black text-black px-4 py-2 rounded-lg hover:bg-purple-50">
                Task Labels
              </button>
              <button onClick={ handleNewtaskClick} className ="bg-black text-white px-4 py-2 rounded-lg flex items-center gap-2">
                <span className="text-lg">+</span> New Task
              </button>
            </div>
            <button className="bg-black text-white px-4 py-2 rounded-lg flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Controls: Show entries + Search */}
          <div className="px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50">
            <div className="flex items-center gap-3 text-gray-700">
              <span>Show</span>
              <select
                value={showEntries}
                onChange={(e) => setShowEntries(Number(e.target.value))}
                className="border border-gray-300 rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-teal-500"
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
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder=""
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 text-gray-600 text-xs uppercase">
                <tr>
                  <th className="px-6 py-4 text-left">#</th>
                  <th className="px-6 py-4 text-left">Task</th>
                  <th className="px-6 py-4 text-left">Project</th>
                  <th className="px-6 py-4 text-left">Assigned To</th>
                  <th className="px-6 py-4 text-left">Due Date</th>
                  <th className="px-6 py-4 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-sm font-medium">
                          +
                        </div>
                        <span className="font-medium">{task.id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 font-medium text-gray-900">
                      {task.task}
                    </td>
                    <td className="px-6 py-5 text-gray-700">
                      {task.project}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex -space-x-2">
                        {renderAvatars(task.assignedTo)}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-gray-700">
                      {task.dueDate}
                    </td>
                    <td className="px-6 py-5">
                      <select
                        defaultValue={task.status}
                        className={`px-4 py-2 rounded-lg border font-medium ${getStatusColor(task.status)} focus:outline-none`}
                      >
                        <option value="To Do">To Do</option>
                        <option value="In progress">In progress</option>
                        <option value="Done">Done</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </LayoutComponents>

      {/* Pinned Task Modal */}
      {isPinnedModalOpen && (
        <LayoutComponents
          title="Pinned Task"
          variant="modal"
          modal={pinnedModalContent}
          onCloseModal={() => setIsPinnedModalOpen(false)}
        />
      )}
    </div>
  );
};

export default TasksPage;