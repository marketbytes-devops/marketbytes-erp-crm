import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import LayoutComponents from "../../../components/LayoutComponents";
import {
  MdAdd,
  MdVisibility,
  MdEdit,
  MdDelete,
  MdDownload,
  MdEmail,
  MdSearch,
  MdFilterList,
  MdMoreVert,
  MdDateRange,
  MdAccountBalanceWallet,
  MdCheckCircle,
  MdError,
  MdAccessTime
} from "react-icons/md";
import { FiFileText, FiDownload, FiMail, FiTrash2, FiEye } from "react-icons/fi";
import toast from "react-hot-toast";
import Input from "../../../components/Input";

const Invoices = () => {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  const [invoices] = useState([
    { id: 1, number: "INV-2026-001", client: "John Doe", company: "MarketBytes Inc", amount: 56000, status: "paid", date: "2026-01-15", dueDate: "2026-02-15" },
    { id: 2, number: "INV-2026-002", client: "Jane Smith", company: "Cyberdyne Systems", amount: 89000, status: "sent", date: "2026-02-01", dueDate: "2026-03-01" },
    { id: 3, number: "INV-2026-003", client: "Robert Bruce", company: "Acme Corp", amount: 125000, status: "overdue", date: "2026-01-10", dueDate: "2026-02-01" },
    { id: 4, number: "INV-2026-004", client: "Sarah Miller", company: "Globex Corp", amount: 45000, status: "draft", date: "2026-02-05", dueDate: "2026-03-05" },
    { id: 5, number: "INV-2026-005", client: "Michael Chen", company: "Stark Industries", amount: 210000, status: "paid", date: "2026-01-20", dueDate: "2026-02-20" },
  ]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const matchesSearch = inv.number.toLowerCase().includes(search.toLowerCase()) ||
        inv.client.toLowerCase().includes(search.toLowerCase()) ||
        inv.company.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = filterStatus === "all" || inv.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [search, filterStatus, invoices]);

  const getStatusStyle = (status) => {
    switch (status) {
      case "paid": return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case "sent": return "bg-blue-50 text-blue-600 border-blue-100";
      case "overdue": return "bg-rose-50 text-rose-600 border-rose-100";
      case "draft": return "bg-slate-50 text-slate-600 border-slate-100";
      default: return "bg-gray-50 text-gray-600 border-gray-100";
    }
  };

  const statCards = [
    { label: "Total Revenue", value: "₹5.25L", icon: MdAccountBalanceWallet, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Paid Invoices", value: "12", icon: MdCheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Pending Payment", value: "₹1.40L", icon: MdAccessTime, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Overdue", value: "3", icon: MdError, color: "text-rose-600", bg: "bg-rose-50" },
  ];

  return (
    <div className="p-6 min-h-screen">
      <LayoutComponents
        title="Revenue & Invoicing"
        subtitle="Professional financial tracking and client billing"
        variant="table"
      >
        {/* Stats Header */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color} transition-transform group-hover:scale-110`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Action Bar */}
        <div className="bg-white rounded-4xl border border-gray-100 p-4 mb-8 flex flex-col md:flex-row gap-4 justify-between items-center shadow-sm">
          <div className="flex gap-2 p-1 bg-gray-50 rounded-2xl border border-gray-100 w-full md:w-auto overflow-x-auto">
            {["all", "paid", "sent", "overdue", "draft"].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-5 py-2.5 rounded-xl text-sm font-medium capitalize transition-all whitespace-nowrap ${filterStatus === status
                  ? "bg-white text-black shadow-sm"
                  : "text-gray-500 hover:text-black"
                  }`}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="flex gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search invoice or client..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black transition-all outline-none font-medium placeholder:text-gray-400"
              />
            </div>
            <button
              onClick={() => setShowInvoiceModal(true)}
              className="flex items-center gap-2 px-6 py-3.5 bg-black text-white rounded-2xl hover:bg-gray-900 transition-all font-bold shadow-lg shadow-black/10 active:scale-95 whitespace-nowrap"
            >
              <MdAdd className="w-5 h-5" /> Create New
            </button>
          </div>
        </div>

        {/* Invoice Table */}
        <div className="bg-white rounded-4xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/50 border-b border-gray-50">
                <tr>
                  <th className="px-8 py-5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest">Invoice Details</th>
                  <th className="px-8 py-5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest">Client & Company</th>
                  <th className="px-8 py-5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest">Due Date</th>
                  <th className="px-8 py-5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-5 text-right text-[11px] font-bold text-gray-400 uppercase tracking-widest">Amount</th>
                  <th className="px-8 py-5 text-right text-[11px] font-bold text-gray-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-24 text-center">
                      <div className="flex flex-col items-center">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                          <FiFileText className="w-10 h-10 text-gray-200" />
                        </div>
                        <p className="text-gray-400 font-medium">No records matching your search</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <AnimatePresence>
                    {filteredInvoices.map((inv, i) => (
                      <motion.tr
                        key={inv.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="group hover:bg-indigo-50/30 transition-colors"
                      >
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 font-bold text-xs ring-1 ring-slate-200">
                              <FiFileText />
                            </div>
                            <div>
                              <div className="text-sm font-bold text-gray-900 leading-none mb-1">{inv.number}</div>
                              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Generated on {inv.date}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="text-sm font-bold text-gray-800">{inv.client}</div>
                          <div className="text-xs text-blue-600 font-medium">{inv.company}</div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                            <MdDateRange className="w-4 h-4 text-gray-400" />
                            {inv.dueDate}
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter border ${getStatusStyle(inv.status)}`}>
                            {inv.status === 'overdue' && <MdError className="w-3 h-3" />}
                            {inv.status === 'paid' && <MdCheckCircle className="w-3 h-3" />}
                            {inv.status}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="text-lg font-bold text-gray-900 tracking-tight">₹{inv.amount.toLocaleString()}</div>
                          <div className="text-[10px] text-emerald-500 font-bold">GST INCLUDED</div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-2 hover:bg-white hover:text-blue-600 rounded-lg transition-all shadow-sm" title="View Details"><FiEye /></button>
                            <button className="p-2 hover:bg-white hover:text-emerald-600 rounded-lg transition-all shadow-sm" title="Download PDF"><FiDownload /></button>
                            <button className="p-2 hover:bg-white hover:text-black rounded-lg transition-all shadow-sm" title="Email to Client"><FiMail /></button>
                            <button className="p-2 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all" title="Delete"><FiTrash2 /></button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </LayoutComponents>

      {/* Simplified Invoice Creation Slider/Modal Overlay */}
      {showInvoiceModal && (
        <LayoutComponents
          variant="modal"
          title="New Invoice Generation"
          onCloseModal={() => setShowInvoiceModal(false)}
          modal={
            <div className="space-y-8 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <h4 className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Client Selection</h4>
                  <select className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black outline-none font-medium">
                    <option value="">Choose Client...</option>
                    <option value="1">John Doe - MarketBytes</option>
                    <option value="2">Jane Smith - Cyberdyne</option>
                  </select>
                  <Input label="Invoice Number" placeholder="e.g. INV-2026-006" defaultValue="INV-2026-006" />
                </div>
                <div className="space-y-6">
                  <h4 className="text-[10px] font-bold text-purple-600 uppercase tracking-widest">Date Configuration</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Issue Date" type="date" defaultValue={new Date().toISOString().split('T')[0]} />
                    <Input label="Due Date" type="date" />
                  </div>
                  <Input label="Currency" value="INR (₹)" readOnly />
                </div>
              </div>

              <div className="p-6 bg-slate-50 rounded-4xl border border-slate-100 space-y-6">
                <h4 className="text-sm font-bold text-gray-900 border-b border-slate-200 pb-4">Line Items</h4>
                {/* Simplified Item Row */}
                <div className="grid grid-cols-12 gap-4 items-end">
                  <div className="col-span-6"><Input label="Description" placeholder="Web Development Services" /></div>
                  <div className="col-span-2"><Input label="Qty" type="number" defaultValue="1" /></div>
                  <div className="col-span-3"><Input label="Unit Price" type="number" placeholder="0.00" /></div>
                  <div className="col-span-1 pb-3"><button className="p-2 bg-white rounded-xl text-gray-400 hover:text-red-500 shadow-sm"><MdDelete /></button></div>
                </div>
                <button className="flex items-center gap-2 text-xs font-bold text-black border-2 border-dashed border-slate-200 w-full py-3 justify-center rounded-2xl hover:bg-white hover:border-black transition-all">
                  <MdAdd /> Add Another Item
                </button>
              </div>

              <div className="flex flex-col items-end gap-2 pr-4">
                <div className="flex justify-between w-64 text-sm font-medium text-gray-400"><span>Sub-total:</span> <span>₹0.00</span></div>
                <div className="flex justify-between w-64 text-sm font-medium text-gray-400"><span>Tax (GST 18%):</span> <span>₹0.00</span></div>
                <div className="flex justify-between w-64 text-xl font-bold text-gray-900 pt-2 border-t border-gray-100"><span>Total:</span> <span>₹0.00</span></div>
              </div>

              <div className="flex justify-end gap-4 pt-6">
                <button onClick={() => setShowInvoiceModal(false)} className="px-8 py-4 text-sm font-bold text-gray-600 hover:text-black transition">Discard</button>
                <button className="px-12 py-4 bg-black text-white rounded-2xl font-bold shadow-xl shadow-black/10 hover:translate-y-[-2px] transition-all">Generate & Send</button>
              </div>
            </div>
          }
        />
      )}
    </div>
  );
};

export default Invoices;
