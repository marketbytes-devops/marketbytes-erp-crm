import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  MdArrowBack,
  MdAdd,
  MdEdit,
  MdVisibility,
  MdDelete,
} from "react-icons/md";
import LayoutComponents from "../../../components/LayoutComponents";
import Input from "../../../components/Input";

const AddNewTemplatePage = () => {
  const navigate = useNavigate();

  const [templateName, setTemplateName] = useState("");
  const [members, setMembers] = useState([]);
  const [category, setCategory] = useState("");

  const handleAddMember = () => {
    alert("Member selection modal coming soon");
  };

  const handleSave = () => {
    if (!templateName.trim()) {
      alert("Please enter a template name");
      return;
    }
    alert("Template saved successfully!");
    navigate("/operations/projects/projecttemplateadd");
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <LayoutComponents
        title="Add New Template"
        subtitle="Create a reusable project template"
        variant="card"
      >
        <div className="mb-8">
          <Link
            to="/operations/projects"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
          >
            <MdArrowBack className="w-5 h-5" />
            Back to Templates
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Template Name <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Enter template name"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Template Members
              </label>
              <div className="flex flex-col gap-3">
                {members.length === 0 ? (
                  <div className="text-gray-500 py-3">
                    No members added to this template.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {members.map((m, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-gray-100 rounded-full text-sm"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleAddMember}
                  className="text-black font-medium hover:underline flex items-center gap-2 text-sm"
                >
                  <MdAdd className="w-5 h-5" />
                  Add Template Members
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Category
              </label>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  className="text-2xl font-medium text-black hover:text-gray-800"
                >
                  +
                </button>
                <span className="text-gray-500">No category selected</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-8 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate("/operations/projects")}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-900 transition font-medium"
            >
              <MdAdd className="w-5 h-5" />
              Save Template
            </button>
          </div>
        </div>
      </LayoutComponents>
    </div>
  );
};

export default AddNewTemplatePage;