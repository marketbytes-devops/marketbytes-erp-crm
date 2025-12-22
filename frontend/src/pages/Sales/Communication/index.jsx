import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MdAdd, MdEdit, MdDelete, MdClose, MdKeyboardArrowDown } from "react-icons/md";
import LayoutComponents from "../../../components/LayoutComponents";
import Input from "../../../components/Input";
import toast from "react-hot-toast";

const Communication = () => {
  const [activeTab, setActiveTab] = useState("proposal");

  const [proposalTemplates, setProposalTemplates] = useState([]);
  const [rfpTemplates, setRfpTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showProposalModal, setShowProposalModal] = useState(false);
  const [editingProposal, setEditingProposal] = useState(null);
  const [proposalForm, setProposalForm] = useState({ name: "", template: "", body: "" });

  const [showRfpModal, setShowRfpModal] = useState(false);
  const [editingRfp, setEditingRfp] = useState(null);
  const [rfpForm, setRfpForm] = useState({ category: "", body: "" });

  useEffect(() => {
    // Simulate fetching from backend
    setTimeout(() => {
      setProposalTemplates([
        { id: 1, name: "Web Development Proposal", template: "Standard proposal for web projects", body: "<p>Detailed proposal content...</p>" },
        { id: 2, name: "Digital Marketing Package", template: "Full marketing suite", body: "<p>Marketing services proposal...</p>" },
      ]);
      setRfpTemplates([
        { id: 1, category: "Website Redesign", body: "<p>We are interested in redesigning our website...</p>" },
        { id: 2, category: "SEO Services", body: "<p>Request for SEO optimization services...</p>" },
      ]);
      setLoading(false);
    }, 800);
  }, []);

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

  const handleSaveProposal = () => {
    if (!proposalForm.name.trim() || !proposalForm.template.trim()) {
      toast.error("Template Name and Proposal Template are required");
      return;
    }

    if (editingProposal) {
      setProposalTemplates(proposalTemplates.map(t => 
        t.id === editingProposal.id ? { ...t, ...proposalForm } : t
      ));
    } else {
      const newTemplate = { id: Date.now(), ...proposalForm };
      setProposalTemplates([...proposalTemplates, newTemplate]);
    }
    toast.success("Proposal template saved");
    setShowProposalModal(false);
  };

  const handleDeleteProposal = (id) => {
    if (!window.confirm("Delete this proposal template?")) return;
    setProposalTemplates(proposalTemplates.filter(t => t.id !== id));
    toast.success("Proposal template deleted");
  };

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

  const handleSaveRfp = () => {
    if (!rfpForm.category.trim()) {
      toast.error("Category is required");
      return;
    }

    if (editingRfp) {
      setRfpTemplates(rfpTemplates.map(t => 
        t.id === editingRfp.id ? { ...t, ...rfpForm } : t
      ));
    } else {
      const newTemplate = { id: Date.now(), ...rfpForm };
      setRfpTemplates([...rfpTemplates, newTemplate]);
    }
    toast.success("RFP template saved");
    setShowRfpModal(false);
  };

  const handleDeleteRfp = (id) => {
    if (!window.confirm("Delete this RFP template?")) return;
    setRfpTemplates(rfpTemplates.filter(t => t.id !== id));
    toast.success("RFP template deleted");
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-black border-t-transparent"></div></div>;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <LayoutComponents title="Communication Tools" subtitle="Manage reusable templates for proposals, RFPs, and emails" variant="card">
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
              Email Templates
            </button>
          </div>

          {/* Proposal Templates Tab */}
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
                      <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Template Name</th>
                      <th className="px-6 py-5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Proposal Template</th>
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

          {/* RFP Templates Tab */}
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

          {/* Email Templates Tab */}
          {activeTab === "email" && (
            <div className="text-center py-24">
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MdAdd className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-medium mb-2">Email Templates Coming Soon</h3>
                <p className="text-gray-500 mb-4">Reusable email templates will be available here soon</p>
                <p className="text-sm text-gray-600">Stay tuned for powerful email automation features!</p>
              </div>
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
    </div>
  );
};

export default Communication;