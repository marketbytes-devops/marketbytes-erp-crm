import { useState, useEffect } from "react";
import { Link } from "react-router";
import { motion } from "framer-motion";
import { MdAdd, MdEdit, MdVisibility, MdDelete, MdPeople } from "react-icons/md";
import { FiSearch } from "react-icons/fi";
import LayoutComponents from "../../../components/LayoutComponents";
import apiClient from "../../../helpers/apiClient";
import Loading from "../../../components/Loading";
import toast from "react-hot-toast";

const DesignationView = () => {
  const [designations, setDesignations] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedDes, setSelectedDes] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchDesignations();
  }, []);

  const fetchDesignations = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/auth/roles/");
      const data = Array.isArray(res.data) ? res.data : res.data.results || [];
      setDesignations(data);
    } catch (err) {
      toast.error("Failed to load designations");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiClient.delete(`/auth/roles/${id}/`);
      setDesignations(prev => prev.filter(d => d.id !== id));
      toast.success("Designation deleted successfully");
      setShowDeleteConfirm(null);
    } catch (err) {
      toast.error("Cannot delete: designation is in use");
    }
  };

  const filtered = designations.filter(d =>
    d.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loading />
      </div>
    );
  }

  return (
    <>
      <div className="p-6">
        <LayoutComponents title="Designations" subtitle="Manage job titles & roles" variant="table">
          <div className="bg-white p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 rounded-t-xl">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="relative">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search designations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-6 py-3 w-full sm:w-96 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
              <span className="text-sm text-gray-600">{filtered.length} designations</span>
            </div>

            <Link
              to="/hr/designations/create"
              className="flex items-center gap-3 px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-all shadow-md"
            >
              <MdAdd className="w-5 h-5" />
              Add Designation
            </Link>
          </div>

          <div className="bg-white rounded-xl rounded-t-none border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">SL No</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Designation Name</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Designation Description</th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">Members</th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center py-16 text-gray-500">
                        {searchTerm ? "No matching designations" : "No designations found"}
                        <br />
                        <Link to="/hr/designations/create" className="text-black hover:underline font-medium">
                          Create your first designation
                        </Link>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((des, i) => (
                      <motion.tr
                        key={des.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 text-sm text-gray-900">{i + 1}</td>
                        <td className="px-6 py-4 font-medium text-gray-900">{des.name}</td>
                        <td className="px-6 py-4 font-medium text-gray-900">{des.description}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center gap-2 text-blue-600">
                            <MdPeople className="w-5 h-5" />
                            {des.member_count || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-3">
                            <button
                              onClick={() => { setSelectedDes(des); setShowViewModal(true); }}
                              className="p-2 hover:bg-gray-100 rounded-lg group"
                              title="View"
                            >
                              <MdVisibility className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
                            </button>
                            <Link
                              to={`/hr/designations/${des.id}/edit`}
                              className="p-2 hover:bg-gray-100 rounded-lg group"
                              title="Edit"
                            >
                              <MdEdit className="w-5 h-5 text-gray-600 group-hover:text-black" />
                            </Link>
                            <button
                              onClick={() => setShowDeleteConfirm(des.id)}
                              className="p-2 hover:bg-red-50 rounded-lg group"
                              title="Delete"
                            >
                              <MdDelete className="w-5 h-5 text-gray-600 group-hover:text-red-600" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </LayoutComponents>
      </div>
      {showViewModal && selectedDes && (
        <LayoutComponents
          title={selectedDes.name}
          variant="modal"
          modal={
            <div className="space-y-6">
              <div>
                <p className="text-sm text-gray-600">Designation ID</p>
                <p className="font-medium text-lg">#{selectedDes.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Designation Name</p>
                <p className="font-medium text-lg">{selectedDes.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Members</p>
                <p className="font-medium text-lg text-blue-600">
                  <MdPeople className="inline w-6 h-6 mr-2" />
                  {selectedDes.member_count || 0}
                </p>
              </div>
            </div>
          }
          onCloseModal={() => setShowViewModal(false)}
        />
      )}
      {showDeleteConfirm && (
        <LayoutComponents
          title="Delete Designation?"
          variant="modal"
          modal={
            <div className="space-y-6">
              <p className="text-gray-700">
                This designation may be assigned to employees. Deleting it could affect records.
              </p>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(showDeleteConfirm)}
                  className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700"
                >
                  Delete Anyway
                </button>
              </div>
            </div>
          }
          onCloseModal={() => setShowDeleteConfirm(null)}
        />
      )}
    </>
  );
};

export default DesignationView;