import React from 'react';
import { PAGE_GROUPS } from '../helpers/permissionConstants';

const PermissionMatrix = ({ permissions, onChange, pageNameMap }) => {
 const actions = ['view', 'add', 'edit', 'delete'];

 return (
 <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
 <table className="w-full text-left border-collapse">
 <thead className="bg-[#fafbff]">
 <tr>
 <th className="px-5 py-2.5 text-sm text-xs font-medium text-gray-400 uppercase tracking-widest pl-8">Module / Page</th>
 {actions.map(action => (
 <th key={action} className="px-4 py-4 text-xs font-medium text-gray-400 uppercase tracking-widest text-center">{action}</th>
 ))}
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-50">
 {PAGE_GROUPS.map((group) => (
 <React.Fragment key={group.name}>
 <tr className="bg-gray-100/50 border-t border-gray-100">
 <td colSpan={5} className="px-5 py-2.5 text-sm text-[10px] font-black uppercase text-[#50728c] tracking-[0.2em]">
 {group.name} {!(group.name === 'Dashboard' || group.name === 'Profile') && 'MANAGEMENT'}
 </td>
 </tr>
 {group.pages.map((pageKey) => {
 const pageInfo = pageNameMap[pageKey];
 if (!pageInfo) return null;

 return (
 <tr key={pageKey} className="hover:bg-gray-50/50 group transition-colors">
 <td className="px-5 py-2.5 text-sm pl-8">
 <div className="flex flex-col">
 <span className="font-medium text-gray-900 leading-none mb-1">{pageInfo.displayName}</span>
 <span className="text-[10px] text-gray-400 font-mono tracking-tight">{pageInfo.route}</span>
 </div>
 </td>
 {actions.map((action) => (
 <td key={action} className="px-4 py-5 text-center">
 <div className="flex justify-center">
 <button
 type="button"
 onClick={() => onChange(pageKey, action, !permissions[pageKey]?.[action])}
 className={`${permissions[pageKey]?.[action] ? 'bg-[#50728c]' : 'bg-gray-300'
 } relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-0`}
 >
 <span
 aria-hidden="true"
 className={`${permissions[pageKey]?.[action] ? 'translate-x-5' : 'translate-x-0'
 } pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out`}
 />
 </button>
 </div>
 </td>
 ))}
 </tr>
 );
 })}
 </React.Fragment>
 ))}
 </tbody>
 </table>
 </div>
 );
};

export default PermissionMatrix;
