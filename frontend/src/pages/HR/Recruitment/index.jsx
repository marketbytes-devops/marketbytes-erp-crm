// src/pages/hr/recruitment/Recruitment.jsx
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { MdAdd, MdDownload, MdEdit, MdDelete, MdClose, MdKeyboardArrowDown, MdVisibility } from "react-icons/md";
import { FiSearch, FiCheck } from "react-icons/fi";
import { usePermission } from "../../../context/PermissionContext";
import LayoutComponents from "../../../components/LayoutComponents";
import Input from "../../../components/Input";
import apiClient from "../../../helpers/apiClient";
import toast from "react-hot-toast";
import Loading from "../../../components/Loading";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";

const Recruitment = () => {
  const { hasPermission } = usePermission();
  const [candidates, setCandidates] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    status: "",
    department: "",
  });

  const [departments, setDepartments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState(null);

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [candRes, deptRes] = await Promise.all([
          apiClient.get("/hr/candidates/"),
          apiClient.get("/auth/departments/"),
        ]);

        const extract = (data) => (Array.isArray(data) ? data : data.results || []);
        setCandidates(extract(candRes.data));
        setFiltered(extract(candRes.data));
        setDepartments(extract(deptRes.data));
      } catch (err) {
        toast.error("Failed to load recruitment data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    let result = candidates;

    if (search) {
      const term = search.toLowerCase();
      result = result.filter(c =>
        c.name?.toLowerCase().includes(term) ||
        c.email?.toLowerCase().includes(term) ||
        c.mobile?.toLowerCase().includes(term) ||
        c.designation?.toLowerCase().includes(term)
      );
    }

    if (filters.status) result = result.filter(c => c.status === filters.status);
    if (filters.department) result = result.filter(c => c.department === parseInt(filters.department));

    setFiltered(result);
  }, [search, filters, candidates]);

  const openModal = (candidate = null) => {
    setEditingCandidate(candidate);
    setFormData(candidate ? {
      name: candidate.name || "",
      email: candidate.email || "",
      mobile: candidate.mobile || "",
      gender: candidate.gender || "male",
      designation: candidate.designation || "",
      department: candidate.department || "",
      dob: candidate.dob || "",
      comments: candidate.comments || "",
      round: candidate.round || 1,
      status: candidate.status || "screening",
      offered: candidate.offered || false,
    } : {
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
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    const data = { ...formData };
    const request = editingCandidate
      ? apiClient.put(`/hr/candidates/${editingCandidate.id}/`, data)
      : apiClient.post("/hr/candidates/", data);

    try {
      const res = await request;
      if (editingCandidate) {
        setCandidates(prev => prev.map(c => c.id === editingCandidate.id ? res.data : c));
      } else {
        setCandidates([res.data, ...candidates]);
      }
      toast.success(`Candidate ${editingCandidate ? "updated" : "added"} successfully!`);
      setShowModal(false);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to save candidate");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this candidate permanently?")) return;
    try {
      await apiClient.delete(`/hr/candidates/${id}/`);
      setCandidates(prev => prev.filter(c => c.id !== id));
      toast.success("Candidate deleted");
    } catch (err) {
      toast.error("Failed to delete candidate");
    }
  };

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
        {status?.replace(/_/g, " ").toUpperCase() || "SCREENING"}
      </span>
    );
  };

  // Export Functions
  const exportToCSV = () => {
    const headers = ["Name", "Email", "Mobile", "Designation", "Department", "Status", "Round"];
    const rows = filtered.map(c => [
      c.name || "",
      c.email || "",
      c.mobile || "",
      c.designation || "",
      departments.find(d => d.id === c.department)?.name || "",
      c.status?.replace(/_/g, " ").toUpperCase() || "",
      c.round || 1,
    ]);

    const data = [headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Candidates");
    XLSX.writeFile(wb, "candidates.csv");
  };

  const exportToExcel = () => {
    const rows = filtered.map(c => ({
      Name: c.name || "",
      Email: c.email || "",
      Mobile: c.mobile || "",
      Designation: c.designation || "",
      Department: departments.find(d => d.id === c.department)?.name || "",
      Status: c.status?.replace(/_/g, " ").toUpperCase() || "",
      Round: c.round || 1,
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
    const tableRows = filtered.map(c => [
      c.name || "—",
      c.email || "—",
      c.mobile || "—",
      c.designation || "—",
      departments.find(d => d.id === c.department)?.name || "—",
      c.status?.replace(/_/g, " ").toUpperCase() || "—",
      c.round || 1,
    ]);

    doc.autoTable({
      head: [tableColumns],
      body: tableRows,
      startY: 35,
      theme: "grid",
      styles: { fontSize: 10 },
      headStyles: { fillColor: [0, 0, 0] },
    });

    doc.save("candidates_report.pdf");
  };

  const departmentOptions = departments.map(d => ({ value: d.id, label: d.name }));
  const statusOptions = [
    { value: "", label: "All Status" },
    { value: "screening", label: "Screening" },
    { value: "interview", label: "Interview" },
    { value: "technical", label: "Technical Round" },
    { value: "hr_round", label: "HR Round" },
    { value: "selected", label: "Selected" },
    { value: "rejected", label: "Rejected" },
    { value: "on_hold", label: "On Hold" },
  ];

  if (loading) return <Loading />;

  return (
    <div className="p-6 min-h-screen">
      <LayoutComponents title="Recruitment" subtitle="Manage your hiring pipeline" variant="table">
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-2xl">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search candidates..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black outline-none transition"
                />
              </div>

              <div className="flex items-center gap-4">
                <Input
                  type="select"
                  value={filters.status}
                  onChange={v => setFilters({ ...filters, status: v })}
                  options={statusOptions}
                  placeholder="All Status"
                />
                <Input
                  type="select"
                  value={filters.department}
                  onChange={v => setFilters({ ...filters, department: v })}
                  options={[{ value: "", label: "All Departments" }, ...departmentOptions]}
                  placeholder="All Departments"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <div className="relative group">
                <button className="flex items-center gap-3 px-6 py-3.5 border border-gray-300 rounded-xl hover:bg-gray-50 transition font-medium">
                  <MdDownload className="w-5 h-5" /> Export
                  <MdKeyboardArrowDown className="w-5 h-5 transition-transform group-hover:rotate-180" />
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                  <button onClick={exportToCSV} className="w-full text-left px-5 py-3 hover:bg-gray-50 transition flex items-center gap-3">
                    <span className="text-green-600 font-medium">CSV</span> Download as .csv
                  </button>
                  <button onClick={exportToExcel} className="w-full text-left px-5 py-3 hover:bg-gray-50 transition flex items-center gap-3">
                    <span className="text-green-700 font-medium">Excel</span> Download as .xlsx
                  </button>
                  <button onClick={exportToPDF} className="w-full text-left px-5 py-3 hover:bg-gray-50 transition flex items-center gap-3">
                    <span className="text-red-600 font-medium">PDF</span> Download as .pdf
                  </button>
                </div>
              </div>

              {hasPermission("recruitment", "add") && (
                <button
                  onClick={() => openModal()}
                  className="flex items-center gap-3 px-6 py-3.5 bg-black text-white rounded-xl hover:bg-gray-900 transition font-medium"
                >
                  <MdAdd className="w-5 h-5" /> Add Candidate
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Mobile</th>
                  <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Designation</th>
                  <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-5 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">Round</th>
                  <th className="px-6 py-5 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-24">
                      <div className="flex flex-col items-center">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-5">
                          <MdVisibility className="w-10 h-10 text-gray-400" />
                        </div>
                        <p className="text-xl font-medium text-gray-700">No candidates found</p>
                        <p className="text-gray-500 mt-2">Try adjusting your search or filters</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((c, i) => (
                    <motion.tr
                      key={c.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="hover:bg-gray-50 transition"
                    >
                      <td className="px-6 py-5 font-medium text-gray-900">{c.name || "—"}</td>
                      <td className="px-6 py-5 text-gray-700">{c.email || "—"}</td>
                      <td className="px-6 py-5 text-gray-700">{c.mobile || "—"}</td>
                      <td className="px-6 py-5 text-gray-700">{c.designation || "—"}</td>
                      <td className="px-6 py-5">
                        <span className="px-3 py-1.5 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                          {departments.find(d => d.id === c.department)?.name || "—"}
                        </span>
                      </td>
                      <td className="px-6 py-5">{getStatusBadge(c.status)}</td>
                      <td className="px-6 py-5 text-center font-medium">{c.round || 1}</td>
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-center gap-3">
                          {hasPermission("recruitment", "edit") && (
                            <button
                              onClick={() => openModal(c)}
                              className="p-2 hover:bg-amber-50 rounded-lg transition group"
                              title="Edit"
                            >
                              <MdEdit className="w-5 h-5 text-gray-600 group-hover:text-amber-600" />
                            </button>
                          )}
                          {hasPermission("recruitment", "delete") && (
                            <button
                              onClick={() => handleDelete(c.id)}
                              className="p-2 hover:bg-red-50 rounded-lg transition group"
                              title="Delete"
                            >
                              <MdDelete className="w-5 h-5 text-gray-600 group-hover:text-red-600" />
                            </button>
                          )}
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

      {/* Modal */}
      {showModal && (
        <LayoutComponents
          variant="modal"
          title={editingCandidate ? "Edit Candidate" : "Add New Candidate"}
          onCloseModal={() => setShowModal(false)}
          modal={
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Full Name"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                />
                <Input
                  label="Email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@example.com"
                />
                <Input
                  label="Mobile Number"
                  value={formData.mobile}
                  onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                  placeholder="9876543210"
                />
                <Input
                  label="Gender"
                  type="select"
                  value={formData.gender}
                  onChange={v => setFormData({ ...formData, gender: v })}
                  options={[
                    { value: "male", label: "Male" },
                    { value: "female", label: "Female" },
                    { value: "other", label: "Other" },
                  ]}
                />
                <Input
                  label="Designation"
                  required
                  value={formData.designation}
                  onChange={e => setFormData({ ...formData, designation: e.target.value })}
                  placeholder="Software Engineer"
                />
                <Input
                  label="Department"
                  type="select"
                  value={formData.department}
                  onChange={v => setFormData({ ...formData, department: v })}
                  options={departmentOptions}
                  placeholder="Select Department"
                />
                <Input
                  label="Date of Birth"
                  type="date"
                  value={formData.dob}
                  onChange={e => setFormData({ ...formData, dob: e.target.value })}
                />
                <Input
                  label="Current Round"
                  type="number"
                  min="1"
                  value={formData.round}
                  onChange={e => setFormData({ ...formData, round: parseInt(e.target.value) || 1 })}
                />
              </div>

              <Input
                label="Status"
                type="select"
                value={formData.status}
                onChange={v => setFormData({ ...formData, status: v })}
                options={statusOptions.slice(1)}
              />

              <Input
                label="Comments / Notes"
                type="textarea"
                rows={4}
                value={formData.comments}
                onChange={e => setFormData({ ...formData, comments: e.target.value })}
                placeholder="Any additional notes..."
              />

              <div className="flex justify-end gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-900 transition disabled:opacity-50"
                >
                  {formLoading ? "Saving..." : editingCandidate ? "Update Candidate" : "Add Candidate"}
                </button>
              </div>
            </form>
          }
        />
      )}
    </div>
  );
};

export default Recruitment;