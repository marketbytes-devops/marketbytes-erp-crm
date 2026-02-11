import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router";
import { MdVisibility, MdEdit, MdDelete, MdDownload, MdAdd, MdFilterList, MdClose, MdKeyboardArrowDown } from "react-icons/md";
import { FiSearch, FiCheck } from "react-icons/fi";
import LayoutComponents from "../../../components/LayoutComponents";
import apiClient from "../../../helpers/apiClient";
import Loading from "../../../components/Loading";
import toast from "react-hot-toast";
import Input from "../../../components/Input";
import autoTable from "jspdf-autotable";
import { usePermission } from "../../../context/PermissionContext";

const EmployeeView = () => {
  const [employees, setEmployees] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const { hasPermission } = usePermission();

  const [filters, setFilters] = useState({
    status: "",
    selectedEmployee: "",
    skills: "",
    role: "",
    designation: "",
    department: "",
  });

  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [allSkills, setAllSkills] = useState([]);
  const [designations, setDesignations] = useState([]);


  const exportCSV = () => {
    if (!filtered.length) {
      toast.error("No employees to export");
      return;
    }

    const headers = [
      "Employee ID",
      "Name",
      "Email",
      "Department",
      "Role",
      "Status"
    ];

    const rows = filtered.map(emp => [
      emp.employee_id || "",
      emp.name || "",
      emp.email || "",
      emp.department?.name || "",
      emp.role?.name || "",
      emp.status || ""
    ]);

    const csv =
      [headers, ...rows]
        .map(row => row.map(v => `"${v}"`).join(","))
        .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "employees.csv";
    a.click();

    URL.revokeObjectURL(url);
    setShowExport(false);
  };
  const exportPDF = () => {
    if (!filtered.length) {
      toast.error("No employees to export");
      return;
    }

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "pt",
      format: "a4",
    });

    doc.setFontSize(18);
    doc.text("Employee List", 40, 40);

    const columns = [
      "Employee ID",
      "Name",
      "Email",
      "Department",
      "Role",
      "Status",
    ];

    const rows = filtered.map((emp) => [
      emp.employee_id || "-",
      emp.name || "-",
      emp.email || "-",
      emp.department?.name || "-",
      emp.role?.name || "-",
      emp.status || "-",
    ]);

    autoTable(doc, {
      head: [columns],
      body: rows,
      startY: 70,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [0, 0, 0] },
    });

    doc.save("employees.pdf");
    setShowExport(false);
  };

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [empRes, deptRes, roleRes] = await Promise.all([
          apiClient.get("/auth/users/"),
          apiClient.get("/auth/departments/"),
          apiClient.get("/auth/roles/"),
        ]);

        const extract = (d) => (Array.isArray(d) ? d : d.results || []);
        const emps = extract(empRes.data);

        setEmployees(emps);
        setFiltered(emps);
        setDepartments(extract(deptRes.data));
        setRoles(extract(roleRes.data));

        const skillsSet = new Set();
        emps.forEach(emp => {
          if (emp.skills) {
            emp.skills.split(',').forEach(s => {
              const skill = s.trim();
              if (skill) skillsSet.add(skill);
            });
          }
        });
        setAllSkills(Array.from(skillsSet).sort());

        const desSet = new Set();
        emps.forEach(emp => emp.role?.name && desSet.add(emp.role.name));
        setDesignations(Array.from(desSet).sort());

      } catch (err) {
        toast.error("Failed to load data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  useEffect(() => {
    let result = employees;

    if (search) {
      const term = search.toLowerCase();
      result = result.filter(e =>
        e.name?.toLowerCase().includes(term) ||
        e.email?.toLowerCase().includes(term) ||
        e.username?.toLowerCase().includes(term) ||
        e.employee_id?.toLowerCase().includes(term) ||
        e.department?.name?.toLowerCase().includes(term) ||
        e.role?.name?.toLowerCase().includes(term)
      );
    }

    if (filters.status) result = result.filter(e => e.status === filters.status);
    if (filters.selectedEmployee) result = result.filter(e => e.id === parseInt(filters.selectedEmployee));
    if (filters.skills) result = result.filter(e => e.skills?.toLowerCase().includes(filters.skills.toLowerCase()));
    if (filters.role) result = result.filter(e => e.role?.id === parseInt(filters.role));
    if (filters.designation) result = result.filter(e => e.role?.name === filters.designation);
    if (filters.department) result = result.filter(e => e.department?.id === parseInt(filters.department));

    setFiltered(result);
  }, [search, filters, employees]);

  const getDepartmentName = (emp) => emp.department?.name || "—";
  const getRoleName = (emp) => emp.role?.name || "No Role";
  const getImageUrl = (emp) => emp.image_url || emp.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name || emp.email)}&background=2563eb&color=fff&bold=true`;

  const handleDelete = async (id) => {
    if (!window.confirm("Terminate this employee?")) return;
    try {
      await apiClient.delete(`/auth/users/${id}/`);
      setEmployees(prev => prev.filter(e => e.id !== id));
      toast.success("Employee terminated");
    } catch (err) {
      toast.error("Failed to terminate");
    }
  };

  const handleFilterChange = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));
  const resetFilters = () => {
    setFilters({ status: "", selectedEmployee: "", skills: "", role: "", designation: "", department: "" });
    setSearch("");
  };
  const activeCount = Object.values(filters).filter(v => v !== "").length;

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loading /></div>;

  return (
    <div className="p-6">
      <LayoutComponents title="Employees" subtitle="Manage your workforce" variant="table">
        <div className="max-w-full mx-auto">
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex items-center gap-4 flex-1">
                <div className="relative flex-1 max-w-2xl">
                  <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by name, email, ID, department, role..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black outline-none text-base transition"
                  />
                </div>

                <button
                  onClick={() => setFiltersOpen(!filtersOpen)}
                  className="flex items-center gap-3 px-5 py-4 border border-gray-300 rounded-xl hover:bg-gray-50 transition text-sm font-medium whitespace-nowrap"
                >
                  <MdFilterList className="w-5 h-5" />
                  Filters
                  {activeCount > 0 && (
                    <span className="ml-2 bg-black text-white text-xs font-medium rounded-full w-6 h-6 flex items-center justify-center">
                      {activeCount}
                    </span>
                  )}
                  <MdKeyboardArrowDown className={`w-5 h-5 transition-transform ${filtersOpen ? "rotate-180" : ""}`} />
                </button>

                <span className="text-sm font-medium text-gray-600 hidden lg:block">
                  {filtered.length} {filtered.length === 1 ? "employee" : "employees"}
                </span>
              </div>

              <div className="flex gap-3">
                <div className="relative">
                  <button
                    onClick={() => setShowExport(prev => !prev)}
                    className="flex items-center gap-2 px-5 py-4 border border-gray-300 rounded-xl hover:bg-gray-50 transition text-sm font-medium"
                  >
                    <MdDownload className="w-5 h-5" />
                    Export
                    <MdKeyboardArrowDown className="w-4 h-4" />
                  </button>

                  <AnimatePresence>
                    {showExport && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-50"
                      >
                        <button
                          onClick={exportCSV}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm"
                        >
                          Export CSV
                        </button>

                        <button
                          onClick={exportCSV}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm"
                        >
                          Export Excel
                        </button>

                        <button
                          onClick={exportPDF}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm"
                        >
                          Export PDF
                        </button>

                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {hasPermission("employees", "add") && (
                  <Link
                    to="/hr/employees/create"
                    className="flex items-center gap-3 px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-900 transition text-sm font-medium"
                  >
                    <MdAdd className="w-5 h-5" /> Add Employee
                  </Link>
                )}
              </div>
            </div>
          </div>
          <AnimatePresence>
            {filtersOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden mb-6"
              >
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-medium text-gray-900">Advanced Filters</h3>
                    <button onClick={() => setFiltersOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg transition">
                      <MdClose className="w-6 h-6 text-gray-600" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    <Input
                      label="Status"
                      type="select"
                      value={filters.status}
                      onChange={(val) => handleFilterChange("status", val)}
                      options={[
                        { label: "All Status", value: "" },
                        { label: "Active", value: "active" },
                        { label: "Inactive", value: "inactive" },
                        { label: "Terminated", value: "terminated" },
                      ]}
                      placeholder="Select status"
                    />

                    <Input
                      label="Employee"
                      type="select"
                      value={filters.selectedEmployee}
                      onChange={(val) => handleFilterChange("selectedEmployee", val)}
                      options={[
                        { label: "All Employees", value: "" },
                        ...employees.map(emp => ({
                          label: `${emp.name} (${emp.employee_id})`,
                          value: emp.id
                        }))
                      ]}
                      placeholder="Select employee"
                    />

                    <Input
                      label="Skills"
                      type="select"
                      value={filters.skills}
                      onChange={(val) => handleFilterChange("skills", val)}
                      options={[
                        { label: "All Skills", value: "" },
                        ...allSkills.map(skill => ({ label: skill, value: skill }))
                      ]}
                      placeholder="Select skill"
                    />

                    <Input
                      label="Role"
                      type="select"
                      value={filters.role}
                      onChange={(val) => handleFilterChange("role", val)}
                      options={[
                        { label: "All Roles", value: "" },
                        ...roles.map(role => ({ label: role.name, value: role.id }))
                      ]}
                      placeholder="Select role"
                    />

                    <Input
                      label="Designation"
                      type="select"
                      value={filters.designation}
                      onChange={(val) => handleFilterChange("designation", val)}
                      options={[
                        { label: "All Designations", value: "" },
                        ...designations.map(d => ({ label: d, value: d }))
                      ]}
                      placeholder="Select designation"
                    />

                    <Input
                      label="Department"
                      type="select"
                      value={filters.department}
                      onChange={(val) => handleFilterChange("department", val)}
                      options={[
                        { label: "All Departments", value: "" },
                        ...departments.map(dept => ({ label: dept.name, value: dept.id }))
                      ]}
                      placeholder="Select department"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 mt-8 pt-6 border-t border-gray-200">
                    <button className="flex items-center justify-center gap-2 px-6 py-3.5 bg-black text-white font-medium rounded-xl hover:bg-gray-900 transition">
                      <FiCheck className="w-5 h-5" /> Apply Filters
                    </button>
                    <button onClick={resetFilters} className="px-6 py-3.5 border-2 border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition">
                      Reset All Filters
                    </button>
                  </div>

                  {activeCount > 0 && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <p className="text-sm font-medium text-gray-700 mb-3">Active Filters:</p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(filters).map(([k, v]) => {
                          if (!v) return null;
                          let label = v;
                          if (k === "selectedEmployee") label = employees.find(e => e.id === parseInt(v))?.name || v;
                          if (k === "role") label = roles.find(r => r.id === parseInt(v))?.name || v;
                          if (k === "department") label = departments.find(d => d.id === parseInt(v))?.name || v;
                          return (
                            <span key={k} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                              {label}
                              <button onClick={() => handleFilterChange(k, "")} className="hover:text-blue-900">×</button>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Table */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">ID</th>
                    <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">Employee</th>
                    <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">Email</th>
                    <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">Department</th>
                    <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">Role</th>
                    <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">Status</th>
                    <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-24">
                        <div className="flex flex-col items-center">
                          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-5">
                            <MdFilterList className="w-10 h-10 text-gray-400" />
                          </div>
                          <p className="text-xl font-medium text-gray-700">No employees found</p>
                          <p className="text-gray-500 mt-2">Try adjusting your your search or filters</p>
                          {(search || activeCount > 0) && (
                            <button onClick={resetFilters} className="mt-5 px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-900 transition font-medium">
                              Clear all filters
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((emp, i) => (
                      <motion.tr
                        key={emp.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="hover:bg-gray-50 transition"
                      >
                        <td className="px-6 py-5 text-sm font-medium text-blue-600 whitespace-nowrap">{emp.employee_id}</td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="flex items-center gap-4">
                            <img src={getImageUrl(emp)} alt={emp.name} className="w-12 h-12 rounded-full object-cover shadow-md" />
                            <div>
                              <Link to={`/hr/employees/${emp.id}`} className="font-medium text-gray-900 hover:text-blue-600 transition">
                                {emp.name}
                              </Link>
                              {emp.username && <p className="text-sm text-gray-500">@{emp.username}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-sm text-gray-700 whitespace-nowrap">{emp.email}</td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <span className="px-3 py-1.5 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                            {getDepartmentName(emp)}
                          </span>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <span className="px-3 py-1.5 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                            {getRoleName(emp)}
                          </span>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${emp.status === "active" ? "bg-green-100 text-green-800" :
                            emp.status === "inactive" ? "bg-yellow-100 text-yellow-800" :
                              "bg-red-100 text-red-800"
                            }`}>
                            {emp.status || "active"}
                          </span>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <Link to={`/hr/employees/${emp.id}`} className="p-2 hover:bg-blue-50 rounded-lg transition group">
                              <MdVisibility className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
                            </Link>

                            {hasPermission("employees", "edit") && (
                              <Link to={`/hr/employees/${emp.id}/edit`} className="p-2 hover:bg-amber-50 rounded-lg transition group">
                                <MdEdit className="w-5 h-5 text-gray-600 group-hover:text-amber-600" />
                              </Link>
                            )}

                            {hasPermission("employees", "delete") && (
                              <button onClick={() => handleDelete(emp.id)} className="p-2 hover:bg-red-50 rounded-lg transition group">
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

            {filtered.length > 0 && (
              <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-3 text-sm text-gray-600">
                <span>Showing {filtered.length} of {employees.length} employees</span>
                {activeCount > 0 && (
                  <button onClick={resetFilters} className="text-blue-600 hover:text-blue-800 font-medium">
                    Clear all filters
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </LayoutComponents>
    </div>
  );
};

export default EmployeeView;