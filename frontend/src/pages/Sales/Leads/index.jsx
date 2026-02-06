import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  MdAdd,
  MdDownload,
  MdEdit,
  MdDelete,
  MdClose,
  MdVisibility,
  MdKeyboardArrowDown,
} from "react-icons/md";
import { FiSearch } from "react-icons/fi";
import LayoutComponents from "../../../components/LayoutComponents";
import Input from "../../../components/Input";
import apiClient from "../../../helpers/apiClient";
import toast from "react-hot-toast";
import Loading from "../../../components/Loading";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";

const Leads = () => {
  const [leads, setLeads] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    status: "",
    agent: "",
  });

  const [companies, setCompanies] = useState([]);
  const [clients, setClients] = useState([]);
  const [agents, setAgents] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [editingLead, setEditingLead] = useState(null);

  const [formData, setFormData] = useState({
    company: "",
    company_name: "",
    client: "",
    client_name: "",
    client_email: "",
    lead_agent: "",
    lead_value: "",
    next_follow_up: false,
    follow_up_date: "",
    notes: "",
    status: "new_lead",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [leadsRes, compRes, clientRes, agentRes] = await Promise.all([
          apiClient.get("/sales/leads/"),
          apiClient.get("/sales/companies/"),
          apiClient.get("/sales/clients/"),
          apiClient.get("/auth/users/"),
        ]);

        const extract = (data) =>
          Array.isArray(data) ? data : data.results || [];
        setLeads(extract(leadsRes.data));
        setFiltered(extract(leadsRes.data));
        setCompanies(extract(compRes.data));
        setClients(extract(clientRes.data));
        setAgents(extract(agentRes.data));
      } catch (err) {
        toast.error("Failed to load leads data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    let result = leads;

    if (search) {
      const term = search.toLowerCase();
      result = result.filter(
        (l) =>
          l.client_name?.toLowerCase().includes(term) ||
          l.company_name?.toLowerCase().includes(term) ||
          l.client_email?.toLowerCase().includes(term)
      );
    }

    if (filters.status)
      result = result.filter((l) => l.status === filters.status);
    if (filters.agent)
      result = result.filter((l) => l.lead_agent === parseInt(filters.agent));

    setFiltered(result);
  }, [search, filters, leads]);

  const openModal = (lead = null) => {
    setEditingLead(lead);
    setFormData(
      lead
        ? {
          company: lead.company || "",
          company_name: lead.company_name || "",
          client: lead.client || "",
          client_name: lead.client_name || "",
          client_email: lead.client_email || "",
          lead_agent: lead.lead_agent || "",
          lead_value: lead.lead_value || "",
          next_follow_up: lead.next_follow_up || false,
          follow_up_date: lead.follow_up_date || "",
          notes: lead.notes || "",
          status: lead.status || "new_lead",
        }
        : {
          company: "",
          company_name: "",
          client: "",
          client_name: "",
          client_email: "",
          lead_agent: "",
          lead_value: "",
          next_follow_up: false,
          follow_up_date: "",
          notes: "",
          status: "new_lead",
        }
    );
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    const payload = {
      ...formData,
      company: formData.company,
      client: formData.client,
    };

    try {
      const res = editingLead
        ? await apiClient.put(`/sales/leads/${editingLead.id}/`, payload)
        : await apiClient.post("/sales/leads/", payload);

      if (editingLead) {
        setLeads((prev) =>
          prev.map((l) => (l.id === editingLead.id ? res.data : l))
        );
      } else {
        setLeads([res.data, ...leads]);
      }
      toast.success(`Lead ${editingLead ? "updated" : "added"} successfully!`);
      setShowModal(false);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to save lead");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this lead permanently?")) return;
    try {
      await apiClient.delete(`/sales/leads/${id}/`);
      setLeads((prev) => prev.filter((l) => l.id !== id));
      toast.success("Lead deleted");
    } catch (err) {
      toast.error("Failed to delete lead");
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      new_lead: "bg-blue-100 text-blue-800",
      connected: "bg-yellow-100 text-yellow-800",
      proposal_sent: "bg-purple-100 text-purple-800",
      closed_won: "bg-green-100 text-green-800",
      closed_lost: "bg-red-100 text-red-800",
    };
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${colors[status] || "bg-gray-100 text-gray-800"
          }`}
      >
        {status?.replace(/_/g, " ").toUpperCase() || "NEW LEAD"}
      </span>
    );
  };

  const exportToCSV = () => {
    const headers = [
      "Sl No",
      "Client Name",
      "Company",
      "Lead Value",
      "Next Follow Up",
      "Agent",
      "Status",
    ];
    const rows = filtered.map((l, i) => [
      i + 1,
      l.client_name || "",
      l.company_name || "",
      l.lead_value || 0,
      l.follow_up_date || "—",
      agents.find((a) => a.id === l.lead_agent)?.name || "",
      l.status?.replace(/_/g, " ").toUpperCase() || "",
    ]);

    const data = [headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Leads");
    XLSX.writeFile(wb, "leads.csv");
  };

  const exportToExcel = () => {
    const rows = filtered.map((l, i) => ({
      "Sl No": i + 1,
      "Client Name": l.client_name || "",
      Company: l.company_name || "",
      "Lead Value": l.lead_value || 0,
      "Next Follow Up": l.follow_up_date || "—",
      Agent: agents.find((a) => a.id === l.lead_agent)?.name || "",
      Status: l.status?.replace(/_/g, " ").toUpperCase() || "",
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Leads");
    XLSX.writeFile(wb, "leads.xlsx");
  };

  const exportToPDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(18);
    doc.text("Leads Report", 14, 15);
    doc.setFontSize(11);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 25);

    const tableColumns = [
      "Sl",
      "Client",
      "Company",
      "Value",
      "Follow Up",
      "Agent",
      "Status",
    ];
    const tableRows = filtered.map((l, i) => [
      i + 1,
      l.client_name || "—",
      l.company_name || "—",
      l.lead_value || 0,
      l.follow_up_date || "—",
      agents.find((a) => a.id === l.lead_agent)?.name || "—",
      l.status?.replace(/_/g, " ").toUpperCase() || "—",
    ]);

    doc.autoTable({
      head: [tableColumns],
      body: tableRows,
      startY: 35,
      theme: "grid",
      styles: { fontSize: 10 },
      headStyles: { fillColor: [0, 0, 0] },
    });

    doc.save("leads_report.pdf");
  };

  const agentOptions = agents.map((a) => ({
    value: a.id,
    label: `${a.name || `${a.first_name} ${a.last_name}`}`,
  }));

  if (loading) return <Loading />;

  return (
    <div className="p-6 min-h-screen">
      <LayoutComponents
        title="Sales Leads"
        subtitle="Manage your sales pipeline"
        variant="table"
      >
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-2xl">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by client, company, email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black outline-none transition"
                />
              </div>

              <div className="flex items-center gap-4">
                <Input
                  type="select"
                  value={filters.status}
                  onChange={(v) => setFilters({ ...filters, status: v })}
                  options={[
                    { value: "", label: "All Status" },
                    { value: "new_lead", label: "New Lead" },
                    { value: "connected", label: "Connected" },
                    { value: "proposal_sent", label: "Proposal Sent" },
                    { value: "closed_won", label: "Closed Won" },
                    { value: "closed_lost", label: "Closed Lost" },
                  ]}
                  placeholder="All Status"
                />
                <Input
                  type="select"
                  value={filters.agent}
                  onChange={(v) => setFilters({ ...filters, agent: v })}
                  options={[
                    { value: "", label: "All Agents" },
                    ...agentOptions,
                  ]}
                  placeholder="All Agents"
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
                  <button
                    onClick={exportToCSV}
                    className="w-full text-left px-5 py-3 hover:bg-gray-50 transition flex items-center gap-3"
                  >
                    <span className="text-green-600 font-medium">CSV</span>{" "}
                    Download as .csv
                  </button>
                  <button
                    onClick={exportToExcel}
                    className="w-full text-left px-5 py-3 hover:bg-gray-50 transition flex items-center gap-3"
                  >
                    <span className="text-green-700 font-medium">Excel</span>{" "}
                    Download as .xlsx
                  </button>
                  <button
                    onClick={exportToPDF}
                    className="w-full text-left px-5 py-3 hover:bg-gray-50 transition flex items-center gap-3 border-t"
                  >
                    <span className="text-red-600 font-medium">PDF</span>{" "}
                    Download as .pdf
                  </button>
                </div>
              </div>

              <button
                onClick={() => openModal()}
                className="flex items-center gap-3 px-6 py-3.5 bg-black text-white rounded-xl hover:bg-gray-900 transition font-medium"
              >
                <MdAdd className="w-5 h-5" /> Add Lead
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Sl No
                  </th>
                  <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Client Name
                  </th>
                  <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Lead Value
                  </th>
                  <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Next Follow Up
                  </th>
                  <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Lead Agent
                  </th>
                  <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-5 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
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
                        <p className="text-xl font-medium text-gray-700">
                          No leads found
                        </p>
                        <p className="text-gray-500 mt-2">
                          Try adjusting your search or filters
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((l, i) => (
                    <motion.tr
                      key={l.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="hover:bg-gray-50 transition"
                    >
                      <td className="px-6 py-5 font-medium text-gray-900">
                        {i + 1}
                      </td>
                      <td className="px-6 py-5 text-gray-900">
                        {l.client_name || "—"}
                      </td>
                      <td className="px-6 py-5 text-gray-700">
                        {l.company_name || "—"}
                      </td>
                      <td className="px-6 py-5 text-gray-700">
                        ₹{l.lead_value || 0}
                      </td>
                      <td className="px-6 py-5 text-gray-700">
                        {l.follow_up_date || "—"}
                      </td>
                      <td className="px-6 py-5 text-gray-700">
                        {agents.find((a) => a.id === l.lead_agent)?.name || "—"}
                      </td>
                      <td className="px-6 py-5">{getStatusBadge(l.status)}</td>
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() => openModal(l)}
                            className="p-2 hover:bg-amber-50 rounded-lg transition group"
                            title="Edit"
                          >
                            <MdEdit className="w-5 h-5 text-gray-600 group-hover:text-amber-600" />
                          </button>
                          <button
                            onClick={() => handleDelete(l.id)}
                            className="p-2 hover:bg-red-50 rounded-lg transition group"
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

      {/* Lead Modal */}
      {showModal && (
        <LayoutComponents
          variant="modal"
          title={editingLead ? "Edit Lead" : "Add New Lead"}
          onCloseModal={() => setShowModal(false)}
          modal={
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Company Selection */}
              <div>
                <h3 className="text-lg font-medium mb-4">Company Details</h3>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company *
                  </label>
                  <select
                    // value={clientForm.company}
                    // onChange={(e) =>
                    //   setClientForm({ ...clientForm, company: e.target.value })
                    // }
                    className="w-full px-5 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black outline-none"
                    required
                  >
                    <option value="">Select a company</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Client Selection */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client *
                </label>
                <select
                  value={formData.client}
                  onChange={(e) => {
                    const selected = clients.find(
                      (c) => c.id === parseInt(e.target.value)
                    );
                    setFormData({
                      ...formData,
                      client: e.target.value,
                      client_name: selected?.name || "",
                      client_email: selected?.email || "",
                    });
                  }}
                  className="w-full px-5 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black outline-none"
                  required
                >
                  <option value="">Select a client</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.email})
                    </option>
                  ))}
                </select>
                <Link
                  to="/sales/customer"
                  className="text-sm text-blue-600 hover:underline mt-2 inline-block"
                >
                  + Manage Clients
                </Link>
              </div>

              {/* Other Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Lead Agent"
                  type="select"
                  value={formData.lead_agent}
                  onChange={(v) => setFormData({ ...formData, lead_agent: v })}
                  options={agentOptions}
                  placeholder="Select agent"
                />

                <Input
                  label="Lead Value (₹)"
                  type="number"
                  value={formData.lead_value}
                  onChange={(e) =>
                    setFormData({ ...formData, lead_value: e.target.value })
                  }
                  placeholder="500000"
                />

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="next_follow_up"
                    checked={formData.next_follow_up}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        next_follow_up: e.target.checked,
                      })
                    }
                    className="w-5 h-5 rounded border-gray-400 text-black focus:ring-black"
                  />
                  <label
                    htmlFor="next_follow_up"
                    className="font-medium text-gray-700"
                  >
                    Next Follow Up
                  </label>
                </div>

                {formData.next_follow_up && (
                  <Input
                    label="Follow Up Date"
                    type="date"
                    value={formData.follow_up_date}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        follow_up_date: e.target.value,
                      })
                    }
                  />
                )}

                <Input
                  label="Status"
                  type="select"
                  value={formData.status}
                  onChange={(v) => setFormData({ ...formData, status: v })}
                  options={[
                    { value: "new_lead", label: "New Lead" },
                    { value: "connected", label: "Connected" },
                    { value: "proposal_sent", label: "Proposal Sent" },
                    { value: "closed_won", label: "Closed Won" },
                    { value: "closed_lost", label: "Closed Lost" },
                  ]}
                  className="md:col-span-2"
                />
              </div>

              <Input
                label="Notes"
                type="textarea"
                rows={4}
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Additional notes about this lead..."
              />

              <div className="flex justify-end gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-8 py-3.5 border border-gray-300 rounded-xl hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-8 py-3.5 bg-black text-white rounded-xl hover:bg-gray-900 disabled:opacity-50"
                >
                  {formLoading
                    ? "Saving..."
                    : editingLead
                      ? "Update Lead"
                      : "Save Lead"}
                </button>
              </div>
            </form>
          }
        />
      )}
    </div>
  );
};

export default Leads;
