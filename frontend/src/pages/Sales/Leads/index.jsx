import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import LayoutComponents from "../../../components/LayoutComponents";
import apiClient from "../../../helpers/apiClient";
import { MdAdd, MdDownload, MdEdit, MdDelete, MdClose, MdKeyboardArrowDown } from "react-icons/md";
import Select from "react-select";

// Export libraries
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";

const Leads = () => {
  const [leads, setLeads] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [clients, setClients] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingLead, setEditingLead] = useState(null);

  // Company Modal
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [selectedCompany, setSelectedCompany] = useState(null);

  // Client Modal
  const [showClientModal, setShowClientModal] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [selectedClient, setSelectedClient] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [agentFilter, setAgentFilter] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    company: "",
    company_name: "",
    client: "",
    client_name: "",
    client_email: "",
    website: "",
    mobile: "",
    office_phone: "",
    city: "",
    state: "",
    country: "",
    postal_code: "",
    industry: "",
    lead_agent: "",
    lead_source: "",
    lead_category: "",
    lead_team: "",
    lead_value: "",
    next_follow_up: false,
    follow_up_date: "",
    notes: "",
    status: "new_lead",
  });

  const fetchSupportingData = async () => {
    try {
      const [compRes, clientRes, agentRes] = await Promise.all([
        apiClient.get("/sales/companies/"),
        apiClient.get("/sales/clients/"),
        apiClient.get("/hr/employees/"),
      ]);
      setCompanies(compRes.data.results || compRes.data || []);
      setClients(clientRes.data.results || clientRes.data || []);
      setAgents(agentRes.data.results || agentRes.data || []);
    } catch (err) {
      console.error("Failed to load supporting data:", err);
    }
  };

  useEffect(() => {
    const fetchLeads = async () => {
      setLoading(true);
      try {
        let url = "/sales/leads/";
        const params = new URLSearchParams();
        if (searchQuery) params.append("search", searchQuery);
        if (statusFilter) params.append("status", statusFilter);
        if (agentFilter) params.append("lead_agent", agentFilter);
        if (params.toString()) url += `?${params.toString()}`;

        const res = await apiClient.get(url);
        const data = res.data.results || res.data;
        setLeads(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setLeads([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLeads();
  }, [searchQuery, statusFilter, agentFilter]);

  useEffect(() => {
    fetchSupportingData();
  }, []);

  const openModal = async (lead = null) => {
    await fetchSupportingData();

    if (lead) {
      setEditingLead(lead);

      const companyObj = companies.find(c => c.id === lead.company) || { id: lead.company, name: lead.company_name };
      setSelectedCompany(companyObj ? { value: companyObj.id, label: companyObj.name } : null);

      const clientObj = clients.find(c => c.id === lead.client) || null;
      setSelectedClient(clientObj ? { value: clientObj.id, label: `${clientObj.name} (${clientObj.email})` } : null);

      setFormData({
        company: lead.company || "",
        company_name: lead.company_name || "",
        client: lead.client || "",
        client_name: lead.client_name || "",
        client_email: lead.client_email || "",
        website: lead.website || "",
        mobile: lead.mobile || "",
        office_phone: lead.office_phone || "",
        city: lead.city || "",
        state: lead.state || "",
        country: lead.country || "",
        postal_code: lead.postal_code || "",
        industry: lead.industry || "",
        lead_agent: lead.lead_agent || "",
        lead_source: lead.lead_source || "",
        lead_category: lead.lead_category || "",
        lead_team: lead.lead_team || "",
        lead_value: lead.lead_value || "",
        next_follow_up: lead.next_follow_up || false,
        follow_up_date: lead.follow_up_date || "",
        notes: lead.notes || "",
        status: lead.status || "new_lead",
      });
    } else {
      setEditingLead(null);
      setSelectedCompany(null);
      setSelectedClient(null);
      setFormData({
        company: "",
        company_name: "",
        client: "",
        client_name: "",
        client_email: "",
        website: "",
        mobile: "",
        office_phone: "",
        city: "",
        state: "",
        country: "",
        postal_code: "",
        industry: "",
        lead_agent: "",
        lead_source: "",
        lead_category: "",
        lead_team: "",
        lead_value: "",
        next_follow_up: false,
        follow_up_date: "",
        notes: "",
        status: "new_lead",
      });
    }
    setShowModal(true);
  };

  const handleCompanyChange = (selectedOption) => {
    if (selectedOption && selectedOption.__isNew__) {
      setNewCompanyName(selectedOption.label);
      setShowCompanyModal(true);
    } else {
      setSelectedCompany(selectedOption);
      setFormData({
        ...formData,
        company: selectedOption ? selectedOption.value : "",
        company_name: selectedOption ? selectedOption.label : "",
      });
    }
  };

  const handleAddCompany = async () => {
    if (!newCompanyName.trim()) {
      alert("Company name is required");
      return;
    }
    try {
      const res = await apiClient.post("/sales/companies/", { name: newCompanyName.trim() });
      const newComp = res.data;
      setCompanies([...companies, newComp]);
      setSelectedCompany({ value: newComp.id, label: newComp.name });
      setFormData({ ...formData, company: newComp.id, company_name: newComp.name });
      setShowCompanyModal(false);
      setNewCompanyName("");
    } catch (err) {
      alert("Error adding company");
    }
  };

  const handleClientChange = (selectedOption) => {
    if (selectedOption && selectedOption.__isNew__) {
      setNewClientName(selectedOption.label);
      setNewClientEmail("");
      setShowClientModal(true);
    } else {
      setSelectedClient(selectedOption);
      const name = selectedOption ? selectedOption.label.split(" (")[0] : "";
      const email = selectedOption ? selectedOption.label.match(/\((.*)\)/)?.[1] || "" : "";
      setFormData({
        ...formData,
        client: selectedOption ? selectedOption.value : "",
        client_name: name,
        client_email: email,
      });
    }
  };

  const handleAddClient = async () => {
    if (!newClientName.trim() || !newClientEmail.trim()) {
      alert("Name and Email are required");
      return;
    }
    try {
      const res = await apiClient.post("/sales/clients/", {
        name: newClientName.trim(),
        email: newClientEmail.trim(),
      });
      const newClient = res.data;
      setClients([...clients, newClient]);
      setSelectedClient({ value: newClient.id, label: `${newClient.name} (${newClient.email})` });
      setFormData({
        ...formData,
        client: newClient.id,
        client_name: newClient.name,
        client_email: newClient.email,
      });
      setShowClientModal(false);
      setNewClientName("");
      setNewClientEmail("");
    } catch (err) {
      alert("Error adding client");
    }
  };

  const handleSave = (e) => {
    e.preventDefault();

    const payload = {
      ...formData,
      company: selectedCompany ? selectedCompany.value : formData.company,
      client: selectedClient ? selectedClient.value : formData.client,
    };

    const request = editingLead
      ? apiClient.put(`/sales/leads/${editingLead.id}/`, payload)
      : apiClient.post("/sales/leads/", payload);

    request
      .then((res) => {
        if (editingLead) {
          setLeads(leads.map((l) => (l.id === editingLead.id ? res.data : l)));
        } else {
          setLeads([res.data, ...leads]);
        }
        setShowModal(false);
        alert(`Lead ${editingLead ? "updated" : "added"} successfully!`);
      })
      .catch((err) => {
        console.error(err.response?.data);
        alert("Error saving lead");
      });
  };

  const handleDelete = (id) => {
    if (!window.confirm("Are you sure you want to delete this lead?")) return;
    apiClient.delete(`/sales/leads/${id}/`).then(() => {
      setLeads(leads.filter((l) => l.id !== id));
    });
  };

  const statusColors = {
    new_lead: "bg-blue-100 text-blue-800",
    connected: "bg-yellow-100 text-yellow-800",
    proposal_sent: "bg-purple-100 text-purple-800",
    closed_won: "bg-green-100 text-green-800",
    closed_lost: "bg-red-100 text-red-800",
  };

  const companyOptions = companies.map(c => ({ value: c.id, label: c.name }));
  const clientOptions = clients.map(c => ({ value: c.id, label: `${c.name} (${c.email})` }));

  const exportToCSV = () => {
    const headers = ["Sl No", "Client Name", "Company", "Lead Value", "Next Follow Up", "Agent", "Status"];
    const rows = leads.map((l, i) => [
      i + 1,
      l.client_name || "",
      l.company_name || "",
      l.lead_value || 0,
      l.follow_up_date || "—",
      l.lead_agent_name || "",
      (l.status || "").replace("_", " ").toUpperCase(),
    ]);
    const data = [headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Leads");
    XLSX.writeFile(wb, "leads.csv");
  };

  const exportToExcel = () => {
    const rows = leads.map((l, i) => ({
      "Sl No": i + 1,
      "Client Name": l.client_name || "",
      Company: l.company_name || "",
      "Lead Value": l.lead_value || 0,
      "Next Follow Up": l.follow_up_date || "—",
      Agent: l.lead_agent_name || "",
      Status: (l.status || "").replace("_", " ").toUpperCase(),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Leads");
    XLSX.writeFile(wb, "leads.xlsx");
  };

  const exportToPDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.text("Leads Report", 14, 15);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 25);

    const tableColumns = ["Sl", "Client", "Company", "Value", "Follow Up", "Agent", "Status"];
    const tableRows = leads.map((l, i) => [
      i + 1,
      l.client_name || "—",
      l.company_name || "—",
      l.lead_value || 0,
      l.follow_up_date || "—",
      l.lead_agent_name || "—",
      (l.status || "").replace("_", " ").toUpperCase(),
    ]);

    doc.autoTable({ head: [tableColumns], body: tableRows, startY: 35 });
    doc.save("leads.pdf");
  };

  return (
    <div className="p-6">
      <LayoutComponents title="Sales Leads" subtitle="Manage your sales pipeline" variant="card">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h3 className="text-xl font-medium">All Leads</h3>
            <div className="flex gap-3">
              <div className="relative group">
                <button className="flex items-center gap-3 px-6 py-3.5 border border-gray-300 rounded-xl hover:bg-gray-50 transition font-medium">
                  <MdDownload className="w-5 h-5" /> Export
                  <MdKeyboardArrowDown className="w-5 h-5 transition-transform group-hover:rotate-180" />
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                  <button onClick={exportToCSV} className="w-full text-left px-5 py-3 hover:bg-gray-50 flex items-center gap-3">
                    <span className="text-green-600">CSV</span> Download .csv
                  </button>
                  <button onClick={exportToExcel} className="w-full text-left px-5 py-3 hover:bg-gray-50 flex items-center gap-3">
                    <span className="text-green-700">Excel</span> Download .xlsx
                  </button>
                  <button onClick={exportToPDF} className="w-full text-left px-5 py-3 hover:bg-gray-50 flex items-center gap-3 border-t">
                    <span className="text-red-600">PDF</span> Download .pdf
                  </button>
                </div>
              </div>
              <button onClick={() => openModal()} className="flex items-center gap-3 px-6 py-3.5 bg-black text-white rounded-xl hover:bg-gray-900 font-medium">
                <MdAdd className="w-5 h-5" /> Add Lead
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <input
              type="text"
              placeholder="Search by client, company, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-5 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black outline-none"
            />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-5 py-3.5 border border-gray-300 rounded-xl">
              <option value="">All Status</option>
              <option value="new_lead">New Lead</option>
              <option value="connected">Connected</option>
              <option value="proposal_sent">Proposal Sent</option>
              <option value="closed_won">Closed Won</option>
              <option value="closed_lost">Closed Lost</option>
            </select>
            <select value={agentFilter} onChange={(e) => setAgentFilter(e.target.value)} className="px-5 py-3.5 border border-gray-300 rounded-xl">
              <option value="">All Agents</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>{a.first_name} {a.last_name}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="text-center py-16">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-black border-t-transparent"></div>
            </div>
          ) : leads.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <p className="text-xl font-medium">No leads yet</p>
              <p>Add your first lead to start tracking</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-sm font-medium text-gray-700">
                    <th className="px-6 py-4">Sl No</th>
                    <th className="px-6 py-4">Client Name</th>
                    <th className="px-6 py-4">Company</th>
                    <th className="px-6 py-4">Lead Value</th>
                    <th className="px-6 py-4">Next Follow Up</th>
                    <th className="px-6 py-4">Lead Agent</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {leads.map((lead, index) => (
                    <motion.tr key={lead.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-gray-50">
                      <td className="px-6 py-4">{index + 1}</td>
                      <td className="px-6 py-4 font-medium">{lead.client_name || "—"}</td>
                      <td className="px-6 py-4">{lead.company_name || "—"}</td>
                      <td className="px-6 py-4">₹{lead.lead_value || 0}</td>
                      <td className="px-6 py-4">{lead.follow_up_date || "—"}</td>
                      <td className="px-6 py-4">{lead.lead_agent_name || "—"}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[lead.status] || "bg-gray-100"}`}>
                          {(lead.status || "").replace("_", " ").toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button onClick={() => openModal(lead)} className="p-2 hover:bg-indigo-100 rounded-lg text-indigo-600"><MdEdit className="w-5 h-5" /></button>
                        <button onClick={() => handleDelete(lead.id)} className="p-2 hover:bg-red-100 rounded-lg text-red-600"><MdDelete className="w-5 h-5" /></button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </LayoutComponents>

      {showModal && (
        <div className="fixed inset-0 bg-white bg-opacity-60 flex items-center justify-center z-50 p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-2xl font-bold">{editingLead ? "Edit Lead" : "Add New Lead"}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-xl"><MdClose className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSave} className="p-8 space-y-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">Company Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">Company Name *</label>
                    <Select
                      options={companyOptions}
                      value={selectedCompany}
                      onChange={handleCompanyChange}
                      placeholder="Search or add company..."
                      isClearable
                      isSearchable
                      creatable
                      formatCreateLabel={(input) => `+ Add "${input}" as new company`}
                      className="react-select-container"
                      classNamePrefix="react-select"
                    />
                  </div>
                  <input type="text" placeholder="Website" value={formData.website} onChange={e => setFormData({...formData, website: e.target.value})} className="px-5 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black outline-none" />
                  <input type="text" placeholder="Mobile *" required value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} className="px-5 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black outline-none" />
                  <input type="text" placeholder="Office Phone" value={formData.office_phone} onChange={e => setFormData({...formData, office_phone: e.target.value})} className="px-5 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black outline-none" />
                  <input type="text" placeholder="City" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="px-5 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black outline-none" />
                  <input type="text" placeholder="State" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} className="px-5 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black outline-none" />
                  <input type="text" placeholder="Country" value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})} className="px-5 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black outline-none" />
                  <input type="text" placeholder="Postal Code" value={formData.postal_code} onChange={e => setFormData({...formData, postal_code: e.target.value})} className="px-5 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black outline-none" />
                  <input type="text" placeholder="Industry *" required value={formData.industry} onChange={e => setFormData({...formData, industry: e.target.value})} className="px-5 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black outline-none md:col-span-2" />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Lead Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <select value={formData.lead_agent} onChange={e => setFormData({...formData, lead_agent: e.target.value})} className="px-5 py-3.5 border border-gray-300 rounded-xl">
                    <option value="">Select Lead Agent</option>
                    {agents.map(a => (
                      <option key={a.id} value={a.id}>{a.first_name} {a.last_name}</option>
                    ))}
                  </select>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">Client Name *</label>
                    <Select
                      options={clientOptions}
                      value={selectedClient}
                      onChange={handleClientChange}
                      placeholder="Search or add client..."
                      isClearable
                      isSearchable
                      creatable
                      formatCreateLabel={(input) => `+ Add "${input}" as new client`}
                      noOptionsMessage={() => "No clients found. Type to add new."}
                      className="react-select-container"
                      classNamePrefix="react-select"
                    />
                  </div>

                  <input
                    type="email"
                    placeholder="Client Email *"
                    required
                    value={formData.client_email}
                    readOnly
                    className="px-5 py-3.5 border border-gray-300 rounded-xl bg-gray-50"
                  />

                  <input type="number" placeholder="Lead Value" value={formData.lead_value} onChange={e => setFormData({...formData, lead_value: e.target.value})} className="px-5 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black outline-none" />
                  <div className="flex items-center gap-4">
                    <input type="checkbox" id="followup" checked={formData.next_follow_up} onChange={e => setFormData({...formData, next_follow_up: e.target.checked})} />
                    <label htmlFor="followup" className="text-sm">Next Follow Up</label>
                  </div>
                  {formData.next_follow_up && (
                    <input type="date" value={formData.follow_up_date} onChange={e => setFormData({...formData, follow_up_date: e.target.value})} className="px-5 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black outline-none" />
                  )}
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="px-5 py-3.5 border border-gray-300 rounded-xl md:col-span-2">
                    <option value="new_lead">New Lead</option>
                    <option value="connected">Connected</option>
                    <option value="proposal_sent">Proposal Sent</option>
                    <option value="closed_won">Closed Won</option>
                    <option value="closed_lost">Closed Lost</option>
                  </select>
                </div>
              </div>

              <textarea placeholder="Notes" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} rows="4" className="w-full px-5 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black outline-none" />

              <div className="flex justify-end gap-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-8 py-3.5 border border-gray-300 rounded-xl hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" className="px-8 py-3.5 bg-black text-white rounded-xl hover:bg-gray-900">
                  {editingLead ? "Update" : "Save"} Lead
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Add Company Modal */}
      {showCompanyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
            <h3 className="text-xl font-bold mb-6">Add New Company</h3>
            <input
              type="text"
              placeholder="Company Name"
              value={newCompanyName}
              onChange={(e) => setNewCompanyName(e.target.value)}
              className="w-full px-5 py-3.5 border border-gray-300 rounded-xl mb-6 focus:ring-2 focus:ring-black outline-none"
              autoFocus
            />
            <div className="flex justify-end gap-4">
              <button onClick={() => { setShowCompanyModal(false); setNewCompanyName(""); }} className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleAddCompany} className="px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-900">
                Save Company
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Add Client Modal */}
      {showClientModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
            <h3 className="text-xl font-bold mb-6">Add New Client</h3>
            <input
              type="text"
              placeholder="Client Name *"
              value={newClientName}
              onChange={(e) => setNewClientName(e.target.value)}
              className="w-full px-5 py-3.5 border border-gray-300 rounded-xl mb-4 focus:ring-2 focus:ring-black outline-none"
              autoFocus
            />
            <input
              type="email"
              placeholder="Client Email *"
              value={newClientEmail}
              onChange={(e) => setNewClientEmail(e.target.value)}
              className="w-full px-5 py-3.5 border border-gray-300 rounded-xl mb-6 focus:ring-2 focus:ring-black outline-none"
            />
            <div className="flex justify-end gap-4">
              <button onClick={() => { setShowClientModal(false); setNewClientName(""); setNewClientEmail(""); }} className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleAddClient} className="px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-900">
                Save Client
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Leads;