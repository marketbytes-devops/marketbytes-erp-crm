import { useState } from "react";
import { motion } from "framer-motion";
import LayoutComponents from "../../../components/LayoutComponents";
import { MdAdd, MdVisibility, MdEdit, MdDelete, MdDownload } from "react-icons/md";

const Invoices = () => {
  const [invoices] = useState([
    { id: 1, number: "INV-001", client: "John Doe", company: "ABC Corp", amount: 50000, status: "paid", date: "2025-12-15" },
    { id: 2, number: "INV-002", client: "Jane Smith", company: "XYZ Ltd", amount: 75000, status: "sent", date: "2025-12-18" },
    { id: 3, number: "INV-003", client: "Mike Brown", company: "Tech Co", amount: 120000, status: "overdue", date: "2025-12-10" },
    { id: 4, number: "INV-004", client: "Sarah Lee", company: "Global Inc", amount: 30000, status: "draft", date: "2025-12-19" },
  ]);

  const getStatusColor = (status) => {
    switch (status) {
      case "paid": return "bg-green-100 text-green-800";
      case "sent": return "bg-blue-100 text-blue-800";
      case "overdue": return "bg-red-100 text-red-800";
      case "draft": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-6">
      <LayoutComponents title="Invoices" subtitle="Manage and track client invoices" variant="card">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-medium">All Invoices</h3>
            <button className="flex items-center gap-3 px-6 py-3.5 bg-black text-white rounded-xl hover:bg-gray-900 font-medium">
              <MdAdd className="w-5 h-5" /> Generate Invoice
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50 text-left text-sm font-medium text-gray-700">
                  <th className="px-6 py-4">Invoice No</th>
                  <th className="px-6 py-4">Client</th>
                  <th className="px-6 py-4">Company</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {invoices.map((inv) => (
                  <motion.tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{inv.number}</td>
                    <td className="px-6 py-4">{inv.client}</td>
                    <td className="px-6 py-4">{inv.company}</td>
                    <td className="px-6 py-4 font-semibold">₹{inv.amount.toLocaleString()}</td>
                    <td className="px-6 py-4">{inv.date}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(inv.status)}`}>
                        {inv.status.replace("_", " ").toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <button className="p-2 hover:bg-blue-100 rounded-lg text-blue-600"><MdVisibility className="w-5 h-5" /></button>
                        <button className="p-2 hover:bg-indigo-100 rounded-lg text-indigo-600"><MdEdit className="w-5 h-5" /></button>
                        <button className="p-2 hover:bg-green-100 rounded-lg text-green-600"><MdDownload className="w-5 h-5" /></button>
                        <button className="p-2 hover:bg-red-100 rounded-lg text-red-600"><MdDelete className="w-5 h-5" /></button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </LayoutComponents>
    </div>
  );
};

export default Invoices;