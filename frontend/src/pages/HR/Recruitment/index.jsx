import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import LayoutComponents from "../../../components/LayoutComponents";
import apiClient from "../../../helpers/apiClient";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { 
  MdAdd, 
  MdDownload, 
  MdEdit, 
  MdDelete, 
  MdClose, 
  MdKeyboardArrowDown   // ← Add this
} from "react-icons/md";

const Recruitment = () => {
  const [candidates, setCandidates] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [deptFilter, setDeptFilter] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    gender: "male",
    designation: "",
    department: "",
    dob: "",
    comments: "",
    round: 1,
    status: "screening",
    offered: false,
  });

  // Fetch departments (used multiple times)
  const fetchDepartments = async () => {
    try {
      const res = await apiClient.get("/auth/departments/");
      const data = res.data.results || res.data;
      setDepartments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load departments:", err);
      setDepartments([]);
    }
  };

  // Initial load
  useEffect(() => {
    fetchDepartments();
  }, []);

  // Fetch candidates with filters
  useEffect(() => {
    const fetchCandidates = async () => {
      setLoading(true);
      try {
        let url = "/hr/candidates/";
        const params = new URLSearchParams();

        if (searchQuery) params.append("search", searchQuery);
        if (statusFilter) params.append("status", statusFilter);
        if (deptFilter) params.append("department", deptFilter);

        if (params.toString()) url += `?${params.toString()}`;

        const res = await apiClient.get(url);
        const data = res.data.results || res.data;
        setCandidates(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load candidates:", err);
        setCandidates([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCandidates();
  }, [searchQuery, statusFilter, deptFilter]);

  // Open modal (for add or edit)
  const openModal = async (candidate = null) => {
    // Always fetch fresh departments when opening modal
    await fetchDepartments();

    if (candidate) {
      setEditingCandidate(candidate);
      setFormData({
        name: candidate.name || "",
        email: candidate.email || "",
        mobile: candidate.mobile || "",
        gender: candidate.gender || "male",
        designation: candidate.designation || "",
        department: candidate.department || "", // ID from backend
        dob: candidate.dob || "",
        comments: candidate.comments || "",
        round: candidate.round || 1,
        status: candidate.status || "screening",
        offered: candidate.offered || false,
      });
    } else {
      setEditingCandidate(null);
      setFormData({
        name: "",
        email: "",
        mobile: "",
        gender: "male",
        designation: "",
        department: "",
        dob: "",
        comments: "",
        round: 1,
        status: "screening",
        offered: false,
      });
    }
    setShowModal(true);
  };

  // Save (Add or Update)
  const handleSave = (e) => {
    e.preventDefault();

    const request = editingCandidate
      ? apiClient.put(`/hr/candidates/${editingCandidate.id}/`, formData)
      : apiClient.post("/hr/candidates/", formData);

    request
      .then((res) => {
        if (editingCandidate) {
          // Update existing
          setCandidates(candidates.map((c) => (c.id === editingCandidate.id ? res.data : c)));
        } else {
          // Add new
          setCandidates([res.data, ...candidates]);
        }
        setShowModal(false);
        alert(`Candidate ${editingCandidate ? "updated" : "added"} successfully!`);
      })
      .catch((err) => {
        console.error("Save error:", err.response?.data || err);
        alert("Error saving candidate. Check required fields.");
      });
  };

  // Delete
  const handleDelete = (id) => {
    if (!window.confirm("Are you sure you want to delete this candidate? This action cannot be undone.")) {
      return;
    }

    apiClient
      .delete(`/hr/candidates/${id}/`)
      .then(() => {
        setCandidates(candidates.filter((c) => c.id !== id));
        alert("Candidate deleted successfully.");
      })
      .catch((err) => {
        console.error("Delete error:", err);
        alert("Error deleting candidate.");
      });
  };

  // Status badge
  const getStatusBadge = (status) => {
    const colors = {
      screening: "bg-gray-100 text-gray-800",
      interview: "bg-blue-100 text-blue-800",
      technical: "bg-purple-100 text-purple-800",
      hr_round: "bg-indigo-100 text-indigo-800",
      selected: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      on_hold: "bg-yellow-100 text-yellow-800",
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${colors[status] || "bg-gray-100 text-gray-800"}`}>
        {(status || "").replace("_", " ").toUpperCase()}
      </span>
    );
  };

  // Export Functions
  const exportToCSV = () => {
    const headers = ["Name", "Email", "Mobile", "Designation", "Department", "Status", "Round"];
    const rows = candidates.map(c => [
      c.name || "",
      c.email || "",
      c.mobile || "",
      c.designation || "",
      c.department_name || "",
      (c.status || "").replace("_", " ").toUpperCase(),
      c.round || 1
    ]);

    const data = [headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Candidates");
    XLSX.writeFile(wb, "candidates.csv");
  };

  const exportToExcel = () => {
    const rows = candidates.map(c => ({
      Name: c.name || "",
      Email: c.email || "",
      Mobile: c.mobile || "",
      Designation: c.designation || "",
      Department: c.department_name || "",
      Status: (c.status || "").replace("_", " ").toUpperCase(),
      Round: c.round || 1
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Candidates");
    XLSX.writeFile(wb, "candidates.xlsx");
  };

  const exportToPDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });

    doc.setFontSize(18);
    doc.text("Candidates Report", 14, 15);

    doc.setFontSize(11);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 25);

    const tableColumns = ["Name", "Email", "Mobile", "Designation", "Department", "Status", "Round"];
    const tableRows = candidates.map(c => [
      c.name || "—",
      c.email || "—",
      c.mobile || "—",
      c.designation || "—",
      c.department_name || "—",
      (c.status || "").replace("_", " ").toUpperCase(),
      c.round || 1
    ]);

    doc.autoTable({
      head: [tableColumns],
      body: tableRows,
      startY: 35,
      theme: "grid",
      styles: { fontSize: 10 },
      headStyles: { fillColor: [30, 30, 30] },
    });

    doc.save("candidates.pdf");
  };

  return (
    <div className="p-6">
      <LayoutComponents title="Recruitment" subtitle="Manage hiring pipeline" variant="card">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h3 className="text-xl font-medium">Candidates</h3>
            <div className="flex gap-3 w-full md:w-auto">
              {/* Export Dropdown */}
              <div className="relative group">
                <button className="flex items-center gap-3 px-6 py-3.5 border border-gray-300 rounded-xl hover:bg-gray-50 transition font-medium">
                  <MdDownload className="w-5 h-5" /> Export
                  <MdKeyboardArrowDown className="w-5 h-5 transition-transform group-hover:rotate-180" />
                </button>

                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                  <button
                    onClick={exportToCSV}
                    className="w-full text-left px-5 py-3 hover:bg-gray-50 transition flex items-center gap-3"
                  >
                    <span className="text-green-600 font-medium">CSV</span> Download as .csv
                  </button>
                  <button
                    onClick={exportToExcel}
                    className="w-full text-left px-5 py-3 hover:bg-gray-50 transition flex items-center gap-3"
                  >
                    <span className="text-green-700 font-medium">Excel</span> Download as .xlsx
                  </button>
                  <button
                    onClick={exportToPDF}
                    className="w-full text-left px-5 py-3 hover:bg-gray-50 transition flex items-center gap-3 border-t"
                  >
                    <span className="text-red-600 font-medium">PDF</span> Download as .pdf
                  </button>
                </div>
              </div>

              <button
                onClick={() => openModal()}
                className="flex items-center gap-3 px-6 py-3.5 bg-black text-white rounded-xl hover:bg-gray-900 transition font-medium w-full md:w-auto"
              >
                <MdAdd className="w-5 h-5" /> Add Candidate
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <input
              type="text"
              placeholder="Search by name, email, mobile..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-5 py-3.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-5 py-3.5 border border-gray-300 rounded-xl"
            >
              <option value="">All Status</option>
              <option value="screening">Screening</option>
              <option value="interview">Interview</option>
              <option value="technical">Technical Round</option>
              <option value="hr_round">HR Round</option>
              <option value="selected">Selected</option>
              <option value="rejected">Rejected</option>
              <option value="on_hold">On Hold</option>
            </select>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="px-5 py-3.5 border border-gray-300 rounded-xl"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          {/* Table */}
          {loading ? (
            <div className="text-center py-16">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-black border-t-transparent"></div>
            </div>
          ) : candidates.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                <MdAdd className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-xl font-medium">No candidates found</p>
              <p className="mt-2">Add your first candidate to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto border-collapse">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-sm font-medium text-gray-700">
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Mobile</th>
                    <th className="px-6 py-4">Designation</th>
                    <th className="px-6 py-4">Department</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-center">Round</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {candidates.map((c) => (
                    <motion.tr
                      key={c.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50 transition"
                    >
                      <td className="px-6 py-4 font-medium">{c.name || "—"}</td>
                      <td className="px-6 py-4">{c.email || "—"}</td>
                      <td className="px-6 py-4">{c.mobile || "—"}</td>
                      <td className="px-6 py-4">{c.designation || "—"}</td>
                      <td className="px-6 py-4">{c.department_name || "—"}</td>
                      <td className="px-6 py-4">{getStatusBadge(c.status)}</td>
                      <td className="px-6 py-4 text-center">{c.round || 1}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-4">
                          <button
                            onClick={() => openModal(c)}
                            className="p-2 hover:bg-indigo-100 rounded-lg text-indigo-600 transition"
                            title="Edit"
                          >
                            <MdEdit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(c.id)}
                            className="p-2 hover:bg-red-100 rounded-lg text-red-600 transition"
                            title="Delete"
                          >
                            <MdDelete className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </LayoutComponents>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-white bg-opacity-60 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-2xl font-bold">
                {editingCandidate ? "Edit Candidate" : "Add New Candidate"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition"
              >
                <MdClose className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input
                  type="text"
                  placeholder="Full Name *"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="px-5 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black outline-none"
                />
                <input
                  type="email"
                  placeholder="Email *"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="px-5 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black outline-none"
                />
                <input
                  type="text"
                  placeholder="Mobile"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  className="px-5 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black outline-none"
                />
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="px-5 py-3.5 border border-gray-300 rounded-xl"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                <input
                  type="text"
                  placeholder="Designation Applied For *"
                  required
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  className="px-5 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black outline-none"
                />
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="px-5 py-3.5 border border-gray-300 rounded-xl"
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  value={formData.dob}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                  className="px-5 py-3.5 border border-gray-300 rounded-xl"
                />
                <input
                  type="number"
                  min="1"
                  placeholder="Round"
                  value={formData.round}
                  onChange={(e) => setFormData({ ...formData, round: parseInt(e.target.value) || 1 })}
                  className="px-5 py-3.5 border border-gray-300 rounded-xl"
                />
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="px-5 py-3.5 border border-gray-300 rounded-xl md:col-span-2"
                >
                  <option value="screening">Screening</option>
                  <option value="interview">Interview</option>
                  <option value="technical">Technical Round</option>
                  <option value="hr_round">HR Round</option>
                  <option value="selected">Selected</option>
                  <option value="rejected">Rejected</option>
                  <option value="on_hold">On Hold</option>
                </select>
              </div>

              <textarea
                placeholder="Comments / Notes"
                value={formData.comments}
                onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                rows="4"
                className="w-full px-5 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black outline-none"
              />

              <div className="flex justify-end gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-8 py-3.5 border border-gray-300 rounded-xl hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-8 py-3.5 bg-black text-white rounded-xl hover:bg-gray-900 transition font-medium"
                >
                  {editingCandidate ? "Update" : "Save"} Candidate
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Recruitment;