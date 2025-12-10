import { useState } from "react";
import { Link, useNavigate } from "react-router";
import LayoutComponents from "../../../components/LayoutComponents";
import { MdArrowBack } from "react-icons/md";
import toast from "react-hot-toast";
import apiClient from "../../../helpers/apiClient";
import Input from "../../../components/Input";

const DesignationCreate = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Designation name is required");

    setLoading(true);
    try {
      await apiClient.post("/auth/roles/", { name: name.trim(), description: description.trim() });
      toast.success("Designation created successfully!");
      navigate("/hr/designations");
    } catch (err) {
      toast.error("Failed to create designation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <LayoutComponents title="Add New Designation" subtitle="Create a new job title" variant="card">
        <div className="mx-auto">
          <Link to="/hr/designations" className="inline-flex items-center gap-2.5 text-gray-600 hover:text-black mb-8 font-medium">
            <MdArrowBack className="w-5 h-5" /> Back to Designations
          </Link>

          <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl p-6 space-y-6">
            <Input
              label="Designation Name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Senior React Developer"
              autoFocus
            />
            <Input
              label="Designation Description"
              required
              value={name}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Anything can access"
              autoFocus
            />
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="px-8 py-3.5 bg-black text-white font-medium rounded-xl hover:bg-gray-900 disabled:opacity-60 shadow-md"
              >
                {loading ? "Creating..." : "Create Designation"}
              </button>
              <Link to="/hr/designations" className="px-8 py-3.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50">
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </LayoutComponents>
    </div>
  );
};

export default DesignationCreate;