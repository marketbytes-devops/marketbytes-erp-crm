import { useState } from "react";
import { MdAdd } from "react-icons/md";
import LayoutComponents from "../../../components/LayoutComponents"; // Adjust path if needed

const CreateProjectPage = () => {
  const [formData, setFormData] = useState({
    projectName: "",
    projectCategory: "",
    department: "",
    startDate: "",
    deadline: "",
    noDeadline: false,
    amc: false,
    allowManualTimeLogs: true,
    renewalOnly: false,
    dm: false,
    projectMembers: [],
    client: "",
    clientCanManageTasks: false,
    budget: "",
    currency: "INR",
    hoursAllocated: "",
    status: "Not Started",
    stage: "",
    summary: "",
    note: "",
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("New Project:", formData);
    // Add your API call here
  };

  const handleReset = () => {
    setFormData({
      projectName: "",
      projectCategory: "",
      department: "",
      startDate: "",
      deadline: "",
      noDeadline: false,
      amc: false,
      allowManualTimeLogs: true,
      renewalOnly: false,
      dm: false,
      projectMembers: [],
      client: "",
      clientCanManageTasks: false,
      budget: "",
      currency: "INR",
      hoursAllocated: "",
      status: "Not Started",
      stage: "",
      summary: "",
      note: "",
    });
  };

  return (
    <div className="p-6">
    <LayoutComponents title="Add New Project" subtitle="Fill in the details to create a new project" >
      <div className="p-6 max-w-6xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-10">

          {/* ==================== PROJECT INFO ==================== */}
          <section className="rounded-xl p-8 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-8">PROJECT INFO</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Project Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="projectName"
                  value={formData.projectName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black outline-none"
                  placeholder="Enter project name"
                />
              </div>

              {/* Project Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Category <span className="text-green-500 ml-1">+</span>
                </label>
                <select
                  name="projectCategory"
                  value={formData.projectCategory}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black"
                >
                  <option>Development</option>
                  <option>Design</option>
                  <option>Marketing</option>
                  <option>Support</option>
                </select>
              </div>

              {/* Department */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department <span className="text-red-500">*</span> <span className="text-green-500 ml-1">+</span>
                </label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black"
                >
                  <option>Choose Departments</option>
                  <option>IT</option>
                  <option>HR</option>
                  <option>Sales</option>
                  <option>Operations</option>
                </select>
              </div>
            </div>

            {/* Start Date & Deadline */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deadline <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="date"
                    name="deadline"
                    value={formData.deadline}
                    onChange={handleChange}
                    disabled={formData.noDeadline}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black"
                  />
                  <label className="flex items-center text-sm text-gray-600 whitespace-nowrap">
                    <input
                      type="checkbox"
                      name="noDeadline"
                      checked={formData.noDeadline}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    Add project without deadline?
                  </label>
                </div>
              </div>
            </div>

            {/* Checkboxes Row */}
            <div className="flex flex-wrap items-center gap-10 mt-8">
              <label className="flex items-center cursor-pointer">
                <input type="checkbox" name="amc" checked={formData.amc} onChange={handleChange} className="mr-3 w-4 h-4" />
                <span className="text-sm font-medium">AMC</span>
              </label>

              <label className="flex items-center cursor-pointer">
                <input type="checkbox" name="allowManualTimeLogs" checked={formData.allowManualTimeLogs} onChange={handleChange} className="mr-3 w-4 h-4 accent-blue-600" />
                <span className="text-sm font-medium">Allow manual time logs?</span>
              </label>

              <label className="flex items-center cursor-pointer">
                <input type="checkbox" name="renewalOnly" checked={formData.renewalOnly} onChange={handleChange} className="mr-3 w-4 h-4" />
                <span className="text-sm font-medium">Renewal Only Project</span>
              </label>

              <label className="flex items-center cursor-pointer">
                <input type="checkbox" name="dm" checked={formData.dm} onChange={handleChange} className="mr-3 w-4 h-4" />
                <span className="text-sm font-medium">DM</span>
              </label>
            </div>

            {/* Project Members */}
            <div className="mt-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add Project Members <span className="text-red-500">*</span> <span className="text-green-500 ml-1">+</span>
              </label>
              <select
                multiple
                name="projectMembers"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl h-32 focus:ring-2 focus:ring-black"
              >
                <option>John Doe</option>
                <option>Jane Smith</option>
                <option>Mike Johnson</option>
                {/* Add real members from API */}
              </select>
     
            </div>
         

          {/* ==================== CLIENT INFO ==================== */}
         
            <h2 className="text-md font-semibold text-gray-900 mb-2 mt-5">CLIENT INFO</h2>
            <div className="max-w-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Client <span className="text-green-500 ml-1">+</span>
              </label>
              <select
                name="client"
                value={formData.client}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black"
              >
                <option>--</option>
                <option>ABC Corp</option>
                <option>XYZ Ltd</option>
              </select>

              <label className="flex items-center mt-6">
                <input
                  type="checkbox"
                  name="clientCanManageTasks"
                  checked={formData.clientCanManageTasks}
                  onChange={handleChange}
                  className="mr-3 w-4 h-4"
                />
                <span className="text-sm text-gray-600">Client can manage tasks of this project</span>
              </label>
            </div>
        

          {/* ==================== BUDGET INFO ==================== */}
       
            <h2 className="text-md font-semibold text-gray-900 mb-6 mt-5">BUDGET INFO</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Budget</label>
                <input
                  type="number"
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black"
                >
                  <option>Rupee (INR)</option>
                  <option>USD</option>
                  <option>EUR</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hours Allocated</label>
                <input
                  type="number"
                  name="hoursAllocated"
                  value={formData.hoursAllocated}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black"
                />
              </div>
            </div>
       

          {/* ==================== STATUS & STAGE ==================== */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section className=" rounded-xl p-8 border border-gray-200 mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2 ">Project Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black"
              >
                <option>Not Started</option>
                <option>In Progress</option>
                <option>Completed</option>
                <option>On Hold</option>
                <option>Cancelled</option>
              </select>
            </section>

            <section className="rounded-xl p-8 border mt-4 border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">Project Stage</label>
              <select
                name="stage"
                value={formData.stage}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black"
              >
                <option>Project Stage</option>
                <option>Planning</option>
                <option>Execution</option>
                <option>Review</option>
              </select>
            </section>
          </div>

          {/* ==================== FILE UPLOAD ==================== */}
          <section className=" rounded-xl p-12 border-2 border-dashed border-gray-300 mt-4 text-center">
            <p className="text-gray-600 text-lg">Drop files here to upload</p>
            <p className="text-sm text-gray-500 mt-2">or click to browse</p>
            {/* Implement react-dropzone or native input here */}
          </section>

          {/* ==================== PROJECT SUMMARY ==================== */}
         
            <h2 className="text-md font-semibold text-gray-900 mb-6 mt-4">Project Summary</h2>
            <div className="border border-gray-300 rounded-xl overflow-hidden">
              <div className="p-3 flex gap-2 flex-wrap">
                {/* Simple toolbar icons */}
                <button type="button" className="px-3 py-1 hover:bg-gray-200 rounded">B</button>
                <button type="button" className="px-3 py-1 hover:bg-gray-200 rounded italic">I</button>
                <button type="button" className="px-3 py-1 hover:bg-gray-200 rounded underline">U</button>
                {/* Add more: bullet, align, etc. */}
              </div>
              <textarea
                name="summary"
                value={formData.summary}
                onChange={handleChange}
                rows="8"
                className="w-full px-4 py-4 outline-none resize-none"
                placeholder="Write project summary..."
              />
            </div>
         

          <section className=" rounded-xl p-8 border border-gray-200 mt-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 ">Note</h2>
            <div className="border border-gray-300 rounded-xl overflow-hidden">
              <div className="bg-gray-100 p-3 flex gap-2 flex-wrap">
                <button type="button" className="px-3 py-1 hover:bg-gray-200 rounded">B</button>
                <button type="button" className="px-3 py-1 hover:bg-gray-200 rounded italic">I</button>
                <button type="button" className="px-3 py-1 hover:bg-gray-200 rounded underline">U</button>
              </div>
              <textarea
                name="note"
                value={formData.note}
                onChange={handleChange}
                rows="6"
                className="w-full px-4 py-4 outline-none resize-none"
                placeholder="Add any internal note..."
              />
            </div>
          </section>
 </section>
          {/* ==================== SAVE / RESET ==================== */}
          <div className="flex justify-start gap-6 pt-8">
            <button
              type="submit"
              className="flex items-center gap-3 px-8 py-4 bg-teal-500 text-white rounded-xl hover:bg-teal-600 transition font-semibold text-base"
            >
              <MdAdd className="w-5 h-5" /> Save
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="px-8 py-4 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition font-medium"
            >
              Reset
            </button>
          </div>

        </form>
      </div>
    </LayoutComponents>
    </div>
  );
};

export default CreateProjectPage;