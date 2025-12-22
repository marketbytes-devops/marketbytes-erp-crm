import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MdAdd, MdEdit, MdDelete, MdClose, MdKeyboardArrowDown, MdEmail, MdSend } from "react-icons/md";
import LayoutComponents from "../../../components/LayoutComponents";
import Input from "../../../components/Input";
import toast from "react-hot-toast";
import apiClient from "../../../helpers/apiClient";

const Communication = () => {
  const [activeTab, setActiveTab] = useState("proposal");

  // Proposal & RFP Templates
  const [proposalTemplates, setProposalTemplates] = useState([]);
  const [rfpTemplates, setRfpTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Gmail Integration
  const [gmailConnected, setGmailConnected] = useState(false);
  const [recentEmails, setRecentEmails] = useState([]);
  const [composeModal, setComposeModal] = useState(false);
  const [emailForm, setEmailForm] = useState({
    to: "",
    cc: "",
    bcc: "",
    subject: "",
    body: "",
    template: null,
  });

  // Proposal Modal
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [editingProposal, setEditingProposal] = useState(null);
  const [proposalForm, setProposalForm] = useState({ name: "", template: "", body: "" });

  // RFP Modal
  const [showRfpModal, setShowRfpModal] = useState(false);
  const [editingRfp, setEditingRfp] = useState(null);
  const [rfpForm, setRfpForm] = useState({ category: "", body: "" });

  // Fetch templates & check Gmail status
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [propRes, rfpRes, gmailStatus] = await Promise.all([
          apiClient.get("/sales/proposal-templates/"),
          apiClient.get("/sales/rfp-templates/"),
          apiClient.get("/gmail/status/"),
        ]);

        setProposalTemplates(propRes.data.results || propRes.data || []);
        setRfpTemplates(rfpRes.data.results || rfpRes.data || []);
        setGmailConnected(gmailStatus.data.connected || false);

        if (gmailStatus.data.connected) {
          fetchRecentEmails();
        }
      } catch (err) {
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const fetchRecentEmails = async () => {
    try {
      const res = await apiClient.get("/gmail/sent-emails/");
      setRecentEmails(res.data);
    } catch (err) {
      toast.error("Failed to load recent emails");
    }
  };

  const handleConnectGmail = async () => {
    try {
      const res = await apiClient.get("/gmail/connect/");
      window.location.href = res.data.auth_url;
    } catch (err) {
      toast.error("Failed to connect Gmail");
    }
  };

  const handleDisconnectGmail = async () => {
    if (!window.confirm("Disconnect Gmail account?")) return;
    try {
      await apiClient.post("/gmail/disconnect/");
      setGmailConnected(false);
      setRecentEmails([]);
      toast.success("Gmail disconnected");
    } catch (err) {
      toast.error("Failed to disconnect Gmail");
    }
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post("/gmail/send/", emailForm);
      toast.success("Email sent successfully!");
      setComposeModal(false);
      setEmailForm({ to: "", cc: "", bcc: "", subject: "", body: "", template: null });
      fetchRecentEmails();
    } catch (err) {
      toast.error("Failed to send email");
    }
  };

  const useTemplateInEmail = (template) => {
    setEmailForm({ ...emailForm, body: template.body, template: template });
    setComposeModal(true);
  };

  // Proposal Handlers
  const openProposalModal = (template = null) => {
    if (template) {
      setEditingProposal(template);
      setProposalForm({ name: template.name, template: template.template, body: template.body });
    } else {
      setEditingProposal(null);
      setProposalForm({ name: "", template: "", body: "" });
    }
    setShowProposalModal(true);
  };

  const handleSaveProposal = async () => {
    if (!proposalForm.name.trim() || !proposalForm.template.trim()) {
      toast.error("Template Name and Proposal Template are required");
      return;
    }

    try {
      if (editingProposal) {
        const res = await apiClient.put(`/sales/proposal-templates/${editingProposal.id}/`, proposalForm);
        setProposalTemplates(prev => prev.map(t => t.id === editingProposal.id ? res.data : t));
      } else {
        const res = await apiClient.post("/sales/proposal-templates/", proposalForm);
        setProposalTemplates([res.data, ...proposalTemplates]);
      }
      toast.success("Proposal template saved");
      setShowProposalModal(false);
    } catch (err) {
      toast.error("Failed to save proposal template");
    }
  };

  const handleDeleteProposal = async (id) => {
    if (!window.confirm("Delete this proposal template?")) return;
    try {
      await apiClient.delete(`/sales/proposal-templates/${id}/`);
      setProposalTemplates(prev => prev.filter(t => t.id !== id));
      toast.success("Proposal template deleted");
    } catch (err) {
      toast.error("Failed to delete proposal template");
    }
  };

  // RFP Handlers
  const openRfpModal = (template = null) => {
    if (template) {
      setEditingRfp(template);
      setRfpForm({ category: template.category, body: template.body });
    } else {
      setEditingRfp(null);
      setRfpForm({ category: "", body: "" });
    }
    setShowRfpModal(true);
  };

  const handleSaveRfp = async () => {
    if (!rfpForm.category.trim()) {
      toast.error("Category is required");
      return;
    }

    try {
      if (editingRfp) {
        const res = await apiClient.put(`/sales/rfp-templates/${editingRfp.id}/`, rfpForm);
        setRfpTemplates(prev => prev.map(t => t.id === editingRfp.id ? res.data : t));
      } else {
        const res = await apiClient.post("/sales/rfp-templates/", rfpForm);
        setRfpTemplates([res.data, ...rfpTemplates]);
      }
      toast.success("RFP template saved");
      setShowRfpModal(false);
    } catch (err) {
      toast.error("Failed to save RFP template");
    }
  };

  const handleDeleteRfp = async (id) => {
    if (!window.confirm("Delete this RFP template?")) return;
    try {
      await apiClient.delete(`/sales/rfp-templates/${id}/`);
      setRfpTemplates(prev => prev.filter(t => t.id !== id));
      toast.success("RFP template deleted");
    } catch (err) {
      toast.error("Failed to delete RFP template");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-black border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <LayoutComponents
        title="Communication Tools"
        subtitle="Manage reusable templates and Gmail integration"
        variant="card"
      >
        <div className="bg-white rounded-2xl shadow-sm p-6">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-8">
            <button
              onClick={() => setActiveTab("proposal")}
              className={`px-8 py-4 font-medium text-sm border-b-2 transition-colors ${
                activeTab === "proposal" ? "border-black text-black" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Proposal Templates
            </button>
            <button
              onClick={() => setActiveTab("rfp")}
              className={`px-8 py-4 font-medium text-sm border-b-2 transition-colors ${
                activeTab === "rfp" ? "border-black text-black" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              RFP Body Templates
            </button>
            <button
              onClick={() => setActiveTab("email")}
              className={`px-8 py-4 font-medium text-sm border-b-2 transition-colors ${
                activeTab === "email" ? "border-black text-black" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Gmail Integration
            </button>
          </div>

          {/* Proposal Templates */}
          {activeTab === "proposal" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-medium">Proposal Templates</h3>
                <button
                  onClick={() => openProposalModal()}
                  className="flex items-center gap-3 px-6 py-3.5 bg-black text-white rounded-xl hover:bg-gray-900 transition font-medium"
                >
                  <MdAdd className="w-5 h-5" /> Add Template
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Sl No</th>
                      <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Template</th>
                      <th className="px-6 py-5 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {proposalTemplates.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="text-center py-24">
                          <div className="flex flex-col items-center">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-5">
                              <MdAdd className="w-10 h-10 text-gray-400" />
                            </div>
                            <p className="text-xl font-semibold text-gray-700">No proposal templates yet</p>
                            <p className="text-gray-500 mt-2">Click "Add Template" to create one</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      proposalTemplates.map((temp, i) => (
                        <motion.tr
                          key={temp.id}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className="hover:bg-gray-50 transition"
                        >
                          <td className="px-6 py-5 font-medium">{i + 1}</td>
                          <td className="px-6 py-5 font-medium">{temp.name}</td>
                          <td className="px-6 py-5 text-gray-700 truncate max-w-[400px]">{temp.template}</td>
                          <td className="px-6 py-5">
                            <div className="flex items-center justify-center gap-3">
                              <button
                                onClick={() => openProposalModal(temp)}
                                className="p-2 hover:bg-amber-50 rounded-lg transition group"
                                title="Edit"
                              >
                                <MdEdit className="w-5 h-5 text-gray-600 group-hover:text-amber-600" />
                              </button>
                              <button
                                onClick={() => handleDeleteProposal(temp.id)}
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
          )}

          {/* RFP Templates */}
          {activeTab === "rfp" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-medium">RFP Body Templates</h3>
                <button
                  onClick={() => openRfpModal()}
                  className="flex items-center gap-3 px-6 py-3.5 bg-black text-white rounded-xl hover:bg-gray-900 transition font-medium"
                >
                  <MdAdd className="w-5 h-5" /> Add Template
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Sl No</th>
                      <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">RFP Body</th>
                      <th className="px-6 py-5 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {rfpTemplates.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="text-center py-24">
                          <div className="flex flex-col items-center">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-5">
                              <MdAdd className="w-10 h-10 text-gray-400" />
                            </div>
                            <p className="text-xl font-semibold text-gray-700">No RFP templates yet</p>
                            <p className="text-gray-500 mt-2">Click "Add Template" to create one</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      rfpTemplates.map((temp, i) => (
                        <motion.tr
                          key={temp.id}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className="hover:bg-gray-50 transition"
                        >
                          <td className="px-6 py-5 font-medium">{i + 1}</td>
                          <td className="px-6 py-5 font-medium">{temp.category}</td>
                          <td className="px-6 py-5 text-gray-700 truncate max-w-[400px]">{temp.body}</td>
                          <td className="px-6 py-5">
                            <div className="flex items-center justify-center gap-3">
                              <button
                                onClick={() => openRfpModal(temp)}
                                className="p-2 hover:bg-amber-50 rounded-lg transition group"
                                title="Edit"
                              >
                                <MdEdit className="w-5 h-5 text-gray-600 group-hover:text-amber-600" />
                              </button>
                              <button
                                onClick={() => handleDeleteRfp(temp.id)}
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
          )}

          {/* Gmail Integration Tab */}
          {activeTab === "email" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-medium">Gmail Integration</h3>
                {gmailConnected ? (
                  <div className="flex gap-3">
                    <button
                      onClick={() => setComposeModal(true)}
                      className="flex items-center gap-3 px-6 py-3.5 bg-black text-white rounded-xl hover:bg-gray-900 transition font-medium"
                    >
                      <MdSend className="w-5 h-5" /> Compose Email
                    </button>
                    <button
                      onClick={handleDisconnectGmail}
                      className="flex items-center gap-3 px-6 py-3.5 border border-red-300 text-red-600 rounded-xl hover:bg-red-50 transition font-medium"
                    >
                      Disconnect Gmail
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleConnectGmail}
                    className="flex items-center gap-3 px-6 py-3.5 bg-black text-white rounded-xl hover:bg-gray-900 transition font-medium"
                  >
                    <MdEmail className="w-5 h-5" /> Connect Gmail
                  </button>
                )}
              </div>

              {!gmailConnected ? (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <MdEmail className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-medium mb-2">Gmail Not Connected</h3>
                  <p className="text-gray-500 mb-4">
                    Connect your Gmail account to send and view emails directly from the CRM
                  </p>
                  <p className="text-sm text-gray-600">
                    Secure OAuth2 integration with Google • Full access to send emails
                  </p>
                </div>
              ) : (
                <div>
                  <h4 className="text-lg font-medium mb-4">Recent Sent Emails</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px]">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">To</th>
                          <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Subject</th>
                          <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Sent At</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {recentEmails.length === 0 ? (
                          <tr>
                            <td colSpan="3" className="text-center py-16 text-gray-500">
                              No emails sent yet
                            </td>
                          </tr>
                        ) : (
                          recentEmails.map((email) => (
                            <tr key={email.id} className="hover:bg-gray-50">
                              <td className="px-6 py-5">{email.to}</td>
                              <td className="px-6 py-5 truncate max-w-[300px]">{email.subject}</td>
                              <td className="px-6 py-5">{new Date(email.sent_at).toLocaleString()}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </LayoutComponents>

      {/* Proposal Template Modal */}
      {showProposalModal && (
        <LayoutComponents
          variant="modal"
          title={editingProposal ? "Edit Proposal Template" : "Add Proposal Template"}
          onCloseModal={() => setShowProposalModal(false)}
          modal={
            <div className="space-y-6">
              <Input
                label="Template Name"
                required
                value={proposalForm.name}
                onChange={e => setProposalForm({ ...proposalForm, name: e.target.value })}
                placeholder="e.g., Web Development Proposal"
              />
              <Input
                label="Proposal Template"
                required
                value={proposalForm.template}
                onChange={e => setProposalForm({ ...proposalForm, template: e.target.value })}
                placeholder="e.g., Standard proposal for web projects"
              />
              <Input
                label="Body Content (HTML allowed)"
                type="textarea"
                rows={12}
                value={proposalForm.body}
                onChange={e => setProposalForm({ ...proposalForm, body: e.target.value })}
                placeholder="Enter rich text or HTML content..."
              />
              <div className="flex justify-end gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => setShowProposalModal(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProposal}
                  className="px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-900 transition"
                >
                  Save Template
                </button>
              </div>
            </div>
          }
        />
      )}

      {/* RFP Template Modal */}
      {showRfpModal && (
        <LayoutComponents
          variant="modal"
          title={editingRfp ? "Edit RFP Body Template" : "Add RFP Body Template"}
          onCloseModal={() => setShowRfpModal(false)}
          modal={
            <div className="space-y-6">
              <Input
                label="Category"
                required
                value={rfpForm.category}
                onChange={e => setRfpForm({ ...rfpForm, category: e.target.value })}
                placeholder="e.g., Website Redesign"
              />
              <Input
                label="RFP Body (HTML allowed)"
                type="textarea"
                rows={12}
                value={rfpForm.body}
                onChange={e => setRfpForm({ ...rfpForm, body: e.target.value })}
                placeholder="Enter the RFP email body template..."
              />
              <div className="flex justify-end gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => setShowRfpModal(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveRfp}
                  className="px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-900 transition"
                >
                  Save Template
                </button>
              </div>
            </div>
          }
        />
      )}

      {/* Gmail Compose Modal */}
      {composeModal && (
        <LayoutComponents
          variant="modal"
          title="Compose Email"
          onCloseModal={() => setComposeModal(false)}
          modal={
            <form onSubmit={handleSendEmail} className="space-y-6">
              <Input
                label="To"
                type="email"
                required
                value={emailForm.to}
                onChange={e => setEmailForm({ ...emailForm, to: e.target.value })}
                placeholder="recipient@example.com"
              />
              <Input
                label="CC"
                type="text"
                value={emailForm.cc}
                onChange={e => setEmailForm({ ...emailForm, cc: e.target.value })}
                placeholder="cc1@example.com, cc2@example.com"
              />
              <Input
                label="BCC"
                type="text"
                value={emailForm.bcc}
                onChange={e => setEmailForm({ ...emailForm, bcc: e.target.value })}
                placeholder="bcc1@example.com, bcc2@example.com"
              />
              <Input
                label="Subject"
                required
                value={emailForm.subject}
                onChange={e => setEmailForm({ ...emailForm, subject: e.target.value })}
                placeholder="Email subject"
              />
              <div className="flex flex-wrap gap-4">
                <select
                  value={emailForm.template?.id || ""}
                  onChange={(e) => {
                    const selected = [...proposalTemplates, ...rfpTemplates].find(t => t.id === parseInt(e.target.value));
                    if (selected) useTemplateInEmail(selected);
                  }}
                  className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black outline-none"
                >
                  <option value="">Use Template</option>
                  <optgroup label="Proposal Templates">
                    {proposalTemplates.map(t => (
                      <option key={`prop-${t.id}`} value={t.id}>{t.name}</option>
                    ))}
                  </optgroup>
                  <optgroup label="RFP Templates">
                    {rfpTemplates.map(t => (
                      <option key={`rfp-${t.id}`} value={t.id}>{t.category}</option>
                    ))}
                  </optgroup>
                </select>
              </div>
              <Input
                label="Body"
                type="textarea"
                rows={12}
                value={emailForm.body}
                onChange={e => setEmailForm({ ...emailForm, body: e.target.value })}
                placeholder="Email content..."
              />
              <div className="flex justify-end gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => setComposeModal(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-900 transition"
                >
                  Send Email
                </button>
              </div>
            </form>
          }
        />
      )}
    </div>
  );
};

export default Communication;