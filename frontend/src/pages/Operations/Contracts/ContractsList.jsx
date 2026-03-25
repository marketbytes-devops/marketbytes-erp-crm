import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
 MdAdd,
 MdSearch,
 MdFilterList,
 MdFileDownload,
 MdDescription,
 MdCalendarToday,
 MdHistory,
 MdWarning,
 MdKeyboardArrowDown,
 MdEdit,
 MdDelete,
 MdRefresh
} from 'react-icons/md';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import apiClient from '../../../helpers/apiClient';
import { usePermission } from '../../../context/PermissionContext';
import LayoutComponents from '../../../components/LayoutComponents';
import Input from '../../../components/Input';

const ContractsList = () => {
 const navigate = useNavigate();
 const { hasPermission } = usePermission();
 const [contracts, setContracts] = useState([]);
 const [stats, setStats] = useState({
 total_contracts: 0,
 about_to_expire: 0,
 expired: 0
 });
 const [clients, setClients] = useState([]);
 const [contractTypes, setContractTypes] = useState([]);
 const [loading, setLoading] = useState(true);
 const [searchTerm, setSearchTerm] = useState('');
 const [isExportOpen, setIsExportOpen] = useState(false);

 // Filters state
 const [appliedFilters, setAppliedFilters] = useState({
 client: '',
 contract_type: '',
 start_date: '',
 end_date: ''
 });

 const [pagination, setPagination] = useState({
 count: 0,
 next: null,
 previous: null
 });

 useEffect(() => {
 fetchContracts();
 fetchStats();
 fetchFilters();
 }, []);

 const fetchFilters = async () => {
 try {
 const [clientsRes, typesRes] = await Promise.all([
 apiClient.get('/operation/clients/'),
 apiClient.get('/operation/contract-types/')
 ]);
 setClients(clientsRes.data.results || (Array.isArray(clientsRes.data) ? clientsRes.data : []));
 setContractTypes(typesRes.data.results || (Array.isArray(typesRes.data) ? typesRes.data : []));
 } catch (error) {
 console.error('Error fetching filters:', error);
 }
 };

 const fetchContracts = async (url = '/operation/contracts/') => {
 try {
 setLoading(true);
 const params = {
 search: searchTerm,
 client: appliedFilters.client,
 contract_type: appliedFilters.contract_type,
 start_date: appliedFilters.start_date,
 end_date: appliedFilters.end_date
 };

 const response = await apiClient.get(url, { params });
 if (response.data.results) {
 setContracts(response.data.results);
 setPagination({
 count: response.data.count,
 next: response.data.next,
 previous: response.data.previous
 });
 } else {
 setContracts(Array.isArray(response.data) ? response.data : []);
 }
 } catch (error) {
 console.error('Error fetching contracts:', error);
 setContracts([]);
 } finally {
 setLoading(false);
 }
 };

 const fetchStats = async () => {
 try {
 const response = await apiClient.get('/operation/contracts/stats/');
 setStats(response.data);
 } catch (error) {
 console.error('Error fetching stats:', error);
 }
 };

 const handleExport = (format) => {
 const url = `${apiClient.defaults.baseURL}/operation/contracts/export_${format}/`;
 const token = localStorage.getItem('access_token');

 fetch(url, {
 headers: {
 'Authorization': `Bearer ${token}`
 }
 })
 .then(response => response.blob())
 .then(blob => {
 const url = window.URL.createObjectURL(blob);
 const a = document.createElement('a');
 a.href = url;
 a.download = `contracts.${format === 'excel' ? 'xlsx' : format}`;
 document.body.appendChild(a);
 a.click();
 a.remove();
 setIsExportOpen(false);
 })
 .catch(err => console.error('Export failed:', err));
 };

 const handleDelete = async (id) => {
 if (!window.confirm('Are you sure you want to delete this contract?')) return;
 try {
 await apiClient.delete(`/operation/contracts/${id}/`);
 toast.success('Contract deleted successfully');
 fetchContracts();
 fetchStats();
 } catch (error) {
 console.error('Error deleting contract:', error);
 toast.error('Failed to delete contract');
 }
 };

 const handleFilterChange = (field, value) => {
 setAppliedFilters(prev => ({ ...prev, [field]: value }));
 };

 const resetFilters = () => {
 setAppliedFilters({
 client: '',
 contract_type: '',
 start_date: '',
 end_date: ''
 });
 setSearchTerm('');
 fetchContracts('/operation/contracts/');
 };

 const statusCards = [
 { label: 'Total Contracts', value: stats.total_contracts, icon: <MdDescription className="text-black" />, color: 'bg-gray-100', dot: 'bg-black' },
 { label: 'About To Expire', value: stats.about_to_expire, icon: <MdCalendarToday className="text-orange-500" />, color: 'bg-orange-50', dot: 'bg-orange-500' },
 { label: 'Expired', value: stats.expired, icon: <MdHistory className="text-red-500" />, color: 'bg-red-50', dot: 'bg-red-500' },
 ];

 return (
 <div className="p-6">
 <LayoutComponents
 title="Contracts"
 subtitle="Manage and track client agreements"
 variant="table"
 >
 {/* Stat Cards */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 mt-4">
 {statusCards.map((card, idx) => (
 <motion.div
 key={idx}
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: idx * 0.1 }}
 className="bg-white p-6 rounded-3xl shadow-xs border border-gray-100 transition-all hover:shadow-xl hover:shadow-gray-200/40 flex items-center gap-5 group"
 >
 <div className={`p-4 rounded-xl ${card.color} transition-transform group-hover:scale-110`}>
 {React.cloneElement(card.icon, { size: 28 })}
 </div>
 <div className="flex-1">
 <p className="text-gray-500 text-sm font-medium font-syne uppercase tracking-wider">{card.label}</p>
 <p className="text-3xl font-bold text-black mt-1">{card.value}</p>
 </div>
 </motion.div>
 ))}
 </div>

 {/* Actions Bar */}
 <div className="bg-white rounded-3xl shadow-xs border border-gray-100 p-6 mb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
 <div className="flex flex-wrap gap-4 items-center">
 <div className="relative w-full lg:w-80">
 <input
 type="text"
 placeholder="Search contracts..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 onKeyPress={(e) => e.key === 'Enter' && fetchContracts()}
 className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all text-sm"
 />
 <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={22} />
 </div>
 <button
 onClick={() => fetchContracts()}
 className="p-4 bg-black text-white rounded-xl hover:bg-gray-900 transition-all shadow-lg shadow-black/10 active:scale-95"
 >
 <MdSearch size={24} />
 </button>
 </div>

 <div className="flex items-center gap-3">
 {hasPermission("contracts", "add") && (
 <button
 onClick={() => navigate('/operations/contracts/create')}
 className="flex items-center gap-2 px-5 py-2.5 text-sm bg-black text-white rounded-xl hover:bg-gray-900 transition-all font-medium shadow-lg shadow-black/10 active:scale-95"
 >
 <MdAdd size={22} />
 <span className="hidden md:inline">Create Contract</span>
 </button>
 )}
 <div className="relative">
 <button
 onClick={() => setIsExportOpen(!isExportOpen)}
 className="flex items-center gap-2 px-5 py-2.5 text-sm bg-white border border-gray-100 text-black rounded-xl hover:bg-gray-50 transition-all font-medium shadow-xs active:scale-95"
 >
 <MdFileDownload size={22} />
 <span className="hidden md:inline">Export</span>
 <MdKeyboardArrowDown className={`transition-transform duration-300 ${isExportOpen ? 'rotate-180' : ''}`} size={20} />
 </button>

 <AnimatePresence>
 {isExportOpen && (
 <motion.div
 initial={{ opacity: 0, y: 10, scale: 0.95 }}
 animate={{ opacity: 1, y: 0, scale: 1 }}
 exit={{ opacity: 0, y: 10, scale: 0.95 }}
 className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden p-2"
 >
 {[
 { id: 'csv', label: 'Export as CSV', color: 'bg-emerald-500' },
 { id: 'excel', label: 'Export as Excel', color: 'bg-blue-500' },
 { id: 'pdf', label: 'Export as PDF', color: 'bg-red-500' }
 ].map(item => (
 <button
 key={item.id}
 onClick={() => handleExport(item.id)}
 className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition-all flex items-center gap-3"
 >
 <div className={`w-2 h-2 rounded-full ${item.color}`}></div>
 {item.label}
 </button>
 ))}
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 </div>
 </div>

 <div className="flex flex-col lg:flex-row gap-8">
 {/* Filter Sidebar */}
 <div className="w-full lg:w-72 shrink-0 bg-white p-8 rounded-3xl shadow-xs border border-gray-100 h-fit lg:sticky lg:top-8">
 <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-50">
 <h3 className="font-bold text-black flex items-center gap-2 font-syne uppercase tracking-tight">
 <MdFilterList size={22} /> Filter Results
 </h3>
 </div>

 <div className="space-y-6">
 <Input
 label="From"
 type="date"
 value={appliedFilters.start_date}
 onChange={(e) => handleFilterChange('start_date', e.target.value)}
 />
 <Input
 label="To"
 type="date"
 value={appliedFilters.end_date}
 onChange={(e) => handleFilterChange('end_date', e.target.value)}
 />

 <Input
 label="Client"
 type="select"
 value={appliedFilters.client}
 onChange={(val) => handleFilterChange('client', val)}
 options={[
 { value: '', label: 'All Clients' },
 ...clients.map(c => ({ value: c.id, label: c.name }))
 ]}
 />

 <Input
 label="Contract Type"
 type="select"
 value={appliedFilters.contract_type}
 onChange={(val) => handleFilterChange('contract_type', val)}
 options={[
 { value: '', label: 'All Types' },
 ...contractTypes.map(t => ({ value: t.id, label: t.name }))
 ]}
 />

 <div className="flex gap-3 pt-4 border-t border-gray-50">
 <button
 onClick={() => fetchContracts()}
 className="flex-1 bg-black text-white py-4 rounded-xl font-bold text-sm hover:bg-gray-900 transition-all shadow-lg shadow-black/5"
 >
 Apply
 </button>
 <button
 onClick={resetFilters}
 className="flex-1 bg-gray-50 text-black py-4 rounded-xl font-bold text-sm hover:bg-gray-100 transition-all"
 >
 Reset
 </button>
 </div>
 </div>
 </div>

 {/* Table Section */}
 <div className="flex-1 bg-white rounded-3xl shadow-xs border border-gray-100 overflow-hidden">
 <div className="overflow-x-auto">
 <table className="w-full text-left">
 <thead>
 <tr className="bg-gray-50/50 text-gray-400 text-[11px] font-bold uppercase tracking-widest border-b border-gray-50">
 <th className="px-8 py-6">#</th>
 <th className="px-8 py-6">Contract Description</th>
 <th className="px-8 py-6">Client</th>
 <th className="px-8 py-6 text-right">Amount</th>
 <th className="px-8 py-6">Timeline</th>
 <th className="px-8 py-6 text-center">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-50">
 {loading ? (
 <tr>
 <td colSpan="6" className="px-8 py-20">
 <div className="flex flex-col items-center justify-center gap-4">
 <div className="w-12 h-12 border-4 border-black/10 border-t-black rounded-full animate-spin"></div>
 <p className="text-gray-400 font-medium">Updating records...</p>
 </div>
 </td>
 </tr>
 ) : contracts.length === 0 ? (
 <tr>
 <td colSpan="6" className="px-8 py-24 text-center">
 <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
 <div className="p-6 bg-gray-50 rounded-3xl mb-6">
 <MdWarning size={64} className="text-gray-200" />
 </div>
 <h4 className="text-xl font-bold text-black mb-2 font-syne">No Contracts Found</h4>
 <p className="text-gray-500 text-sm">We couldn't find any contracts matching your current filters or search query.</p>
 <button
 onClick={resetFilters}
 className="mt-6 font-bold text-black underline underline-offset-4 hover:text-gray-600 transition-colors"
 >
 Clear all filters
 </button>
 </div>
 </td>
 </tr>
 ) : (
 contracts.map((contract, index) => (
 <tr key={contract.id} className="group hover:bg-gray-50/50 transition-all duration-300">
 <td className="px-8 py-6">
 <span className="text-gray-400 font-medium font-mono text-xs">{(index + 1).toString().padStart(2, '0')}</span>
 </td>
 <td className="px-8 py-6">
 <div>
 <p className="font-bold text-black text-base group-hover:text-black transition-colors">{contract.subject}</p>
 <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-medium">{contract.contract_type_name || "Agreement"}</p>
 </div>
 </td>
 <td className="px-8 py-6">
 <div className="flex items-center gap-2">
 <div className="w-8 h-8 rounded-full bg-linear-to-br from-gray-100 to-gray-50 border border-gray-100 flex items-center justify-center text-[10px] font-bold text-black">
 {contract.client_name?.substring(0, 2).toUpperCase()}
 </div>
 <span className="font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer">{contract.client_name}</span>
 </div>
 </td>
 <td className="px-8 py-6 text-right">
 <span className="font-bold text-black ">
 {contract.no_value ? 'TBD' : contract.amount}
 </span>
 </td>
 <td className="px-8 py-6">
 <div className="space-y-1">
 <p className="text-sm font-bold text-black">{contract.start_date}</p>
 <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
 TO {contract.no_end_date ? 'INDEFINITE' : contract.end_date}
 </p>
 </div>
 </td>
 <td className="px-8 py-6">
 <div className="flex justify-center items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-2 group-hover:translate-x-0">
 {hasPermission("contracts", "edit") && (
 <button
 onClick={() => navigate(`/operations/contracts/edit/${contract.id}`)}
 className="p-3 hover:bg-black hover:text-white rounded-xl transition-all duration-300 text-gray-400"
 title="Edit"
 >
 <MdEdit size={22} />
 </button>
 )}
 {hasPermission("contracts", "delete") && (
 <button
 onClick={() => handleDelete(contract.id)}
 className="p-3 hover:bg-red-500 hover:text-white rounded-xl transition-all duration-300 text-gray-400"
 title="Delete"
 >
 <MdDelete size={22} />
 </button>
 )}
 </div>
 </td>
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>

 {/* Pagination */}
 <div className="p-8 border-t border-gray-50 flex flex-col md:flex-row justify-between items-center gap-6 bg-gray-50/30">
 <p className="text-sm font-medium text-gray-500">
 Displaying <span className="text-black font-bold">{contracts.length}</span> of <span className="text-black font-bold">{pagination.count}</span> contracts
 </p>
 <div className="flex gap-3">
 <button
 onClick={() => pagination.previous && fetchContracts(pagination.previous)}
 className={`px-5 py-2.5 text-sm border border-gray-100 rounded-xl text-sm font-bold transition-all ${!pagination.previous ? 'text-gray-300 bg-gray-50 cursor-not-allowed' : 'text-black bg-white hover:bg-black hover:text-white hover:shadow-lg hover:shadow-black/5 active:scale-95'}`}
 disabled={!pagination.previous}
 >
 Previous
 </button>
 <button
 onClick={() => pagination.next && fetchContracts(pagination.next)}
 className={`px-5 py-2.5 text-sm border border-gray-100 rounded-xl text-sm font-bold transition-all ${!pagination.next ? 'text-gray-300 bg-gray-50 cursor-not-allowed' : 'text-black bg-white hover:bg-black hover:text-white hover:shadow-lg hover:shadow-black/5 active:scale-95'}`}
 disabled={!pagination.next}
 >
 Next
 </button>
 </div>
 </div>
 </div>
 </div>
 </LayoutComponents>
 </div>
 );
};

export default ContractsList;
