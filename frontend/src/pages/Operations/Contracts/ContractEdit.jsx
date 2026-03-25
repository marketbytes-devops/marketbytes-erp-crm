import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import {
 MdArrowBack,
 MdSave,
 MdRefresh,
 MdAdd,
 MdCloudUpload,
 MdImage,
 MdClose,
 MdDelete,
 MdSearch,
 MdKeyboardArrowDown
} from 'react-icons/md';
import { toast } from 'react-hot-toast';
import apiClient from '../../../helpers/apiClient';
import LayoutComponents from '../../../components/LayoutComponents';
import Input from '../../../components/Input';

const ContractEdit = () => {
 const navigate = useNavigate();
 const { id } = useParams();
 const [clients, setClients] = useState([]);
 const [contractTypes, setContractTypes] = useState([]);
 const [loading, setLoading] = useState(false);
 const [logoPreview, setLogoPreview] = useState(null);

 // Modal & Dropdown States
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [newTypeName, setNewTypeName] = useState('');
 const [isSavingType, setIsSavingType] = useState(false);
 const [isTypesDropdownOpen, setIsTypesDropdownOpen] = useState(false);
 const [searchTerm, setSearchTerm] = useState('');

 const [formData, setFormData] = useState({
 subject: '',
 client_id: '',
 amount: '',
 no_value: false,
 contract_type_id: '',
 start_date: '',
 end_date: '',
 no_end_date: false,
 contract_name: '',
 alternate_address: '',
 city: '',
 state: '',
 country: '',
 postal_code: '',
 cell: '',
 office_phone_number: '',
 notes: '',
 company_logo: null
 });

 const fetchContractTypes = async () => {
 try {
 const response = await apiClient.get('/operation/contract-types/');
 setContractTypes(response.data.results || (Array.isArray(response.data) ? response.data : []));
 } catch (err) {
 console.error('Error fetching contract types:', err);
 }
 };

 useEffect(() => {
 const fetchData = async () => {
 try {
 const [clientsRes] = await Promise.all([
 apiClient.get('/operation/clients/'),
 ]);
 setClients(clientsRes.data.results || (Array.isArray(clientsRes.data) ? clientsRes.data : []));
 await fetchContractTypes();

 // Fetch Contract Details
 const contractRes = await apiClient.get(`/operation/contracts/${id}/`);
 const contract = contractRes.data;

 setFormData({
 subject: contract.subject || '',
 client_id: contract.client || '',
 amount: contract.amount || '',
 no_value: contract.no_value || false,
 contract_type_id: contract.contract_type || '',
 start_date: contract.start_date || '',
 end_date: contract.end_date || '',
 no_end_date: contract.no_end_date || false,
 contract_name: contract.contract_name || '',
 alternate_address: contract.alternate_address || '',
 city: contract.city || '',
 state: contract.state || '',
 country: contract.country || '',
 postal_code: contract.postal_code || '',
 cell: contract.cell || '',
 office_phone_number: contract.office_phone_number || '',
 notes: contract.notes || '',
 company_logo: null
 });

 if (contract.company_logo) {
 setLogoPreview(contract.company_logo);
 }

 } catch (err) {
 console.error('Error fetching dependency data:', err);
 toast.error("Failed to load contract details");
 }
 };
 fetchData();
 }, [id]);

 const handleSaveType = async () => {
 if (!newTypeName.trim()) return;
 setIsSavingType(true);
 try {
 await apiClient.post('/operation/contract-types/', { name: newTypeName });
 setNewTypeName('');
 await fetchContractTypes();
 toast.success('Contract type added successfully');
 } catch (err) {
 toast.error('Failed to add contract type');
 } finally {
 setIsSavingType(false);
 }
 };

 const handleDeleteType = async (id) => {
 if (!window.confirm('Are you sure you want to remove this contract type?')) return;
 try {
 await apiClient.delete(`/operation/contract-types/${id}/`);
 await fetchContractTypes();
 toast.success('Contract type removed');
 } catch (err) {
 toast.error('Failed to remove contract type');
 }
 };

 const handleChange = (e) => {
 const { name, value, type, checked } = e.target;
 setFormData(prev => ({
 ...prev,
 [name]: type === 'checkbox' ? checked : value
 }));
 };

 const handleFileChange = (e) => {
 const file = e.target.files[0];
 if (file) {
 setFormData(prev => ({ ...prev, company_logo: file }));
 const reader = new FileReader();
 reader.onloadend = () => {
 setLogoPreview(reader.result);
 };
 reader.readAsDataURL(file);
 }
 };

 const handleSubmit = async (e) => {
 e.preventDefault();
 setLoading(true);

 const data = new FormData();
 Object.keys(formData).forEach(key => {
 if (formData[key] !== null) {
 if (key === 'company_logo' && !(formData[key] instanceof File)) {
 return;
 }
 data.append(key, formData[key]);
 }
 });

 try {
 await apiClient.put(`/operation/contracts/${id}/`, data, {
 headers: { 'Content-Type': 'multipart/form-data' }
 });
 toast.success("Contract updated successfully");
 navigate('/operations/contracts');
 } catch (err) {
 console.error('Error updating contract:', err);
 toast.error('Failed to update contract. Please check all required fields.');
 } finally {
 setLoading(false);
 }
 };

 return (
 <div className="p-6">
 <LayoutComponents
 title="Edit Contract"
 subtitle={`Refine agreement for: ${formData.subject}`}
 variant="card"
 >
 <form onSubmit={handleSubmit} className="space-y-10">
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
 {/* Essential Info Section */}
 <div className="space-y-8">
 <h3 className="text-xl font-bold text-black font-syne border-b border-gray-100 pb-4">Essential Details</h3>

 <Input
 label="Subject"
 name="subject"
 required
 value={formData.subject}
 onChange={handleChange}
 placeholder="e.g., Annual Maintenance Contract 2024"
 />

 <Input
 label="Client"
 type="select"
 required
 value={formData.client_id}
 onChange={(val) => setFormData(prev => ({ ...prev, client_id: val }))}
 options={[
 { value: '', label: 'Select Client' },
 ...clients.map(c => ({ value: c.id, label: c.name }))
 ]}
 />

 <div className="flex flex-col md:flex-row gap-6 items-start">
 <div className="flex-1 w-full">
 <Input
 label="Amount (INR)"
 type="number"
 name="amount"
 disabled={formData.no_value}
 value={formData.amount}
 onChange={handleChange}
 placeholder="0.00"
 />
 </div>
 <div className="pt-10 flex items-center gap-2">
 <input
 type="checkbox"
 id="no_value"
 name="no_value"
 checked={formData.no_value}
 onChange={handleChange}
 className="w-5 h-5 rounded-lg border-gray-300 text-black focus:ring-black"
 />
 <label htmlFor="no_value" className="text-sm font-bold text-gray-600">No Fixed Value</label>
 </div>
 </div>

 <div className="relative">
 <label className="block text-sm font-bold text-black mb-2">Contract Type</label>
 <div className="flex gap-2">
 <div className="flex-1">
 <Input
 type="select"
 value={formData.contract_type_id}
 onChange={(val) => setFormData(prev => ({ ...prev, contract_type_id: val }))}
 options={[
 { value: '', label: 'Select Type' },
 ...contractTypes.map(t => ({ value: t.id, label: t.name }))
 ]}
 />
 </div>
 <button
 type="button"
 onClick={() => setIsModalOpen(true)}
 className="p-3 bg-gray-50 text-black rounded-xl hover:bg-gray-100 transition-all border border-gray-100"
 title="Manage Types"
 >
 <MdAdd size={24} />
 </button>
 </div>
 </div>
 </div>

 {/* Timeline & Logo Section */}
 <div className="space-y-8">
 <h3 className="text-xl font-bold text-black font-syne border-b border-gray-100 pb-4">Timeline & Identity</h3>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <Input
 label="Start Date"
 type="date"
 name="start_date"
 required
 value={formData.start_date}
 onChange={handleChange}
 />
 <div className="space-y-2">
 <Input
 label="End Date"
 type="date"
 name="end_date"
 disabled={formData.no_end_date}
 value={formData.end_date}
 onChange={handleChange}
 />
 <div className="flex items-center gap-2">
 <input
 type="checkbox"
 id="no_end_date"
 name="no_end_date"
 checked={formData.no_end_date}
 onChange={handleChange}
 className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
 />
 <label htmlFor="no_end_date" className="text-xs font-bold text-gray-500 uppercase tracking-wider">No End Date</label>
 </div>
 </div>
 </div>

 <Input
 label="Contract Reference Name"
 name="contract_name"
 value={formData.contract_name}
 onChange={handleChange}
 placeholder="Internal reference name"
 />

 <div className="space-y-4">
 <label className="block text-sm font-bold text-black">Company Logo / Banner</label>
 <div className="flex items-center gap-6">
 <div className="w-40 h-40 rounded-3xl border-2 border-dashed border-gray-100 bg-gray-50/50 flex items-center justify-center overflow-hidden relative group transition-all hover:bg-gray-100/50 hover:border-black/10">
 {logoPreview ? (
 <img src={logoPreview} alt="Preview" className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-110" />
 ) : (
 <MdImage size={48} className="text-gray-200" />
 )}
 <label className="absolute inset-0 cursor-pointer flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
 <MdCloudUpload className="text-white" size={32} />
 <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
 </label>
 </div>
 <div className="space-y-2">
 <p className="text-sm font-bold text-black">Update Contract Visual</p>
 <p className="text-xs text-gray-400 leading-relaxed max-w-[200px]">PNG or JPG preferred. Max size: 2MB.</p>
 {logoPreview && (
 <button
 type="button"
 onClick={() => { setLogoPreview(null); setFormData(p => ({ ...p, company_logo: null })) }}
 className="text-xs font-bold text-red-500 hover:text-red-700 underline"
 >
 Remove Image
 </button>
 )}
 </div>
 </div>
 </div>
 </div>
 </div>

 {/* Additional Details */}
 <div className="space-y-8 bg-gray-50/50 p-8 rounded-4xl border border-gray-100">
 <h3 className="text-xl font-bold text-black font-syne pb-4">Additional Information</h3>

 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
 <div className="space-y-6">
 <Input
 label="Office Address"
 name="alternate_address"
 value={formData.alternate_address}
 onChange={handleChange}
 placeholder="Full office address"
 />
 <div className="grid grid-cols-2 gap-4">
 <Input label="City" name="city" value={formData.city} onChange={handleChange} />
 <Input label="State" name="state" value={formData.state} onChange={handleChange} />
 </div>
 <div className="grid grid-cols-2 gap-4">
 <Input label="Country" name="country" value={formData.country} onChange={handleChange} />
 <Input label="Postal Code" name="postal_code" value={formData.postal_code} onChange={handleChange} />
 </div>
 </div>

 <div className="space-y-6">
 <div className="grid grid-cols-2 gap-4">
 <Input label="Mobile / Cell" name="cell" value={formData.cell} onChange={handleChange} />
 <Input label="Office Phone" name="office_phone_number" value={formData.office_phone_number} onChange={handleChange} />
 </div>
 <div className="space-y-2">
 <label className="block text-sm font-bold text-black">Notes & Terms</label>
 <textarea
 name="notes"
 value={formData.notes}
 onChange={handleChange}
 rows="5"
   className="w-full px-5 py-3 text-sm bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all resize-none"

 placeholder="Specify specific terms, SLAs, or unique conditions..."
 />
 </div>
 </div>
 </div>
 </div>

 {/* Submission */}
   <div className="flex flex-col md:flex-row gap-4 pt-10">
  <button
  type="submit"
  disabled={loading}
  className="flex-1 md:flex-none flex items-center justify-center gap-3 bg-black text-white px-4 py-3 text-sm rounded-xl font-bold hover:bg-gray-100 hover:text-black transition-all shadow-xl shadow-black/10 disabled:opacity-50"
  >
  {loading ? <MdRefresh size={24} className="animate-spin" /> : <MdSave size={24} />}
  {loading ? 'Processing...' : 'Save Contract Changes'}
  </button>
  <button
  type="button"
  onClick={() => navigate('/operations/contracts')}
  className="flex-1 md:flex-none flex items-center justify-center gap-3 bg-white border border-gray-200 text-black px-4 py-3 text-sm rounded-xl font-bold hover:bg-gray-100 transition-all"
  >
  Cancel
  </button>
  </div>

 </form>
 </LayoutComponents>

 {/* Sub-modal for Contract Types */}
 <AnimatePresence>
 {isModalOpen && (
 <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="absolute inset-0 bg-black/20 backdrop-blur-md"
 onClick={() => setIsModalOpen(false)}
 />
 <motion.div
 initial={{ scale: 0.9, opacity: 0, y: 20 }}
 animate={{ scale: 1, opacity: 1, y: 0 }}
 exit={{ scale: 0.9, opacity: 0, y: 20 }}
 className="relative bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
 >
 <div className="p-8 border-b border-gray-50 flex items-center justify-between">
 <h3 className="text-2xl font-bold text-black font-syne">Contract Types</h3>
 <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-gray-100 rounded-xl transition-colors">
 <MdClose size={24} />
 </button>
 </div>

 <div className="p-8 flex-1 overflow-y-auto">
 <div className="space-y-4 mb-8">
 <Input
 label="New Contract Type"
 value={newTypeName}
 onChange={(e) => setNewTypeName(e.target.value)}
 placeholder="e.g., Software Licensing"
 />
 <button
 onClick={handleSaveType}
 disabled={isSavingType || !newTypeName.trim()}
 className="w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-gray-900 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
 >
 <MdAdd size={20} /> {isSavingType ? 'Saving...' : 'Add Type Category'}
 </button>
 </div>

 <div className="space-y-2">
 <p className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-2 mb-4">Existing Categories</p>
 <div className="grid grid-cols-1 gap-2">
 {contractTypes.map((type) => (
 <div key={type.id} className="group flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
 <span className="font-bold text-gray-800">{type.name}</span>
 <button
 onClick={() => handleDeleteType(type.id)}
 className="p-2 opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-50 rounded-xl transition-all"
 >
 <MdDelete size={20} />
 </button>
 </div>
 ))}
 </div>
 </div>
 </div>
 </motion.div>
 </div>
 )}
 </AnimatePresence>
 </div>
 );
};

export default ContractEdit;
