import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import LayoutComponents from "../../../components/LayoutComponents";
import apiClient from "../../../helpers/apiClient";
import {
  MdAdd,
  MdEdit,
  MdDelete,
  MdClose,
  MdEmail,
  MdSend,
  MdHistory,
  MdLayers,
  MdCheckCircle,
  MdErrorOutline,
  MdSettingsEthernet,
  MdLaunch
} from "react-icons/md";
import { FiMail, FiFileText, FiLink, FiShield } from "react-icons/fi";
import toast from "react-hot-toast";
import Input from "../../../components/Input";
import Loading from "../../../components/Loading";

const TABS = [
  { id: "proposal", label: "Proposals", icon: FiFileText },
  { id: "rfp", label: "RFP Templates", icon: MdLayers },
  { id: "email", label: "Gmail Integration", icon: FiMail },
];

const Communication = () => {
  const [activeTab, setActiveTab] = useState("proposal");
  const [proposalTemplates, setProposalTemplates] = useState([]);
  const [rfpTemplates, setRfpTemplates] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Gmail Integration State
  const [gmailConnected, setGmailConnected] = useState(false);
  const [recentEmails, setRecentEmails] = useState([]);
  const [composeModal, setComposeModal] = useState(false);
  const [emailForm, setEmailForm] = useState({
    to: "", cc: "", bcc: "", subject: "", body: "", template: null,
  });

  // Modal State
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [editingProposal, setEditingProposal] = useState(null);
  const [proposalForm, setProposalForm] = useState({ name: "", template: "", body: "" });

  const [showRfpModal, setShowRfpModal] = useState(false);
  const [editingRfp, setEditingRfp] = useState(null);
  const [rfpForm, setRfpForm] = useState({ category: "", body: "" });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [propRes, rfpRes, deptRes, gmailStatus] = await Promise.all([
        apiClient.get("/sales/proposal-templates/"),
        apiClient.get("/sales/rfp-templates/"),
        apiClient.get("/auth/departments/"),
        apiClient.get("/gmail/status/").catch(() => ({ data: { connected: false } })),
      ]);

      setProposalTemplates(propRes.data.results || propRes.data || []);
      setRfpTemplates(rfpRes.data.results || rfpRes.data || []);
      setDepartments(deptRes.data.results || deptRes.data || []);
      setGmailConnected(gmailStatus.data.connected || false);

      if (gmailStatus.data.connected) {
        fetchRecentEmails();
      }
    } catch (err) {
      toast.error("Failed to load communication tools");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fetchRecentEmails = async () => {
    try {
      const res = await apiClient.get("/gmail/sent-emails/");
      setRecentEmails(res.data || []);
    } catch (err) {
      console.error("Gmail fetch error:", err);
    }
  };

  const handleConnectGmail = async () => {
    try {
      const res = await apiClient.get("/gmail/connect/");
      window.location.href = res.data.auth_url;
    } catch (err) {
      toast.error("Failed to initiate Gmail connection");
    }
  };

  const handleDisconnectGmail = async () => {
    if (!window.confirm("Disconnect Gmail account? All integration features will be disabled.")) return;
    try {
      await apiClient.post("/gmail/disconnect/");
      setGmailConnected(false);
      setRecentEmails([]);
      toast.success("Gmail disconnected");
    } catch (err) {
      toast.error("Failed to disconnect Gmail");
    }
  };

  // Proposal Actions
  const openProposalModal = (template = null) => {
    setEditingProposal(template);
    setProposalForm(template ? { ...template } : { name: "", template: "", body: "" });
    setShowProposalModal(true);
  };

  const handleSaveProposal = async () => {
    if (!proposalForm.name.trim()) return toast.error("Template name is required");
    try {
      if (editingProposal) {
        const res = await apiClient.put(`/sales/proposal-templates/${editingProposal.id}/`, proposalForm);
        setProposalTemplates(prev => prev.map(t => t.id === editingProposal.id ? res.data : t));
      } else {
        const res = await apiClient.post("/sales/proposal-templates/", proposalForm);
        setProposalTemplates([res.data, ...proposalTemplates]);
      }
      toast.success("Proposal saved");
      setShowProposalModal(false);
    } catch (err) {
      toast.error("Failed to save proposal");
    }
  };

  const handleDeleteProposal = async (id) => {
    if (!window.confirm("Delete this template?")) return;
    try {
      await apiClient.delete(`/sales/proposal-templates/${id}/`);
      setProposalTemplates(prev => prev.filter(t => t.id !== id));
      toast.success("Deleted successfully");
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  // RFP Actions
  const openRfpModal = (template = null) => {
    setEditingRfp(template);
    setRfpForm(template ? { category: template.category, body: template.body } : { category: "", body: "" });
    setShowRfpModal(true);
  };

  const handleSaveRfp = async () => {
    if (!rfpForm.category) return toast.error("Please select a category");
    try {
      const payload = { category: parseInt(rfpForm.category), body: rfpForm.body };
      if (editingRfp) {
        const res = await apiClient.put(`/sales/rfp-templates/${editingRfp.id}/`, payload);
        setRfpTemplates(prev => prev.map(t => t.id === editingRfp.id ? res.data : t));
      } else {
        const res = await apiClient.post("/sales/rfp-templates/", payload);
        setRfpTemplates([res.data, ...rfpTemplates]);
      }
      toast.success("RFP Body saved");
      setShowRfpModal(false);
    } catch (err) {
      toast.error("Failed to save RFP template");
    }
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    const loadId = toast.loading("Sending email...");
    try {
      await apiClient.post("/gmail/send/", emailForm);
      toast.success("Email sent successfully!", { id: loadId });
      setComposeModal(false);
      setEmailForm({ to: "", cc: "", bcc: "", subject: "", body: "", template: null });
      fetchRecentEmails();
    } catch (err) {
      toast.error("Failed to send email", { id: loadId });
    }
  };

  if (loading && proposalTemplates.length === 0) return <Loading />;

  return (
    <div className="p-6 min-h-screen">
      <LayoutComponents
        title="Communication Hub"
        subtitle="Master your templates and outreach channels"
        variant="table"
      >
        {/* Modern Tab Bar */}
        <div className="flex items-center gap-2 p-1 bg-white border border-gray-100 rounded-2xl shadow-sm w-fit mb-8">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-3 px-6 py-3.5 rounded-xl text-sm font-medium transition-all duration-300 ${isActive ? "text-black" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                  }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-gray-100 rounded-xl -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <Icon className={`w-5 h-5 ${isActive ? "text-black" : "text-gray-400"}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {/* Proposal Templates View */}
          {activeTab === "proposal" && (
            <motion.div
              key="prop-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                    <FiFileText className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-medium text-gray-900">Proposal Library</h3>
                </div>
                <button
                  onClick={() => openProposalModal()}
                  className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-900 transition-all font-medium shadow-black/10 active:scale-95"
                >
                  <MdAdd className="w-5 h-5" /> New Template
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {proposalTemplates.length === 0 ? (
                  <div className="col-span-full bg-white border border-dashed border-gray-200 rounded-3xl py-20 text-center">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FiFileText className="w-10 h-10 text-gray-300" />
                    </div>
                    <p className="text-gray-400 font-medium">No templates created yet</p>
                  </div>
                ) : (
                  proposalTemplates.map((temp, i) => (
                    <motion.div
                      key={temp.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="group bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-black/5 transition-all duration-300 relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <button onClick={() => openProposalModal(temp)} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-600"><MdEdit /></button>
                        <button onClick={() => handleDeleteProposal(temp.id)} className="p-2 bg-red-50 hover:bg-red-100 rounded-lg text-red-600"><MdDelete /></button>
                      </div>
                      <div className="mb-4">
                        <div className="text-xs font-medium text-blue-600 uppercase tracking-widest mb-1">PROPOSAL</div>
                        <h4 className="text-lg font-medium text-gray-900 group-hover:text-black transition-colors">{temp.name}</h4>
                      </div>
                      <p className="text-sm text-gray-500 line-clamp-2 mb-6 h-10">{temp.template || "Standard web project proposal structure..."}</p>
                      <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                        <div className="flex -space-x-2">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 border-2 border-white flex items-center justify-center text-[10px] font-medium text-emerald-700">MB</div>
                        </div>
                        <span className="text-[11px] text-gray-400 font-medium italic">Updated 2 days ago</span>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* RFP Templates View */}
          {activeTab === "rfp" && (
            <motion.div
              key="rfp-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                    <MdLayers className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-medium text-gray-900">RFP Body Templates</h3>
                </div>
                <button
                  onClick={() => openRfpModal()}
                  className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-900 transition-all font-medium shadow-lg shadow-black/10 active:scale-95"
                >
                  <MdAdd className="w-5 h-5" /> New Body Template
                </button>
              </div>

              <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
                <table className="w-full">
                  <thead className="bg-[#fcfdfe] border-b border-gray-100">
                    <tr>
                      <th className="px-8 py-5 text-left text-[11px] font-medium text-gray-400 uppercase tracking-widest">Department</th>
                      <th className="px-8 py-5 text-left text-[11px] font-medium text-gray-400 uppercase tracking-widest">Content Snippet</th>
                      <th className="px-8 py-5 text-right text-[11px] font-medium text-gray-400 uppercase tracking-widest">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {rfpTemplates.map((temp) => (
                      <tr key={temp.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-8 py-5 font-medium text-blue-600">{temp.category_name || "Enterprise"}</td>
                        <td className="px-8 py-5 text-gray-600 truncate max-w-md italic">"{temp.body.replace(/<[^>]+>/g, '').substring(0, 80)}..."</td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex justify-end gap-2 text-gray-400">
                            <button onClick={() => openRfpModal(temp)} className="p-2 hover:bg-white hover:text-black rounded-lg transition-all shadow-sm"><MdEdit /></button>
                            <button onClick={() => handleDeleteRfp(temp.id)} className="p-2 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all"><MdDelete /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Gmail Integration View */}
          {activeTab === "email" && (
            <motion.div
              key="email-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Connection Box */}
                <div className="bg-black rounded-[2.5rem] p-10 text-white relative overflow-hidden flex flex-col justify-between min-h-[400px]">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-[100px] -mr-32 -mt-32"></div>
                  <div className="relative z-10">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-medium uppercase tracking-wider mb-8 ${gmailConnected ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                      }`}>
                      {gmailConnected ? <><MdCheckCircle className="w-4 h-4" /> Connected</> : <><MdErrorOutline className="w-4 h-4" /> Not Linked</>}
                    </div>
                    <h3 className="text-4xl font-medium leading-tight mb-4 tracking-tight">Email Automation via Gmail</h3>
                    <p className="text-gray-400 text-sm leading-relaxed mb-6">
                      Securely link your Google Workspace account to send personalized proposals and track customer responses directly from MarketBytes.
                    </p>
                  </div>

                  <div className="relative z-10 space-y-4">
                    {gmailConnected ? (
                      <>
                        <button
                          onClick={() => setComposeModal(true)}
                          className="w-full flex items-center justify-center gap-3 py-4 bg-white text-black rounded-2xl font-medium hover:scale-[1.02] transition-transform active:scale-95"
                        >
                          <MdSend className="w-5 h-5" /> Start New Outreach
                        </button>
                        <button
                          onClick={handleDisconnectGmail}
                          className="w-full flex items-center justify-center gap-3 py-4 bg-gray-900 text-gray-400 rounded-2xl font-medium hover:text-red-400 transition-colors"
                        >
                          Revoke Access
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={handleConnectGmail}
                        className="w-full flex items-center justify-center gap-3 py-4 bg-white text-black rounded-2xl font-medium hover:scale-[1.02] transition-transform active:scale-95 shadow-[0_20px_40px_-10px_rgba(255,255,255,0.2)]"
                      >
                        <FiLink className="w-5 h-5" /> Connect with Google
                      </button>
                    )}
                    <div className="flex items-center justify-center gap-4 pt-4 text-[10px] uppercase font-medium text-gray-500 tracking-widest">
                      <span className="flex items-center gap-1"><FiShield className="w-3 h-3" /> SSL Encrypted</span>
                      <span>•</span>
                      <span>OAuth 2.0 Auth</span>
                    </div>
                  </div>
                </div>

                {/* Recent History Table */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xl font-medium text-gray-900 flex items-center gap-3">
                      <MdHistory className="w-6 h-6 text-gray-400" /> Outreach History
                    </h4>
                    <span className="text-xs font-medium text-gray-400 uppercase bg-gray-100 px-3 py-1 rounded-lg">Last 20 records</span>
                  </div>

                  <div className="bg-white rounded-3xl border border-gray-100 shadow-sm flex-1">
                    {!gmailConnected ? (
                      <div className="h-full flex flex-col items-center justify-center p-20 text-center">
                        <div className="p-6 bg-gray-50 rounded-3xl mb-4"><FiMail className="w-12 h-12 text-gray-200" /></div>
                        <p className="text-gray-400 font-medium">History will appear here once connected</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full mb-4">
                          <thead className="border-b border-gray-50">
                            <tr>
                              <th className="px-6 py-5 text-left text-[11px] font-medium text-gray-400 uppercase tracking-widest">Recipient</th>
                              <th className="px-6 py-5 text-left text-[11px] font-medium text-gray-400 uppercase tracking-widest">Subject</th>
                              <th className="px-6 py-5 text-right text-[11px] font-medium text-gray-400 uppercase tracking-widest">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {recentEmails.length === 0 ? (
                              <tr><td colSpan="3" className="py-20 text-center text-gray-400 italic">No outreach history found</td></tr>
                            ) : (
                              recentEmails.map((email) => (
                                <tr key={email.id} className="group hover:bg-gray-50 transition-colors">
                                  <td className="px-6 py-5">
                                    <div className="font-medium text-gray-900">{email.to}</div>
                                    <div className="text-[10px] text-gray-400 font-medium">{new Date(email.sent_at).toLocaleDateString()} at {new Date(email.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                  </td>
                                  <td className="px-6 py-5 text-sm font-medium text-gray-600 truncate max-w-xs">{email.subject}</td>
                                  <td className="px-6 py-5 text-right">
                                    <span className="bg-emerald-50 text-emerald-600 text-[10px] font-medium px-2.5 py-1 rounded-full uppercase tracking-tighter">Delivered</span>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </LayoutComponents>

      {/* Modals with Premium Styling */}
      {/* Proposal Modal */}
      {showProposalModal && (
        <LayoutComponents
          variant="modal"
          title={editingProposal ? "Refine Proposal" : "New Library Proposal"}
          onCloseModal={() => setShowProposalModal(false)}
          modal={
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Display Name"
                  required
                  value={proposalForm.name}
                  onChange={(e) => setProposalForm({ ...proposalForm, name: e.target.value })}
                  placeholder="e.g. Premium App Architecture"
                />
                <Input
                  label="Internal Label"
                  required
                  value={proposalForm.template}
                  onChange={(e) => setProposalForm({ ...proposalForm, template: e.target.value })}
                  placeholder="e.g. mobile-app-standard-v2"
                />
              </div>
              <div className="p-1 bg-gray-50 rounded-2xl border border-gray-100">
                <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-widest px-4 py-2">Template Content</label>
                <div className="bg-white rounded-xl overflow-hidden shadow-inner">
                  <ReactQuill theme="snow" value={proposalForm.body} onChange={(v) => setProposalForm({ ...proposalForm, body: v })} style={{ height: "320px", border: 'none' }} />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button onClick={() => setShowProposalModal(false)} className="px-8 py-4 text-sm font-medium text-gray-600 hover:text-black transition">Discard Changes</button>
                <button onClick={handleSaveProposal} className="px-10 py-4 bg-black text-white rounded-2xl font-medium shadow-xl shadow-black/10 active:scale-95">Save Document</button>
              </div>
            </div>
          }
        />
      )}

      {/* RFP Modal */}
      {showRfpModal && (
        <LayoutComponents
          variant="modal"
          title={editingRfp ? "Update RFP Body" : "Construct RFP Fragment"}
          onCloseModal={() => setShowRfpModal(false)}
          modal={
            <div className="space-y-8">
              <div className="col-span-full">
                <label className="block text-sm font-medium text-gray-700 mb-3">Target Department Context</label>
                <select
                  value={rfpForm.category}
                  onChange={(e) => setRfpForm({ ...rfpForm, category: e.target.value })}
                  className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black outline-none font-medium text-gray-900"
                >
                  <option value="">Select Domain...</option>
                  {departments.map((dept) => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
                </select>
              </div>
              <div className="p-1 bg-gray-50 rounded-2xl border border-gray-100">
                <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-widest px-4 py-2">Fragment Content</label>
                <div className="bg-white rounded-xl overflow-hidden">
                  <ReactQuill theme="snow" value={rfpForm.body} onChange={(v) => setRfpForm({ ...rfpForm, body: v })} style={{ height: "320px", border: 'none' }} />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button onClick={() => setShowRfpModal(false)} className="px-8 py-4 text-sm font-medium text-gray-600 hover:text-black">Cancel</button>
                <button onClick={handleSaveRfp} className="px-10 py-4 bg-black text-white rounded-2xl font-medium shadow-xl shadow-black/10">Commit Fragment</button>
              </div>
            </div>
          }
        />
      )}

      {/* Compose Modal */}
      {composeModal && (
        <LayoutComponents
          variant="modal"
          title="Compose New Outreach"
          onCloseModal={() => setComposeModal(false)}
          modal={
            <form onSubmit={handleSendEmail} className="space-y-8">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Recipient Email" type="email" required value={emailForm.to} onChange={(e) => setEmailForm({ ...emailForm, to: e.target.value })} />
                  <div className="flex flex-col">
                    <label className="block text-sm font-medium text-gray-700 mb-[11px]">Apply Template</label>
                    <select
                      onChange={(e) => {
                        const all = [...proposalTemplates, ...rfpTemplates];
                        const selected = all.find(t => t.id === parseInt(e.target.value));
                        if (selected) setEmailForm({ ...emailForm, body: selected.body });
                      }}
                      className="w-full h-[58px] px-5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black outline-none font-medium"
                    >
                      <option value="">Choose a snippet...</option>
                      <optgroup label="Proposals">
                        {proposalTemplates.map(t => <option key={`p-${t.id}`} value={t.id}>{t.name}</option>)}
                      </optgroup>
                      <optgroup label="RFP Bodies">
                        {rfpTemplates.map(t => <option key={`r-${t.id}`} value={t.id}>{t.category_name || t.category}</option>)}
                      </optgroup>
                    </select>
                  </div>
                </div>
                <Input label="Subject Line" required value={emailForm.subject} onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })} />
              </div>

              <div className="p-1 bg-gray-50 rounded-2xl border border-gray-100">
                <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-widest px-4 py-2">Message Body</label>
                <textarea
                  rows={10}
                  className="w-full p-6 bg-white border-none rounded-xl focus:ring-0 outline-none text-gray-800 font-medium leading-relaxed"
                  value={emailForm.body.replace(/<[^>]+>/g, '')}
                  onChange={(e) => setEmailForm({ ...emailForm, body: e.target.value })}
                  placeholder="Write your message here..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setComposeModal(false)} className="px-8 py-4 text-sm font-medium text-gray-600 hover:text-black">Discard</button>
                <button type="submit" className="flex items-center gap-2 px-12 py-4 bg-black text-white rounded-2xl font-medium shadow-xl shadow-black/10 hover:translate-x-1 transition-transform">
                  Dispatch <MdLaunch className="w-4 h-4" />
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
