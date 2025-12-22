import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import LayoutComponents from "../../../components/LayoutComponents";
import apiClient from "../../../helpers/apiClient";
import { MdAdd, MdEdit, MdDelete, MdClose } from "react-icons/md";

const Customers = () => {
  const [activeTab, setActiveTab] = useState("companies");
  const [companies, setCompanies] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Company Modal
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

  // Client Modal
  const [showClientModal, setShowClientModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [clientForm, setClientForm] = useState({
    name: "",
    email: "",
    company: "",
    mobile: "",
  });

  // Fetch Companies & Clients
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
      alert("Error loading customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Open Company Modal
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
    }
    setShowCompanyModal(true);
  };

  // Save Company
  const handleSaveCompany = async () => {
    if (
      !companyForm.name.trim() ||
      !companyForm.mobile.trim() ||
      !companyForm.industry.trim()
    ) {
      alert("Company Name, Mobile, and Industry are required");
      return;
    }

    try {
      if (editingCompany) {
        const res = await apiClient.put(
          `/sales/companies/${editingCompany.id}/`,
          companyForm
        );
        setCompanies(
          companies.map((c) => (c.id === editingCompany.id ? res.data : c))
        );
      } else {
        const res = await apiClient.post("/sales/companies/", companyForm);
        setCompanies([...companies, res.data]);
      }
      setShowCompanyModal(false);
    } catch (err) {
      alert("Error saving company");
    }
  };

  // Delete Company
  const handleDeleteCompany = async (id) => {
    if (
      !window.confirm(
        "Delete this company? All related clients will be affected."
      )
    )
      return;
    try {
      await apiClient.delete(`/sales/companies/${id}/`);
      setCompanies(companies.filter((c) => c.id !== id));
    } catch (err) {
      alert("Error deleting company");
    }
  };

  // Open Client Modal
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
      setClientForm({
        name: "",
        email: "",
        company: "",
        mobile: "",
      });
    }
    setShowClientModal(true);
  };

  // Save Client
  const handleSaveClient = async () => {
    if (!clientForm.name.trim() || !clientForm.email.trim()) {
      alert("Name and Email are required");
      return;
    }

    // Convert company to number or null
    const payload = {
      name: clientForm.name.trim(),
      email: clientForm.email.trim(),
      company: clientForm.company ? parseInt(clientForm.company) : null,
      mobile: clientForm.mobile || null,
    };

    try {
      let res;
      if (editingClient) {
        res = await apiClient.put(
          `/sales/clients/${editingClient.id}/`,
          payload
        );
        setClients(
          clients.map((c) => (c.id === editingClient.id ? res.data : c))
        );
      } else {
        res = await apiClient.post("/sales/clients/", payload);
        setClients([...clients, res.data]);
      }
      setShowClientModal(false);
      toast.success(
        editingClient ? "Client updated" : "Client added successfully"
      );
    } catch (err) {
      console.error("Error response:", err.response?.data);
      toast.error(
        "Failed to save client: " + JSON.stringify(err.response?.data)
      );
    }
  };

  // Delete Client
  const handleDeleteClient = async (id) => {
    if (!window.confirm("Delete this client?")) return;
    try {
      await apiClient.delete(`/sales/clients/${id}/`);
      setClients(clients.filter((c) => c.id !== id));
    } catch (err) {
      alert("Error deleting client");
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <LayoutComponents
          title="Customers"
          subtitle="Loading..."
          variant="card"
        >
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-black border-t-transparent"></div>
          </div>
        </LayoutComponents>
      </div>
    );
  }

  return (
    <div className="p-6">
      <LayoutComponents
        title="Customers"
        subtitle="Manage companies and clients"
        variant="card"
      >
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex border-b border-gray-200 mb-8">
            <button
              onClick={() => setActiveTab("companies")}
              className={`px-8 py-4 font-medium text-sm border-b-2 transition-colors ${
                activeTab === "companies"
                  ? "border-black text-black"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Companies
            </button>
            <button
              onClick={() => setActiveTab("clients")}
              className={`px-8 py-4 font-medium text-sm border-b-2 transition-colors ${
                activeTab === "clients"
                  ? "border-black text-black"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Clients
            </button>
          </div>

          {/* Companies Tab */}
          {activeTab === "companies" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-medium">All Companies</h3>
                <button
                  onClick={() => openCompanyModal()}
                  className="flex items-center gap-3 px-6 py-3.5 bg-black text-white rounded-xl hover:bg-gray-900 font-medium"
                >
                  <MdAdd className="w-5 h-5" /> Add Company
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50 text-left text-sm font-medium text-gray-700">
                      <th className="px-6 py-4">Sl No</th>
                      <th className="px-6 py-4">Company Name</th>
                      <th className="px-6 py-4">Website</th>
                      <th className="px-6 py-4">Mobile</th>
                      <th className="px-6 py-4">City</th>
                      <th className="px-6 py-4">Industry</th>
                      <th className="px-6 py-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {companies.length === 0 ? (
                      <tr>
                        <td
                          colSpan="7"
                          className="text-center py-8 text-gray-500"
                        >
                          No companies found.
                        </td>
                      </tr>
                    ) : (
                      companies.map((company, i) => (
                        <tr key={company.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">{i + 1}</td>
                          <td className="px-6 py-4 font-medium">
                            {company.name}
                          </td>
                          <td className="px-6 py-4">
                            {company.website || "—"}
                          </td>
                          <td className="px-6 py-4">{company.mobile}</td>
                          <td className="px-6 py-4">{company.city || "—"}</td>
                          <td className="px-6 py-4">{company.industry}</td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-3">
                              <button
                                onClick={() => openCompanyModal(company)}
                                className="p-2 hover:bg-indigo-100 rounded-lg text-indigo-600"
                              >
                                <MdEdit className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleDeleteCompany(company.id)}
                                className="p-2 hover:bg-red-100 rounded-lg text-red-600"
                              >
                                <MdDelete className="w-5 h-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Clients Tab */}
          {activeTab === "clients" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-medium">All Clients</h3>
                <button
                  onClick={() => openClientModal()}
                  className="flex items-center gap-3 px-6 py-3.5 bg-black text-white rounded-xl hover:bg-gray-900 font-medium"
                >
                  <MdAdd className="w-5 h-5" /> Add Client
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50 text-left text-sm font-medium text-gray-700">
                      <th className="px-6 py-4">Sl No</th>
                      <th className="px-6 py-4">Client Name</th>
                      <th className="px-6 py-4">Email</th>
                      <th className="px-6 py-4">Company</th>
                      <th className="px-6 py-4">Mobile</th>
                      <th className="px-6 py-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {clients.length === 0 ? (
                      <tr>
                        <td
                          colSpan="6"
                          className="text-center py-8 text-gray-500"
                        >
                          No clients found.
                        </td>
                      </tr>
                    ) : (
                      clients.map((client, i) => (
                        <tr key={client.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">{i + 1}</td>
                          <td className="px-6 py-4 font-medium">
                            {client.name}
                          </td>
                          <td className="px-6 py-4">{client.email}</td>
                          <td className="px-6 py-4">
                            {client.company_name || "—"}
                          </td>
                          <td className="px-6 py-4">{client.mobile || "—"}</td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-3">
                              <button
                                onClick={() => openClientModal(client)}
                                className="p-2 hover:bg-indigo-100 rounded-lg text-indigo-600"
                              >
                                <MdEdit className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleDeleteClient(client.id)}
                                className="p-2 hover:bg-red-100 rounded-lg text-red-600"
                              >
                                <MdDelete className="w-5 h-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </LayoutComponents>

      {/* Company Modal */}
      {showCompanyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-2xl font-bold">
                {editingCompany ? "Edit" : "Add"} Company
              </h2>
              <button
                onClick={() => setShowCompanyModal(false)}
                className="p-2 hover:bg-gray-100 rounded-xl"
              >
                <MdClose className="w-6 h-6" />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input
                  type="text"
                  placeholder="Company Name *"
                  value={companyForm.name}
                  onChange={(e) =>
                    setCompanyForm({ ...companyForm, name: e.target.value })
                  }
                  className="px-5 py-3.5 border rounded-xl"
                />
                <input
                  type="text"
                  placeholder="Website"
                  value={companyForm.website}
                  onChange={(e) =>
                    setCompanyForm({ ...companyForm, website: e.target.value })
                  }
                  className="px-5 py-3.5 border rounded-xl"
                />
                <input
                  type="text"
                  placeholder="Mobile *"
                  required
                  value={companyForm.mobile}
                  onChange={(e) =>
                    setCompanyForm({ ...companyForm, mobile: e.target.value })
                  }
                  className="px-5 py-3.5 border rounded-xl"
                />
                <input
                  type="text"
                  placeholder="Office Phone Number"
                  value={companyForm.office_phone}
                  onChange={(e) =>
                    setCompanyForm({
                      ...companyForm,
                      office_phone: e.target.value,
                    })
                  }
                  className="px-5 py-3.5 border rounded-xl"
                />
                <input
                  type="text"
                  placeholder="City"
                  value={companyForm.city}
                  onChange={(e) =>
                    setCompanyForm({ ...companyForm, city: e.target.value })
                  }
                  className="px-5 py-3.5 border rounded-xl"
                />
                <input
                  type="text"
                  placeholder="State"
                  value={companyForm.state}
                  onChange={(e) =>
                    setCompanyForm({ ...companyForm, state: e.target.value })
                  }
                  className="px-5 py-3.5 border rounded-xl"
                />
                <input
                  type="text"
                  placeholder="Country"
                  value={companyForm.country}
                  onChange={(e) =>
                    setCompanyForm({ ...companyForm, country: e.target.value })
                  }
                  className="px-5 py-3.5 border rounded-xl"
                />
                <input
                  type="text"
                  placeholder="Postal Code"
                  value={companyForm.postal_code}
                  onChange={(e) =>
                    setCompanyForm({
                      ...companyForm,
                      postal_code: e.target.value,
                    })
                  }
                  className="px-5 py-3.5 border rounded-xl"
                />
                <input
                  type="text"
                  placeholder="Industry *"
                  required
                  value={companyForm.industry}
                  onChange={(e) =>
                    setCompanyForm({ ...companyForm, industry: e.target.value })
                  }
                  className="px-5 py-3.5 border rounded-xl md:col-span-2"
                />
              </div>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setShowCompanyModal(false)}
                  className="px-8 py-3.5 border rounded-xl hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCompany}
                  className="px-8 py-3.5 bg-black text-white rounded-xl hover:bg-gray-900"
                >
                  Save Company
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Client Modal */}
      {showClientModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full"
          >
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-2xl font-bold">
                {editingClient ? "Edit" : "Add"} Client
              </h2>
              <button
                onClick={() => setShowClientModal(false)}
                className="p-2 hover:bg-gray-100 rounded-xl"
              >
                <MdClose className="w-6 h-6" />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input
                  type="text"
                  placeholder="Client Name *"
                  value={clientForm.name}
                  onChange={(e) =>
                    setClientForm({ ...clientForm, name: e.target.value })
                  }
                  className="px-5 py-3.5 border rounded-xl"
                />
                <input
                  type="email"
                  placeholder="Email *"
                  value={clientForm.email}
                  onChange={(e) =>
                    setClientForm({ ...clientForm, email: e.target.value })
                  }
                  className="px-5 py-3.5 border rounded-xl"
                />
                <input
                  type="text"
                  placeholder="Company"
                  value={clientForm.company}
                  onChange={(e) =>
                    setClientForm({ ...clientForm, company: e.target.value })
                  }
                  className="px-5 py-3.5 border rounded-xl"
                />
                <input
                  type="text"
                  placeholder="Mobile"
                  value={clientForm.mobile}
                  onChange={(e) =>
                    setClientForm({ ...clientForm, mobile: e.target.value })
                  }
                  className="px-5 py-3.5 border rounded-xl"
                />
              </div>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setShowClientModal(false)}
                  className="px-8 py-3.5 border rounded-xl hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveClient}
                  className="px-8 py-3.5 bg-black text-white rounded-xl hover:bg-gray-900"
                >
                  Save Client
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Customers;
