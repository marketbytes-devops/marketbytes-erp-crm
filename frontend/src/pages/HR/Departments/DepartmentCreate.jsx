import { useState } from "react";
import { Link, useNavigate } from "react-router";
import LayoutComponents from "../../../components/LayoutComponents";
import { MdArrowBack, MdAdd, MdDelete } from "react-icons/md";
import toast from "react-hot-toast";
import apiClient from "../../../helpers/apiClient";
import Loading from "../../../components/Loading";
import Input from "../../../components/Input";

const DepartmentCreate = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    worksheet_url: "",
    services: [],
  });
  const [loading, setLoading] = useState(false);

  const addServiceField = () => {
    setFormData((prev) => ({ ...prev, services: [...prev.services, ""] }));
  };

  const updateService = (index, value) => {
    const updated = [...formData.services];
    updated[index] = value;
    setFormData((prev) => ({ ...prev, services: updated }));
  };

  const removeServiceField = (index) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      return toast.error("Department name is required");
    }

    const cleanedServices = formData.services
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      ...formData,
      services: cleanedServices.join(", "),
    };

    setLoading(true);
    try {
      await apiClient.post("/auth/departments/", payload);
      toast.success("Department created successfully!");
      navigate("/hr/departments");
    } catch (err) {
      toast.error(err.response?.data?.name?.[0] || "Failed to create department");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loading />
      </div>
    );
  }

  return (
    <div className="p-6">
      <LayoutComponents title="Add New Department" subtitle="Create a new department" variant="card">
        <div className="mx-auto">
          <Link
            to="/hr/departments"
            className="inline-flex items-center gap-2.5 text-gray-600 hover:text-black font-medium transition-colors"
          >
            <MdArrowBack className="w-5 h-5" />
            Back to Departments
          </Link>

          <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Department Name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Engineering"
              />
              <Input
                label="Worksheet URL (Google Sheet, etc.)"
                value={formData.worksheet_url || ""}
                onChange={(e) => setFormData({ ...formData, worksheet_url: e.target.value })}
                placeholder="https://docs.google.com/spreadsheets/..."
              />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-black">Services Offered</label>
                <button
                  type="button"
                  onClick={addServiceField}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-black hover:bg-gray-100 rounded-lg transition-all"
                >
                  <MdAdd className="w-5 h-5" />
                  Add Service
                </button>
              </div>

              <div className="space-y-3">
                {formData.services.length === 0 ? (
                  <p className="text-gray-400 text-sm italic">
                    No services added yet. Click "Add Service" to begin.
                  </p>
                ) : (
                  formData.services.map((service, index) => (
                    <div key={index} className="flex gap-3 items-center">
                      <input
                        type="text"
                        value={service}
                        onChange={(e) => updateService(index, e.target.value)}
                        placeholder="e.g. Web Development"
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => removeServiceField(index)}
                        className="p-3 text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        title="Remove"
                      >
                        <MdDelete className="w-5 h-5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading || !formData.name.trim()}
                className="px-8 py-3.5 bg-black text-white font-medium rounded-xl hover:bg-gray-900 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-md"
              >
                Create Department
              </button>
              <Link
                to="/hr/departments"
                className="px-8 py-3.5 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-all"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </LayoutComponents>
    </div>
  );
};

export default DepartmentCreate;