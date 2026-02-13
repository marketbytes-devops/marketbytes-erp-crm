import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
    MdAdd,
    MdSearch,
    MdFilterList,
    MdFileDownload,
    MdMoreVert,
    MdDescription,
    MdCalendarToday,
    MdHistory,
    MdWarning,
    MdKeyboardArrowDown
} from 'react-icons/md';
import { motion, AnimatePresence } from 'framer-motion';
import apiClient from '../../../helpers/apiClient';
import { usePermission } from '../../../context/PermissionContext';

const ContractsList = () => {
    const navigate = useNavigate();
    const { hasPermission } = usePermission();
    const [contracts, setContracts] = useState([]);
    const [stats, setStats] = useState({
        total_contracts: 0,
        about_to_expire: 0,
        expired: 0
    });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(true);
    const [isExportOpen, setIsExportOpen] = useState(false);
const [clients, setClients] = useState([]);

    const [pagination, setPagination] = useState({
        count: 0,
        next: null,
        previous: null
    });

    useEffect(() => {
        fetchContracts();
        fetchStats();
         fetchClients();  
    }, []);
const fetchClients = async () => {
    try {
        const response = await apiClient.get('/operation/clients/');
        setClients(
            response.data.results || 
            (Array.isArray(response.data) ? response.data : [])
        );
    } catch (error) {
        console.error('Error fetching clients:', error);
        setClients([]);
    }
};

    const fetchContracts = async (url = '/operation/contracts/') => {
        try {
            setLoading(true);
            const response = await apiClient.get(url);
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

        // Since these are GET requests that return files, we can use window.open 
        // but we might need to handle auth if the backend doesn't allow session cookies.
        // However, usually for these simple exports, we can just trigger a download.
        // If JWT is needed in headers, we'd need a different approach (fetch + blob).

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

    const statusCards = [
        { label: 'Total Contracts', value: stats.total_contracts, icon: <MdDescription className="text-gray-600" />, color: 'bg-gray-100', dot: 'bg-gray-600' },
        { label: 'About To Expire', value: stats.about_to_expire, icon: <MdCalendarToday className="text-orange-500" />, color: 'bg-orange-50', dot: 'bg-yellow-500' },
        { label: 'Expired', value: stats.expired, icon: <MdHistory className="text-red-500" />, color: 'bg-red-50', dot: 'bg-red-500' },
    ];

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold flex items-center gap-2">
                    <MdDescription className="text-gray-700" />
                    Contracts
                </h1>
                <div className="flex gap-3">
                    {hasPermission("contracts", "add") && (
                        <button
                            onClick={() => navigate('/operations/contracts/create')}
                            className="flex items-center gap-2 px-4 py-2 border-2 border-emerald-500 text-emerald-500 rounded-lg hover:bg-emerald-50 font-medium transition-colors"
                        >
                            Create Contract <MdAdd size={20} />
                        </button>
                    )}
                    <div className="relative">
                        <button
                            onClick={() => setIsExportOpen(!isExportOpen)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium transition-colors shadow-sm"
                        >
                            <MdFileDownload size={20} /> Export <MdKeyboardArrowDown className={`transition-transform ${isExportOpen ? 'rotate-180' : ''}`} />
                        </button>

                        <AnimatePresence>
                            {isExportOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden"
                                >
                                    <button
                                        onClick={() => handleExport('csv')}
                                        className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                                    >
                                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                        Export as CSV
                                    </button>
                                    <button
                                        onClick={() => handleExport('excel')}
                                        className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                                    >
                                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                        Export as Excel
                                    </button>
                                    <button
                                        onClick={() => handleExport('pdf')}
                                        className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                                    >
                                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                        Export as PDF
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {statusCards.map((card, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition-all hover:shadow-md flex items-center gap-4">
                        <div className={`p-3 rounded-full ${card.color}`}>
                            {card.icon}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <span className={`w-3 h-3 rounded-full ${card.dot}`}></span>
                                <p className="text-gray-500 text-sm font-medium">{card.label}</p>
                            </div>
                            <p className="text-3xl font-bold text-gray-800">{card.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex gap-6">
                {showFilters && (
                    <div className="w-64 flex-shrink-0 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit sticky top-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                <MdFilterList /> Filter Results
                            </h3>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-2">Select Date Range</label>
                                <div className="grid grid-cols-1 gap-2">
                                    <input type="date" className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-gray-50" />
                                    <div className="bg-blue-500 text-white text-center py-1 rounded">To</div>
                                    <input type="date" className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-gray-50" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-2">Client</label>
                              <select className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-gray-50">
    <option value="">Select Client</option>
    {clients.map(client => (
        <option key={client.id} value={client.id}>
            {client.name}
        </option>
    ))}
</select>

                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-2">Contract Type</label>
                                <select className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-gray-50">
                                    <option>Select Type</option>
                                </select>
                            </div>

                            <div className="flex gap-2 pt-4">
                                <button className="flex-1 bg-emerald-500 text-white py-2 rounded-lg font-medium hover:bg-emerald-600 transition-colors">Apply</button>
                                <button className="flex-1 bg-gray-800 text-white py-2 rounded-lg font-medium hover:bg-gray-900 transition-colors">Reset</button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">Show</span>
                            <select className="border border-gray-200 rounded-lg p-1 text-sm outline-none">
                                <option>10</option>
                                <option>25</option>
                                <option>50</option>
                            </select>
                            <span className="text-sm text-gray-500">entries</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700">Search:</span>
                            <div className="relative">
                                <input
                                    type="text"
                                    className="border border-gray-200 rounded-xl px-4 py-2 text-sm pl-10 w-64 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                    placeholder="Search contracts..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                                    <th className="px-6 py-4">#</th>
                                    <th className="px-6 py-4">Subject</th>
                                    <th className="px-6 py-4">Client</th>
                                    <th className="px-6 py-4">Amount</th>
                                    <th className="px-6 py-4">Start Date</th>
                                    <th className="px-6 py-4">End Date</th>
                                    <th className="px-6 py-4 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-sm">
                                {loading ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-12 text-center text-gray-400">Loading contracts...</td>
                                    </tr>
                                ) : contracts.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-12 text-center text-gray-400">
                                            <div className="flex flex-col items-center gap-2">
                                                <MdWarning size={48} className="text-gray-200" />
                                                <p>No data available in table</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    contracts.map((contract, index) => (
                                        <tr key={contract.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 text-gray-400 font-medium">{index + 1}</td>
                                            <td className="px-6 py-4 font-semibold text-gray-800">{contract.subject}</td>
                                            <td className="px-6 py-4 text-emerald-600 font-medium">{contract.client_name}</td>
                                            <td className="px-6 py-4 text-gray-700">{contract.no_value ? 'No Value' : contract.amount}</td>
                                            <td className="px-6 py-4 text-gray-600">{contract.start_date}</td>
                                            <td className="px-6 py-4 text-gray-600">{contract.no_end_date ? 'No End Date' : contract.end_date}</td>
                                            <td className="px-6 py-4 text-center">
                                                <button className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600">
                                                    <MdMoreVert size={20} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-6 border-t border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <p className="text-sm text-gray-500">
                            Showing {contracts.length} of {pagination.count} entries
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => pagination.previous && fetchContracts(pagination.previous)}
                                className={`px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium transition-colors ${!pagination.previous ? 'text-gray-400 cursor-not-allowed bg-gray-50' : 'text-gray-700 hover:bg-white hover:text-emerald-500'}`}
                                disabled={!pagination.previous}
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => pagination.next && fetchContracts(pagination.next)}
                                className={`px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium transition-colors ${!pagination.next ? 'text-gray-400 cursor-not-allowed bg-gray-50' : 'text-gray-700 hover:bg-white hover:text-emerald-500'}`}
                                disabled={!pagination.next}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContractsList;
