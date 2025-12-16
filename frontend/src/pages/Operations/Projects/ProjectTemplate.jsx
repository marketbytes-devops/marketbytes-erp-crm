import React, { useState } from "react";
import LayoutComponents from "../../../components/LayoutComponents";
import { useNavigate } from "react-router";

const AddNewTemplatePage = () => {

  const navigate = useNavigate();
  const handleClick = () => {
    navigate("/operations/projects/projecttemplateadd"); 
  };

  return (
    <div className="p-6">
      <LayoutComponents
        title="Add New Template"
        subtitle="Fill in the details to create a new template"
        variant="card"
      >
        
      <div className="w-full flex justify-end py-2">
  <button className="bg-black text-white rounded-xl px-6 py-3" onClick={handleClick}>

    Add New Template
  </button>
</div>
        <div className=" mx-auto">
          <div className="bg-white rounded-xl  shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-5 mb-12 ">
              {/* Column 1: Template Name */}
              <div>
                <div className="text-sm font-medium text-gray-600 mb-3 mt-3  ml-5 ">
                  ID
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-600 mt-3 mb-3">
                  TEMPLATE NAME
                </div>
                <input
                  type="text"
                  placeholder="Enter template name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              {/* Column 2: Template Members */}
              <div>
                <div className="text-sm font-medium text-gray-600 mt-3 mb-3">
                  TEMPLATE MEMBERS
                </div>
                <div className="text-gray-700">
                  No member added to this template.
                </div>
                <button className="mt-3 text-black font-medium hover:underline flex items-center gap-1">
                  <span className="text-xl">+</span> Add Template Members
                </button>
              </div>

              {/* Column 3: Category */}
              <div>
                <div className="text-sm font-medium text-gray-600 mb-3 mt-3">
                  CATEGORY
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-black text-2xl font-bold cursor-pointer select-none">
                    +{" "}
                  </span>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-600 mb-3 mt-3">
                  ACTION
                </div>
                <div className="flex gap-3">
                  <button className="text-blue-600 hover:text-blue-800">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                  </button>
                  <button className="text-teal-600 hover:text-teal-800">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  </button>
                  <button className="text-red-600 hover:text-red-800">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Save / Cancel Buttons */}
            <div className="flex justify-end gap-5 mt-12 pt-8 border-t border-gray-200">
              <button className="px-8 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition">
                Cancel
              </button>
              <button className="px-8 py-3 bg-black text-white rounded-xl hover:bg-black transition">
                Save Template
              </button>
            </div>
          </div>
        </div>
      </LayoutComponents>
    </div>
  );
};

export default AddNewTemplatePage;
