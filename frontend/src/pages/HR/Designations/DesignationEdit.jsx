import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router";
import LayoutComponents from "../../../components/LayoutComponents";
import { MdArrowBack } from "react-icons/md";
import toast from "react-hot-toast";
import apiClient from "../../../helpers/apiClient";
import Loading from "../../../components/Loading";
import Input from "../../../components/Input";

const DesignationEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get(`/auth/roles/${id}/`)
      .then(res => {
        setName(res.data.name);
        setDescription(res.data.description);
      })
      .catch(() => toast.error("Failed"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    try {
      await apiClient.put(`/auth/roles/${id}/`, { name, description });
      toast.success("Updated!");
      navigate("/hr/designations");
    } catch {
      toast.error("Failed");
    }
  };

  if (loading) return
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <Loading />
  </div>;

  return (
    <div className="p-6">
      <LayoutComponents title="Edit Designation" variant="card">
        <div className="bg-white mx-auto p-6">
          <Link to="/hr/designations" className="inline-flex items-center gap-2 mb-8 text-gray-600">
            <MdArrowBack /> Back
          </Link>
          <div className="bg-white p-6 space-y-6 rounded-xl shadow-xl">
            <Input label="Designation Name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input label="Designation Description" value={description} onChange={(e) => setDescription(e.target.value)} />
            <div className="flex gap-4 mt-6">
              <button onClick={handleSave} className="px-8 py-3 bg-black text-white rounded-xl">
                Update
              </button>
              <Link to="/hr/designations" className="px-8 py-3 border rounded-xl hover:bg-gray-50">
                Cancel
              </Link>
            </div>
          </div>
        </div>
      </LayoutComponents>
    </div>
  );
};

export default DesignationEdit;