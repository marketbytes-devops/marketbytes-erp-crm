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

                // Handle paginated responses
                setClients(clientsRes.data.results || (Array.isArray(clientsRes.data) ? clientsRes.data : []));
                await fetchContractTypes();

                // Fetch Contract Details
                const contractRes = await apiClient.get(`/operation/contracts/${id}/`);
                const contract = contractRes.data;

                setFormData({
                    subject: contract.subject || '',
                    client_id: contract.client || '', // Assuming Django REST Framework returns ID as 'client' or 'client_id'
                    amount: contract.amount || '',
                    no_value: contract.no_value || false,
                    contract_type_id: contract.contract_type || '', // Assuming ID
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
                    company_logo: null // Don't pre-fill file input
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

        // Using FormData for file upload
        const data = new FormData();
        Object.keys(formData).forEach(key => {
            if (formData[key] !== null) {
                // For files, only append if it's a File object (new upload)
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

    const inputClass = "w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-gray-50/50";
    const labelClass = "block text-sm font-semibold text-gray-700 mb-1.5";

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => navigate('/operations/contracts')}
                        className="p-2 hover:bg-white rounded-full transition-colors text-gray-600 shadow-sm"
                    >
                        <MdArrowBack size={24} />
                    </button>
                    <h1 className="text-2xl font-bold text-gray-800">Edit Contract</h1>
                </div>

                <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-gray-50 px-8 py-4 border-b border-gray-100">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">Edit Contract Details</h2>
                    </div>

                    <div className="p-8 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Clients Selection */}
                            <div>
                                <label className={labelClass}>Client <span className="text-red-500">*</span></label>
                                <div className="flex gap-2">
                                    <select name="title" className="w-24 p-3 border border-gray-200 rounded-xl outline-none bg-gray-50/50">
                                        <option>Mr.</option>
                                        <option>Ms.</option>
                                        <option>Mrs.</option>
                                    </select>
                                    <select
                                        name="client_id"
                                        required
                                        value={formData.client_id}
                                        onChange={handleChange}
                                        className="flex-1 p-3 border border-gray-200 rounded-xl outline-none bg-gray-50/50"
                                    >
                                        <option value="">Select Client</option>
                                        {clients.map(client => (
                                            <option key={client.id} value={client.id}>{client.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Subject */}
                            <div>
                                <label className={labelClass}>Subject <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    name="subject"
                                    required
                                    value={formData.subject}
                                    onChange={handleChange}
                                    className={inputClass}
                                    placeholder="Contract subject"
                                />
                            </div>

                            {/* Amount */}
                            <div className="flex items-end gap-6">
                                <div className="flex-1">
                                    <label className={labelClass}>Amount (INR) <span className="text-red-500">*</span></label>
                                    <input
                                        type="number"
                                        name="amount"
                                        value={formData.amount}
                                        onChange={handleChange}
                                        disabled={formData.no_value}
                                        className={`${inputClass} ${formData.no_value ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        placeholder="0.00"
                                    />
                                </div>
                                <div className="flex items-center gap-2 mb-3">
                                    <input
                                        type="checkbox"
                                        name="no_value"
                                        checked={formData.no_value}
                                        onChange={handleChange}
                                        className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                    />
                                    <span className="text-sm font-medium text-gray-600">No Value</span>
                                </div>
                            </div>

                            {/* Contract Type Searchable Dropdown */}
                            <div>
                                <label className={labelClass}>Contract Type</label>
                                <div className="relative">
                                    <div
                                        className={`${inputClass} cursor-pointer flex justify-between items-center bg-white`}
                                        onClick={() => setIsTypesDropdownOpen(!isTypesDropdownOpen)}
                                    >
                                        <span className={formData.contract_type_id ? 'text-gray-900' : 'text-gray-400'}>
                                            {formData.contract_type_id
                                                ? contractTypes.find(t => t.id == formData.contract_type_id)?.name
                                                : 'Select Category'}
                                        </span>
                                        <MdKeyboardArrowDown className={`transition-transform ${isTypesDropdownOpen ? 'rotate-180' : ''}`} size={20} />
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(true)}
                                        className="absolute right-10 top-1/2 -translate-y-1/2 text-emerald-500 hover:text-emerald-600 font-bold flex items-center gap-1 bg-white px-2 py-1 rounded shadow-sm text-xs z-10"
                                    >
                                        <MdAdd /> Add Contract Type
                                    </button>

                                    <AnimatePresence>
                                        {isTypesDropdownOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden"
                                            >
                                                <div className="p-3 border-b border-gray-50 flex items-center gap-2">
                                                    <MdSearch className="text-gray-400" size={18} />
                                                    <input
                                                        type="text"
                                                        placeholder="Search types..."
                                                        className="w-full text-sm outline-none"
                                                        value={searchTerm}
                                                        onChange={(e) => setSearchTerm(e.target.value)}
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                </div>
                                                <div className="max-h-60 overflow-y-auto">
                                                    {contractTypes.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase())).map(type => (
                                                        <div
                                                            key={type.id}
                                                            onClick={() => {
                                                                setFormData(prev => ({ ...prev, contract_type_id: type.id }));
                                                                setIsTypesDropdownOpen(false);
                                                                setSearchTerm('');
                                                            }}
                                                            className={`px-4 py-3 text-sm cursor-pointer hover:bg-emerald-50 transition-colors ${formData.contract_type_id == type.id ? 'bg-emerald-50 text-emerald-600 font-semibold' : 'text-gray-700'}`}
                                                        >
                                                            {type.name}
                                                        </div>
                                                    ))}
                                                    {contractTypes.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
                                                        <div className="px-4 py-3 text-sm text-gray-400 text-center">No types found</div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            {/* Start Date */}
                            <div>
                                <label className={labelClass}>Start Date <span className="text-red-500">*</span></label>
                                <input
                                    type="date"
                                    name="start_date"
                                    required
                                    value={formData.start_date}
                                    onChange={handleChange}
                                    className={inputClass}
                                />
                            </div>

                            {/* End Date */}
                            <div className="flex items-end gap-6">
                                <div className="flex-1">
                                    <label className={labelClass}>End Date</label>
                                    <input
                                        type="date"
                                        name="end_date"
                                        value={formData.end_date}
                                        onChange={handleChange}
                                        disabled={formData.no_end_date}
                                        className={`${inputClass} ${formData.no_end_date ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    />
                                </div>
                                <div className="flex items-center gap-2 mb-3">
                                    <input
                                        type="checkbox"
                                        name="no_end_date"
                                        checked={formData.no_end_date}
                                        onChange={handleChange}
                                        className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                    />
                                    <span className="text-sm font-medium text-gray-600">No End Date</span>
                                </div>
                            </div>

                            {/* Contract Name */}
                            <div>
                                <label className={labelClass}>Contract Name</label>
                                <input
                                    type="text"
                                    name="contract_name"
                                    value={formData.contract_name}
                                    onChange={handleChange}
                                    className={inputClass}
                                />
                            </div>

                            {/* Alternate Address */}
                            <div>
                                <label className={labelClass}>Alternate Address</label>
                                <textarea
                                    name="alternate_address"
                                    rows="1"
                                    value={formData.alternate_address}
                                    onChange={handleChange}
                                    className={inputClass}
                                />
                            </div>

                            {/* Address Details */}
                            <div className="grid grid-cols-2 gap-4 col-span-1">
                                <div>
                                    <label className={labelClass}>City</label>
                                    <input type="text" name="city" value={formData.city} onChange={handleChange} className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>State</label>
                                    <input type="text" name="state" value={formData.state} onChange={handleChange} className={inputClass} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 col-span-1">
                                <div>
                                    <label className={labelClass}>Country</label>
                                    <input type="text" name="country" value={formData.country} onChange={handleChange} className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Postal code</label>
                                    <input type="text" name="postal_code" value={formData.postal_code} onChange={handleChange} className={inputClass} />
                                </div>
                            </div>

                            {/* Contact Info */}
                            <div>
                                <label className={labelClass}>Cell</label>
                                <input type="text" name="cell" value={formData.cell} onChange={handleChange} className={inputClass} />
                            </div>

                            <div>
                                <label className={labelClass}>Office Phone Number</label>
                                <input type="text" name="office_phone_number" value={formData.office_phone_number} onChange={handleChange} className={inputClass} />
                            </div>
                        </div>

                        {/* Notes */}
                        <div>
                            <label className={labelClass}>Notes</label>
                            <textarea
                                name="notes"
                                rows="4"
                                value={formData.notes}
                                onChange={handleChange}
                                className={inputClass}
                                placeholder="Enter contract notes or description..."
                            />
                        </div>

                        {/* Logo Upload */}
                        <div>
                            <label className={labelClass}>Company Logo</label>
                            <div className="flex items-start gap-8">
                                <div className="w-64 h-40 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center bg-gray-50/50 hover:bg-gray-100 transition-colors relative overflow-hidden group">
                                    {logoPreview ? (
                                        <img src={logoPreview} alt="Preview" className="w-full h-full object-contain p-4" />
                                    ) : (
                                        <>
                                            <MdImage size={40} className="text-gray-300 mb-2" />
                                            <span className="text-xs text-gray-500">Image Preview</span>
                                        </>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <MdCloudUpload className="text-white" size={32} />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-4">
                                    <p className="text-xs text-gray-400 mt-2 max-w-xs">
                                        Upload your company logo. Supported formats: JPG, PNG. Max size: 2MB.
                                    </p>
                                    <label className="bg-blue-500 text-white px-6 py-2.5 rounded-xl font-semibold text-sm cursor-pointer hover:bg-blue-600 transition-colors shadow-sm flex items-center gap-2 w-fit">
                                        <MdCloudUpload /> Select Image
                                        <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex gap-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 bg-emerald-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-600 transition-all shadow-md disabled:opacity-50"
                        >
                            {loading ? <><MdRefresh className="animate-spin" /> Saving...</> : <><MdSave /> Save Changes</>}
                        </button>
                    </div>
                </form>

                {/* Contract Type Management Modal */}
                <AnimatePresence>
                    {isModalOpen && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                                onClick={() => setIsModalOpen(false)}
                            />
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                            >
                                <div className="bg-blue-500 p-6 flex items-center justify-between text-white">
                                    <h3 className="text-xl font-bold">Contract Type</h3>
                                    <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                                        <MdClose size={24} />
                                    </button>
                                </div>

                                <div className="p-8 flex-1 overflow-y-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="text-gray-400 text-xs font-bold uppercase tracking-widest border-b border-gray-100">
                                                <th className="pb-4 pl-2">#</th>
                                                <th className="pb-4">Name</th>
                                                <th className="pb-4 text-center">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {contractTypes.map((type, index) => (
                                                <tr key={type.id} className="group hover:bg-gray-50/50 transition-colors">
                                                    <td className="py-4 pl-2 text-gray-400 text-sm font-medium">{index + 1}</td>
                                                    <td className="py-4 text-gray-700 font-medium">{type.name}</td>
                                                    <td className="py-4 text-center">
                                                        <button
                                                            onClick={() => handleDeleteType(type.id)}
                                                            className="px-4 py-1.5 border border-red-200 text-red-500 rounded-lg text-xs font-bold hover:bg-red-50 transition-colors uppercase"
                                                        >
                                                            Remove
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="p-8 bg-gray-50 border-t border-gray-100">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Name <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        className="w-full p-4 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white shadow-inner mb-6"
                                        value={newTypeName}
                                        onChange={(e) => setNewTypeName(e.target.value)}
                                        placeholder="Enter contract type name"
                                    />
                                    <button
                                        onClick={handleSaveType}
                                        disabled={isSavingType || !newTypeName.trim()}
                                        className="bg-emerald-500 text-white px-8 py-3 rounded-2xl font-bold hover:bg-emerald-600 transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
                                    >
                                        <MdSave /> {isSavingType ? 'Saving...' : 'Save'}
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default ContractEdit;
