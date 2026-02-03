import React from 'react';
import { Shield, ShieldAlert } from 'lucide-react';
import Toggle from './Toggle';

const PermissionMatrix = ({ permissions, onChange, pageNameMap, type = "direct" }) => {
  const actions = ['view', 'add', 'edit', 'delete'];

  const getHeaderStyle = () => {
    if (type === 'override') return 'bg-red-50 text-red-700 border-red-100';
    return 'bg-gray-50 text-gray-700 border-gray-100';
  };

  const getIcon = () => {
    if (type === 'override') return <ShieldAlert className="w-5 h-5 text-red-500" />;
    return <Shield className="w-5 h-5 text-blue-500" />;
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className={getHeaderStyle()}>
            <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              {getIcon()}
              Module
            </th>
            {actions.map(action => (
              <th key={action} className="px-4 py-4 text-sm font-bold uppercase tracking-wider text-center">
                {action}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {Object.keys(pageNameMap).map((pageKey) => (
            <tr key={pageKey} className="hover:bg-gray-50/50 transition-colors">
              <td className="px-6 py-4">
                <div className="flex flex-col">
                  <span className="font-bold text-gray-900">{pageNameMap[pageKey].displayName}</span>
                  <span className="text-[10px] text-gray-400 font-mono tracking-tight">{pageNameMap[pageKey].apiName}</span>
                </div>
              </td>
              {actions.map((action) => (
                <td key={action} className="px-4 py-4 text-center">
                  <div className="flex justify-center">
                    <Toggle
                      enabled={permissions[pageKey]?.[action] || false}
                      onChange={(val) => onChange(pageKey, action, val)}
                    />
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PermissionMatrix;
