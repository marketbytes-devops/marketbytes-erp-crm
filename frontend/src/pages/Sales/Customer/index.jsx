import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import LayoutComponents from "../../../components/LayoutComponents";
import apiClient from "../../../helpers/apiClient";
import Loading from "../../../components/Loading";
import Input from "../../../components/Input";
import { usePermission } from "../../../context/PermissionContext";
import {
  MdAdd,
  MdEdit,
  MdDelete,
  MdBusiness,
  MdPerson,
  MdSearch,
  MdFilterList,
  MdLanguage,
  MdPhone,
  MdLocationCity,
  MdCategory,
  MdChevronRight
} from "react-icons/md";
import { FiExternalLink, FiMail, FiPhone, FiGlobe, FiMapPin } from "react-icons/fi";
import { toast } from "react-hot-toast";

const Customers = () => {
  const { hasPermission } = usePermission();
  const [activeTab, setActiveTab] = useState("companies");
  const [companies, setCompanies] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modals
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [companyForm, setCompanyForm] = useState({
    name: "",
    website: "",
    mobile: "",
    office_phone: "",
    city: "",
    state: "",
    country: "",
    postal_code: "",
    industry: "",
  });

  const [showClientModal, setShowClientModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [clientForm, setClientForm] = useState({
    name: "",
    email: "",
    company: "",
    mobile: "",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [compRes, clientRes] = await Promise.all([
        apiClient.get("/sales/companies/"),
        apiClient.get("/sales/clients/"),
      ]);
      setCompanies(compRes.data.results || compRes.data || []);
      setClients(clientRes.data.results || clientRes.data || []);
    } catch (err) {
      console.error("Failed to load data:", err);
      toast.error("Error loading customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const TABS = [
    { id: "companies", label: "Companies", icon: MdBusiness },
    { id: "clients", label: "Clients", icon: MdPerson },
  ];

  const stats = useMemo(() => [
    { label: "Total Companies", value: companies.length, icon: MdBusiness, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Total Clients", value: clients.length, icon: MdPerson, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Industries", value: [...new Set(companies.map(c => c.industry))].filter(Boolean).length, icon: MdCategory, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Direct Outreach", value: clients.filter(c => !c.company).length, icon: FiMail, color: "text-amber-600", bg: "bg-amber-50" },
  ], [companies, clients]);

  const filteredData = useMemo(() => {
    const list = activeTab === "companies" ? companies : clients;
    if (!search) return list;
    return list.filter(item =>
      item.name?.toLowerCase().includes(search.toLowerCase()) ||
      (activeTab === "clients" ? item.email : item.industry)?.toLowerCase().includes(search.toLowerCase())
    );
  }, [activeTab, companies, clients, search]);

  // Company Handlers
  const openCompanyModal = (company = null) => {
    if (company) {
      setEditingCompany(company);
      setCompanyForm({
        name: company.name,
        website: company.website || "",
        mobile: company.mobile || "",
        office_phone: company.office_phone || "",
        city: company.city || "",
        state: company.state || "",
        country: company.country || "",
        postal_code: company.postal_code || "",
        industry: company.industry || "",
      });
    } else {
      setEditingCompany(null);
      setCompanyForm({
        name: "", website: "", mobile: "", office_phone: "",
        city: "", state: "", country: "", postal_code: "", industry: "",
      });
    }
    setShowCompanyModal(true);
  };

  const handleSaveCompany = async () => {
    if (!companyForm.name.trim() || !companyForm.mobile.trim() || !companyForm.industry.trim()) {
      toast.error("Name, Mobile, and Industry are required");
      return;
    }
    try {
      if (editingCompany) {
        const res = await apiClient.put(`/sales/companies/${editingCompany.id}/`, companyForm);
        setCompanies(companies.map((c) => (c.id === editingCompany.id ? res.data : c)));
        toast.success("Company updated");
      } else {
        const res = await apiClient.post("/sales/companies/", companyForm);
        setCompanies([...companies, res.data]);
        toast.success("Company added successfully");
      }
      setShowCompanyModal(false);
    } catch (err) {
      toast.error("Error saving company");
    }
  };

  const handleDeleteCompany = async (id) => {
    if (!window.confirm("Delete this company? All related clients will be affected.")) return;
    try {
      await apiClient.delete(`/sales/companies/${id}/`);
      setCompanies(companies.filter((c) => c.id !== id));
      toast.success("Company deleted");
    } catch (err) {
      toast.error("Error deleting company");
    }
  };

  // Client Handlers
  const openClientModal = (client = null) => {
    if (client) {
      setEditingClient(client);
      setClientForm({
        name: client.name,
        email: client.email,
        company: client.company || "",
        mobile: client.mobile || "",
      });
    } else {
      setEditingClient(null);
      setClientForm({ name: "", email: "", company: "", mobile: "" });
    }
    setShowClientModal(true);
  };

  const handleSaveClient = async () => {
    if (!clientForm.name.trim() || !clientForm.email.trim()) {
      toast.error("Name and Email are required");
      return;
    }
    const payload = {
      ...clientForm,
      company: clientForm.company ? parseInt(clientForm.company) : null,
    };
    try {
      if (editingClient) {
        const res = await apiClient.put(`/sales/clients/${editingClient.id}/`, payload);
        setClients(clients.map((c) => (c.id === editingClient.id ? res.data : c)));
        toast.success("Client updated");
      } else {
        const res = await apiClient.post("/sales/clients/", payload);
        setClients([...clients, res.data]);
        toast.success("Client added successfully");
      }
      setShowClientModal(false);
    } catch (err) {
      toast.error("Error saving client");
    }
  };

  const handleDeleteClient = async (id) => {
    if (!window.confirm("Delete this client?")) return;
    try {
      await apiClient.delete(`/sales/clients/${id}/`);
      setClients(clients.filter((c) => c.id !== id));
      toast.success("Client deleted");
    } catch (err) {
      toast.error("Error deleting client");
    }
  };

  if (loading && companies.length === 0) return <Loading />;

  return (
    <div className="p-6 min-h-screen">
      <LayoutComponents
        title="Customer Management"
        subtitle="Manage your business network and stakeholder relations"
        variant="table"
      >
        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-6 rounded-4xl border border-gray-100 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color} transition-transform group-hover:scale-110`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">{stat.label}</p>
                  <p className="text-2xl font-medium text-gray-900">{stat.value}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Tab Switcher & Search */}
        <div className="flex flex-col lg:flex-row justify-between items-center gap-6 mb-8 bg-white p-4 rounded-4xl border border-gray-100 shadow-sm">
          <div className="flex gap-2 p-1 bg-gray-50 rounded-2xl border border-gray-100">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-3 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${isActive ? "text-black" : "text-gray-500 hover:text-gray-900 hover:bg-white"
                    }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTabPill"
                      className="absolute inset-0 bg-white rounded-xl shadow-sm border border-gray-100 -z-10"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <Icon className={`w-5 h-5 ${isActive ? "text-black" : "text-gray-400"}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-col md:flex-row gap-4 w-full lg:w-auto">
            <div className="relative flex-1 md:w-72">
              <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black transition-all outline-none font-medium text-sm"
              />
            </div>
            {hasPermission("customer", "add") && (
              <button
                onClick={() => activeTab === "companies" ? openCompanyModal() : openClientModal()}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-black text-white rounded-2xl hover:bg-gray-900 transition-all font-medium shadow-black/10 active:scale-95 whitespace-nowrap"
              >
                <MdAdd className="w-5 h-5" /> New {activeTab === "companies" ? "Company" : "Client"}
              </button>
            )}
          </div>
        </div>

        {/* Table Content */}
        <div className="bg-white rounded-4xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/50 border-b border-gray-50">
                <tr>
                  {activeTab === "companies" ? (
                    <>
                      <th className="px-8 py-5 text-left text-[11px] font-medium text-gray-400 uppercase tracking-widest">Company Branding</th>
                      <th className="px-8 py-5 text-left text-[11px] font-medium text-gray-400 uppercase tracking-widest">Industry & Reach</th>
                      <th className="px-8 py-5 text-left text-[11px] font-medium text-gray-400 uppercase tracking-widest">Location</th>
                      <th className="px-8 py-5 text-right text-[11px] font-medium text-gray-400 uppercase tracking-widest">Actions</th>
                    </>
                  ) : (
                    <>
                      <th className="px-8 py-5 text-left text-[11px] font-medium text-gray-400 uppercase tracking-widest">Persona Details</th>
                      <th className="px-8 py-5 text-left text-[11px] font-medium text-gray-400 uppercase tracking-widest">Associated Company</th>
                      <th className="px-8 py-5 text-left text-[11px] font-medium text-gray-400 uppercase tracking-widest">Reach Out</th>
                      <th className="px-8 py-5 text-right text-[11px] font-medium text-gray-400 uppercase tracking-widest">Actions</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                <AnimatePresence mode="popLayout">
                  {filteredData.length === 0 ? (
                    <motion.tr
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <td colSpan="4" className="py-32 text-center text-gray-400">
                        <div className="flex flex-col items-center">
                          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <MdSearch className="w-8 h-8 text-gray-200" />
                          </div>
                          <p className="font-medium capitalize text-sm">No {activeTab} matching your filters</p>
                        </div>
                      </td>
                    </motion.tr>
                  ) : (
                    filteredData.map((item, idx) => (
                      <motion.tr
                        key={item.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="group hover:bg-slate-50/50 transition-colors"
                      >
                        {activeTab === "companies" ? (
                          <>
                            <td className="px-8 py-6">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-medium text-lg shadow-sm">
                                  {item.name.charAt(0)}
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900 group-hover:text-black transition-colors">{item.name}</div>
                                  <div className="flex items-center gap-1.5 text-xs text-blue-600 font-medium mt-1">
                                    <FiGlobe className="w-3 h-3" />
                                    {item.website || "No website"}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-6">
                              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-medium uppercase tracking-widest">
                                <MdCategory className="w-3.5 h-3.5" />
                                {item.industry}
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium mt-2">
                                <MdPhone className="w-3.5 h-3.5" />
                                {item.mobile}
                              </div>
                            </td>
                            <td className="px-8 py-6 text-sm">
                              <div className="flex items-center gap-2 text-gray-700 font-medium">
                                <MdLocationCity className="w-4 h-4 text-gray-400" />
                                {item.city || "N/A"}, {item.country || "Intl"}
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-8 py-6">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-medium text-lg shadow-sm">
                                  {item.name.charAt(0)}
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900 group-hover:text-black transition-colors">{item.name}</div>
                                  <div className="text-[10px] text-gray-400 font-medium uppercase tracking-widest mt-1">Stakeholder</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-6">
                              <div className="flex items-center gap-2 text-sm font-medium text-blue-600 bg-blue-50/50 w-fit px-3 py-1.5 rounded-xl border border-blue-100/50">
                                <MdBusiness className="w-4 h-4" />
                                {item.company_name || "Independent"}
                              </div>
                            </td>
                            <td className="px-8 py-6 space-y-2">
                              <div className="flex items-center gap-2 text-xs font-medium text-gray-500 hover:text-black transition-colors cursor-pointer">
                                <FiMail className="w-3.5 h-3.5" />
                                {item.email}
                              </div>
                              <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                                <FiPhone className="w-3.5 h-3.5" />
                                {item.mobile || "N/A"}
                              </div>
                            </td>
                          </>
                        )}
                        <td className="px-8 py-6 text-right">
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                            {hasPermission("customer", "edit") && (
                              <button
                                onClick={() => activeTab === "companies" ? openCompanyModal(item) : openClientModal(item)}
                                className="p-2.5 bg-white shadow-sm border border-gray-100 hover:bg-slate-50 hover:text-indigo-600 rounded-xl transition-all"
                                title="Edit"
                              >
                                <MdEdit className="w-4.5 h-4.5" />
                              </button>
                            )}
                            {hasPermission("customer", "delete") && (
                              <button
                                onClick={() => activeTab === "companies" ? handleDeleteCompany(item.id) : handleDeleteClient(item.id)}
                                className="p-2.5 bg-white shadow-sm border border-gray-100 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all"
                                title="Delete"
                              >
                                <MdDelete className="w-4.5 h-4.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      </LayoutComponents>

      {/* Company Modal */}
      {showCompanyModal && (
        <LayoutComponents
          variant="modal"
          title={`${editingCompany ? "Edit" : "Register"} Company`}
          onCloseModal={() => setShowCompanyModal(false)}
          modal={
            <div className="space-y-8 max-h-[75vh] overflow-y-auto p-2 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <h4 className="text-[10px] font-medium text-blue-600 uppercase tracking-widest mb-4">Core Information</h4>
                  <Input label="Company Entity Name *" placeholder="Enterprise Solutions Ltd" value={companyForm.name} onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })} />
                </div>
                <Input label="Digital Portfolio" placeholder="https://example.com" value={companyForm.website} onChange={(e) => setCompanyForm({ ...companyForm, website: e.target.value })} />
                <Input label="Primary Mobile *" placeholder="+1 234 567 890" value={companyForm.mobile} onChange={(e) => setCompanyForm({ ...companyForm, mobile: e.target.value })} />
                <Input label="Office Phone" placeholder="+1 098 765 432" value={companyForm.office_phone} onChange={(e) => setCompanyForm({ ...companyForm, office_phone: e.target.value })} />
                <div className="md:col-span-1">
                  <Input label="Industry Sector *" placeholder="Technology / Finance" value={companyForm.industry} onChange={(e) => setCompanyForm({ ...companyForm, industry: e.target.value })} />
                </div>
              </div>
              <div className="space-y-6">
                <h4 className="text-[10px] font-medium text-purple-600 uppercase tracking-widest mb-2">Geo-Spatial Data</h4>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <Input label="City" value={companyForm.city} onChange={(e) => setCompanyForm({ ...companyForm, city: e.target.value })} />
                  <Input label="State" value={companyForm.state} onChange={(e) => setCompanyForm({ ...companyForm, state: e.target.value })} />
                  <Input label="Country" value={companyForm.country} onChange={(e) => setCompanyForm({ ...companyForm, country: e.target.value })} />
                  <Input label="Postal Code" value={companyForm.postal_code} onChange={(e) => setCompanyForm({ ...companyForm, postal_code: e.target.value })} />
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-6">
                <button onClick={() => setShowCompanyModal(false)} className="px-8 py-4 text-sm font-medium text-gray-600 hover:text-black transition">Discard Changes</button>
                <button onClick={handleSaveCompany} className="px-12 py-4 bg-black text-white rounded-2xl font-medium shadow-xl shadow-black/10 hover:translate-y-[-2px] transition-all">
                  Commit Record
                </button>
              </div>
            </div>
          }
        />
      )}

      {/* Client Modal */}
      {showClientModal && (
        <LayoutComponents
          variant="modal"
          title={`${editingClient ? "Modify" : "Enlist"} Client Persona`}
          onCloseModal={() => setShowClientModal(false)}
          modal={
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <h4 className="text-[10px] font-medium text-emerald-600 uppercase tracking-widest mb-4">Stakeholder Profile</h4>
                </div>
                <Input label="Full Identity Name *" placeholder="Sarah Jenkins" value={clientForm.name} onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })} />
                <Input label="Secure Email Address *" type="email" placeholder="sarah@example.com" value={clientForm.email} onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })} />

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 mb-[11px]">Primary Organizational Link</label>
                  <select
                    value={clientForm.company}
                    onChange={(e) => setClientForm({ ...clientForm, company: e.target.value })}
                    className="w-full px-5 py-[15px] bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-black outline-none font-medium text-sm appearance-none cursor-pointer"
                  >
                    <option value="">Independent Stakeholder</option>
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <Input label="Verified Mobile" placeholder="+1 234 567 890" value={clientForm.mobile} onChange={(e) => setClientForm({ ...clientForm, mobile: e.target.value })} />
              </div>

              <div className="flex justify-end gap-4 pt-8">
                <button onClick={() => setShowClientModal(false)} className="px-8 py-4 text-sm font-medium text-gray-600 hover:text-black transition">Cancel Outreach</button>
                <button onClick={handleSaveClient} className="px-12 py-4 bg-emerald-600 text-white rounded-2xl font-medium shadow-xl shadow-emerald-600/10 hover:translate-y-[-2px] transition-all">
                  {editingClient ? "Update Persona" : "Record Stakeholder"}
                </button>
              </div>
            </div>
          }
        />
      )}
    </div>
  );
};

export default Customers;
