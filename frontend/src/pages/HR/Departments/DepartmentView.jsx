import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router";
import { MdAdd, MdEdit, MdVisibility, MdDelete, MdLink, MdDownload } from "react-icons/md";
import { FiSearch } from "react-icons/fi";
import LayoutComponents from "../../../components/LayoutComponents";
import apiClient from "../../../helpers/apiClient";
import Loading from "../../../components/Loading";
import toast from "react-hot-toast";

const DepartmentView = () => {
  const [departments, setDepartments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/auth/departments/");
      const data = Array.isArray(res.data) ? res.data : res.data.results || [];
      setDepartments(data);
    } catch (err) {
      toast.error("Failed to load departments");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiClient.delete(`/auth/departments/${id}/`);
      setDepartments(departments.filter(d => d.id !== id));
      toast.success("Department deleted successfully");
      setShowDeleteConfirm(null);
    } catch (err) {
      toast.error("Failed to delete department");
    }
  };

  const openViewModal = (dept) => {
    setSelectedDept(dept);
    setShowModal(true);
  };

  const filteredDepartments = departments.filter((dept) =>
    dept.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dept.services?.toLowerCase().includes(searchTerm.toLowerCase())
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
        <LayoutComponents title="Departments" subtitle="Manage company departments" variant="table">
          <div className="bg-white p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="relative">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search departments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-6 py-3 w-full sm:w-96 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black transition-all"
                />
              </div>
              <span className="text-sm text-gray-600">{filteredDepartments.length} departments</span>
            </div>
            <div className="flex gap-3">
              <button className="flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all">
                <MdDownload /> <span className="hidden sm:inline">Export CSV</span>
              </button>
              <Link
                to="/hr/departments/create"
                className="flex items-center gap-3 px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-all shadow-md"
              >
                <MdAdd className="w-5 h-5" />
                Add Department
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-xl rounded-t-none border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">SL No</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Department</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Worksheet URL</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Services</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredDepartments.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-16 text-gray-500">
                        {searchTerm ? "No departments match your search" : "No departments found"}
                        <br />
                        <Link to="/hr/departments/create" className="text-black hover:underline font-medium">
                          Create your first department
                        </Link>
                      </td>
                    </tr>
                  ) : (
                    filteredDepartments.map((dept, i) => (
                      <motion.tr
                        key={dept.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{i + 1}</td>
                        <td className="px-6 py-4 font-medium text-gray-900">{dept.name}</td>
                        <td className="px-6 py-4">
                          {dept.worksheet_url ? (
                            <a
                              href={dept.worksheet_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
                            >
                              <MdLink className="w-4 h-4" />
                              Open Sheet
                            </a>
                          ) : (
                            <span className="text-gray-400 italic">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-600 max-w-xs">
                          <div className="truncate">{dept.services || <span className="text-gray-400 italic">—</span>}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-3">
                            <button
                              onClick={() => openViewModal(dept)}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-all group"
                              title="View Details"
                            >
                              <MdVisibility className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
                            </button>
                            <Link
                              to={`/hr/departments/${dept.id}/edit`}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-all group"
                              title="Edit"
                            >
                              <MdEdit className="w-5 h-5 text-gray-600 group-hover:text-black" />
                            </Link>
                            <button
                              onClick={() => setShowDeleteConfirm(dept.id)}
                              className="p-2 hover:bg-red-50 rounded-lg transition-all group"
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
      {showModal && selectedDept && (
        <LayoutComponents
          title={selectedDept.name}
          variant="modal"
          modal={
            <div className="space-y-6">
              <div>
                <p className="text-sm text-gray-600">Department ID</p>
                <p className="font-semibold text-lg">{selectedDept.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Department Name</p>
                <p className="font-semibold text-lg">{selectedDept.name}</p>
              </div>
              {selectedDept.worksheet_url && (
                <div>
                  <p className="text-sm text-gray-600">Worksheet URL</p>
                  <a
                    href={selectedDept.worksheet_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline font-medium"
                  >
                    {selectedDept.worksheet_url}
                  </a>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600">Services Offered</p>
                {selectedDept.services ? (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedDept.services.split(",").map((s, i) => (
                      <span
                        key={i}
                        className="px-4 py-2 bg-black text-white text-sm rounded-full font-medium"
                      >
                        {s.trim()}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 italic">No services listed</p>
                )}
              </div>
            </div>
          }
          onCloseModal={() => setShowModal(false)}
        />
      )}
      {showDeleteConfirm && (
        <LayoutComponents
          title="Delete Department?"
          variant="modal"
          modal={
            <div className="space-y-6">
              <p className="text-gray-700">
                Are you sure you want to delete this department? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(showDeleteConfirm)}
                  className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all"
                >
                  Delete
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

export default DepartmentView;