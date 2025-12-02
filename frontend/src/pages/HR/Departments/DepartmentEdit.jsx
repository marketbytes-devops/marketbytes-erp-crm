import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router";
import LayoutComponents from "../../../components/LayoutComponents";
import Input from "../../../components/Input";
import { MdArrowBack, MdAdd, MdDelete } from "react-icons/md";
import toast from "react-hot-toast";
import apiClient from "../../../helpers/apiClient";
import Loading from "../../../components/Loading";

const DepartmentEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    worksheet_url: "",
    services: [], 
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    apiClient
      .get(`/auth/departments/${id}/`)
      .then((res) => {
        const data = res.data;
        setFormData({
          ...data,
          services: data.services
            ? data.services.split(",").map((s) => s.trim()).filter(Boolean)
            : [],
        });
        setFetching(false);
      })
      .catch(() => {
        toast.error("Failed to load department");
        navigate("/hr/departments");
      });
  }, [id, navigate]);

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
      await apiClient.put(`/auth/departments/${id}/`, payload);
      toast.success("Department updated successfully!");
      navigate("/hr/departments");
    } catch (err) {
      toast.error(err.response?.data?.name?.[0] || "Failed to update department");
    } finally {
      setLoading(false);
    }
  };

  if (fetching || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loading />
      </div>
    );
  }

  return (
    <div className="p-6">
      <LayoutComponents
        title="Edit Department"
        subtitle={`ID: ${id} • ${formData.name}`}
        variant="card"
      >
        <div className="mx-auto">
          <Link
            to="/hr/departments"
            className="inline-flex items-center gap-2.5 text-gray-600 hover:text-black font-medium transition-colors"
          >
            <MdArrowBack className="w-5 h-5" />
            Back to Departments
          </Link>

          <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
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
                        placeholder="e.g. Mobile App Development"
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
                disabled={loading}
                className="px-8 py-3.5 bg-black text-white font-medium rounded-xl hover:bg-gray-900 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-md"
              >
                Update Department
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

export default DepartmentEdit;