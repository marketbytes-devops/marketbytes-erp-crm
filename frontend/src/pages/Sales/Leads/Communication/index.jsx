import { useState } from "react";
import { motion } from "framer-motion";
import LayoutComponents from "../../../../components/LayoutComponents/index";
import { MdAdd, MdEdit, MdDelete, MdClose } from "react-icons/md";

const Communication = () => {
  const [activeTab, setActiveTab] = useState("proposal");

  // Proposal Templates State
  const [proposalTemplates, setProposalTemplates] = useState([
    { id: 1, name: "Web Development Proposal", template: "Standard proposal for web projects", body: "<p>Detailed proposal content...</p>" },
    { id: 2, name: "Digital Marketing Package", template: "Full marketing suite", body: "<p>Marketing services proposal...</p>" },
  ]);

  // RFP Templates State
  const [rfpTemplates, setRfpTemplates] = useState([
    { id: 1, category: "Website Redesign", body: "<p>We are interested in redesigning our website...</p>" },
    { id: 2, category: "SEO Services", body: "<p>Request for SEO optimization services...</p>" },
  ]);

  // Modal States
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [editingProposal, setEditingProposal] = useState(null);
  const [proposalForm, setProposalForm] = useState({ name: "", template: "", body: "" });

  const [showRfpModal, setShowRfpModal] = useState(false);
  const [editingRfp, setEditingRfp] = useState(null);
  const [rfpForm, setRfpForm] = useState({ category: "", body: "" });

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

  const handleSaveProposal = () => {
    if (!proposalForm.name.trim() || !proposalForm.template.trim()) {
      alert("Template Name and Proposal Template are required");
      return;
    }

    if (editingProposal) {
      setProposalTemplates(proposalTemplates.map(t => t.id === editingProposal.id ? { ...t, ...proposalForm } : t));
    } else {
      const newTemplate = {
        id: Date.now(),
        ...proposalForm
      };
      setProposalTemplates([...proposalTemplates, newTemplate]);
    }
    setShowProposalModal(false);
  };

  const handleDeleteProposal = (id) => {
    if (window.confirm("Delete this proposal template?")) {
      setProposalTemplates(proposalTemplates.filter(t => t.id !== id));
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

  const handleSaveRfp = () => {
    if (!rfpForm.category.trim()) {
      alert("Category is required");
      return;
    }

    if (editingRfp) {
      setRfpTemplates(rfpTemplates.map(t => t.id === editingRfp.id ? { ...t, ...rfpForm } : t));
    } else {
      const newTemplate = {
        id: Date.now(),
        ...rfpForm
      };
      setRfpTemplates([...rfpTemplates, newTemplate]);
    }
    setShowRfpModal(false);
  };

  const handleDeleteRfp = (id) => {
    if (window.confirm("Delete this RFP template?")) {
      setRfpTemplates(rfpTemplates.filter(t => t.id !== id));
    }
  };

  return (
    <div className="p-6">
      <LayoutComponents title="Communication Tools" subtitle="Manage reusable templates for proposals, RFPs, and emails" variant="card">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-8">
            <button
              onClick={() => setActiveTab("proposal")}
              className={`px-8 py-4 font-medium text-sm border-b-2 transition-colors ${
                activeTab === "proposal"
                  ? "border-black text-black"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Proposal Templates
            </button>
            <button
              onClick={() => setActiveTab("rfp")}
              className={`px-8 py-4 font-medium text-sm border-b-2 transition-colors ${
                activeTab === "rfp"
                  ? "border-black text-black"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              RFP Body Templates
            </button>
            <button
              onClick={() => setActiveTab("email")}
              className={`px-8 py-4 font-medium text-sm border-b-2 transition-colors ${
                activeTab === "email"
                  ? "border-black text-black"
                  : "border-transparent text-gray-500 hover:text-gray-700"
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
                  className="flex items-center gap-3 px-6 py-3.5 bg-black text-white rounded-xl hover:bg-gray-900 font-medium"
                >
                  <MdAdd className="w-5 h-5" /> Add Template
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50 text-left text-sm font-medium text-gray-700">
                      <th className="px-6 py-4">Sl No</th>
                      <th className="px-6 py-4">Template Name</th>
                      <th className="px-6 py-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {proposalTemplates.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="text-center py-8 text-gray-500">
                          No proposal templates yet. Click "Add Template" to create one.
                        </td>
                      </tr>
                    ) : (
                      proposalTemplates.map((temp, i) => (
                        <tr key={temp.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">{i + 1}</td>
                          <td className="px-6 py-4 font-medium">{temp.name}</td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-3">
                              <button onClick={() => openProposalModal(temp)} className="p-2 hover:bg-indigo-100 rounded-lg text-indigo-600">
                                <MdEdit className="w-5 h-5" />
                              </button>
                              <button onClick={() => handleDeleteProposal(temp.id)} className="p-2 hover:bg-red-100 rounded-lg text-red-600">
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

          {/* RFP Templates Tab */}
          {activeTab === "rfp" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-medium">RFP Body Templates</h3>
                <button
                  onClick={() => openRfpModal()}
                  className="flex items-center gap-3 px-6 py-3.5 bg-black text-white rounded-xl hover:bg-gray-900 font-medium"
                >
                  <MdAdd className="w-5 h-5" /> Add Template
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50 text-left text-sm font-medium text-gray-700">
                      <th className="px-6 py-4">Sl No</th>
                      <th className="px-6 py-4">Category Name</th>
                      <th className="px-6 py-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {rfpTemplates.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="text-center py-8 text-gray-500">
                          No RFP templates yet. Click "Add Template" to create one.
                        </td>
                      </tr>
                    ) : (
                      rfpTemplates.map((temp, i) => (
                        <tr key={temp.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">{i + 1}</td>
                          <td className="px-6 py-4 font-medium">{temp.category}</td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-3">
                              <button onClick={() => openRfpModal(temp)} className="p-2 hover:bg-indigo-100 rounded-lg text-indigo-600">
                                <MdEdit className="w-5 h-5" />
                              </button>
                              <button onClick={() => handleDeleteRfp(temp.id)} className="p-2 hover:bg-red-100 rounded-lg text-red-600">
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

          {/* Email Templates Tab */}
          {activeTab === "email" && (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MdAdd className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-medium mb-2">Email Templates Coming Soon</h3>
                <p className="text-gray-500 mb-8">Reusable email templates will be available here</p>
              </div>
            </div>
          )}
        </div>
      </LayoutComponents>

      {/* Proposal Template Modal */}
      {showProposalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-2xl font-bold">{editingProposal ? "Edit" : "Add"} Proposal Template</h2>
              <button onClick={() => setShowProposalModal(false)} className="p-2 hover:bg-gray-100 rounded-xl"><MdClose className="w-6 h-6" /></button>
            </div>
            <div className="p-8 space-y-6">
              <input
                type="text"
                placeholder="Template Name *"
                value={proposalForm.name}
                onChange={(e) => setProposalForm({ ...proposalForm, name: e.target.value })}
                className="w-full px-5 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black outline-none"
              />
              <input
                type="text"
                placeholder="Proposal Template *"
                value={proposalForm.template}
                onChange={(e) => setProposalForm({ ...proposalForm, template: e.target.value })}
                className="w-full px-5 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black outline-none"
              />
              <textarea
                placeholder="Body Content (Rich Text - HTML allowed)"
                value={proposalForm.body}
                onChange={(e) => setProposalForm({ ...proposalForm, body: e.target.value })}
                rows="10"
                className="w-full px-5 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black outline-none"
              />
              <div className="flex justify-end gap-4">
                <button onClick={() => setShowProposalModal(false)} className="px-8 py-3.5 border border-gray-300 rounded-xl hover:bg-gray-50">
                  Cancel
                </button>
                <button onClick={handleSaveProposal} className="px-8 py-3.5 bg-black text-white rounded-xl hover:bg-gray-900">
                  Save Template
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* RFP Template Modal */}
      {showRfpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-2xl font-bold">{editingRfp ? "Edit" : "Add"} RFP Body Template</h2>
              <button onClick={() => setShowRfpModal(false)} className="p-2 hover:bg-gray-100 rounded-xl"><MdClose className="w-6 h-6" /></button>
            </div>
            <div className="p-8 space-y-6">
              <input
                type="text"
                placeholder="Category *"
                value={rfpForm.category}
                onChange={(e) => setRfpForm({ ...rfpForm, category: e.target.value })}
                className="w-full px-5 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black outline-none"
              />
              <textarea
                placeholder="RFP Mail Body Template * (Rich Text - HTML allowed)"
                value={rfpForm.body}
                onChange={(e) => setRfpForm({ ...rfpForm, body: e.target.value })}
                rows="12"
                className="w-full px-5 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black outline-none"
              />
              <div className="flex justify-end gap-4">
                <button onClick={() => setShowRfpModal(false)} className="px-8 py-3.5 border border-gray-300 rounded-xl hover:bg-gray-50">
                  Cancel
                </button>
                <button onClick={handleSaveRfp} className="px-8 py-3.5 bg-black text-white rounded-xl hover:bg-gray-900">
                  Save Template
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Communication;