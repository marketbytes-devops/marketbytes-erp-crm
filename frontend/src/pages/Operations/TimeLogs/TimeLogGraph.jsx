import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

/**
 * TimeLogGraph Component
 * * Renders a bar chart of employee time logs.
 * @param {Array} data - Array of timelog entries (daily summary or detailed logs).
 */
const TimeLogGraph = ({ data }) => {
 const chartData = useMemo(() => {
 const aggregation = {};
 data.forEach(entry => {
 // Use employee name, email, or a fallback label
 const name = entry.employee?.name || entry.employee?.email || 'Unknown';
 if (!aggregation[name]) {
 aggregation[name] = { name, productive: 0, total: 0 };
 }
 // Accumulate hours
 aggregation[name].productive += parseFloat(entry.productive_hours || 0);
 aggregation[name].total += parseFloat(entry.total_hours || 0);
 });

 // Format for Recharts
 return Object.values(aggregation).map(item => ({
 ...item,
 // Round to 2 decimal places for better display
 productive: parseFloat(item.productive.toFixed(2)),
 total: parseFloat(item.total.toFixed(2)),
 })).sort((a, b) => b.total - a.total); // Sort by total hours descending
 }, [data]);

 // Custom tooltips for better appearance
 const CustomTooltip = ({ active, payload, label }) => {
 if (active && payload && payload.length) {
 return (
 <div className="bg-white p-4 border border-gray-100 shadow-xl rounded-xl">
 <p className="font-bold text-gray-900 mb-2">{label}</p>
 {payload.map((entry, index) => (
 <div key={index} className="flex items-center gap-2 mb-1">
 <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
 <p className="text-sm font-medium text-gray-700">
 {entry.name}: <span className="text-black font-bold">{entry.value}h</span>
 </p>
 </div>
 ))}
 <div className="mt-2 pt-2 border-t border-gray-50 flex flex-col gap-1">
 <p className="text-xs text-gray-400">Efficiency: <span className="text-blue-600 font-bold">
 {payload[1].value > 0 ? ((payload[0].value / payload[1].value) * 100).toFixed(1)
 : 0}%
 </span></p>
 </div>
 </div>
 );
 }
 return null;
 };

 if (chartData.length === 0) {
 return (
 <div className="bg-white rounded-xl shadow-sm p-12 border border-gray-200 flex flex-col items-center justify-center min-h-[400px]">
 <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
 <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2-2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
 </svg>
 </div>
 <p className="text-gray-500 font-medium ">No data available for the current selection</p>
 </div>
 );
 }

 return (
 <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-200" style={{ height: '600px' }}>
 <div className="flex items-center justify-between mb-8">
 <div>
 <h3 className="text-xl font-bold text-gray-900">Employee Time Distribution</h3>
 <p className="text-sm text-gray-500 mt-1">Total productive vs clocked-in hours</p>
 </div>
 <div className="flex gap-4">
 <div className="flex items-center gap-2">
 <div className="w-3 h-3 rounded-full bg-blue-600" />
 <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Productive</span>
 </div>
 <div className="flex items-center gap-2">
 <div className="w-3 h-3 rounded-full bg-gray-300" />
 <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Total</span>
 </div>
 </div>
 </div>
 <ResponsiveContainer width="100%" height="90%">
 <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 60 }}
 barGap={6}
 >
 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }}
 angle={-25} textAnchor="end"
 interval={0}
 />
 <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }}
 label={{ value: 'Hours Spent', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#9ca3af', fontSize: 12, fontWeight: 500 } }} />
 <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f9fafb' }} />
 <Bar dataKey="productive" name="Productive Hours" fill="#2563eb" radius={[6, 6, 0, 0]} barSize={24} />
 <Bar dataKey="total" name="Total Hours" fill="#d1d5db" radius={[6, 6, 0, 0]} barSize={24} />
 </BarChart>
 </ResponsiveContainer>
 </div>
 );
};

export default TimeLogGraph;
