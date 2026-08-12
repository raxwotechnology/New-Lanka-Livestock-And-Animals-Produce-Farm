import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore, isRecordApprovedForEdit, isRecordRecentlyCreated } from '../../store/authStore';
import { Lock, ShieldAlert } from 'lucide-react';

export default function Table({ columns, data, onRowClick, isDataEntryAllowed = false }) {
    const { user, createdRecords, approvedEditRecords } = useAuthStore();
    const location = useLocation();
    const navigate = useNavigate();

    // For managers, filter data to only show:
    // 1. The most recently added record for this path
    // 2. Records that have been explicitly approved by admin
    const filteredData = (user?.role === 'manager' && !isDataEntryAllowed) 
        ? data.filter(row => {
            const isRecentlyAdded = isRecordRecentlyCreated(row, createdRecords);


            const isApproved = isRecordApprovedForEdit(row, approvedEditRecords);

            return isRecentlyAdded || isApproved;
        })
        : data;

    if (user?.role === 'manager' && !isDataEntryAllowed && filteredData.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="bg-gray-200 dark:bg-gray-700 p-3 rounded-full mb-3">
                    <Lock className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">History Restricted</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mb-4">
                    As a data entry user, you cannot view previous records in this table. You can only view the item you just added, or items approved by Admin.
                </p>
                <button
                    onClick={() => navigate('/manager/request-edit')}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <ShieldAlert size={16} />
                    Request Edit Access
                </button>
            </div>
        );
    }
    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80">
                        {columns.map((col) => (
                            <th
                                key={col.key}
                                className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider"
                                style={{ width: col.width }}
                            >
                                {col.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredData.map((row, idx) => (
                        <tr
                            key={row._id || idx}
                            onClick={() => onRowClick?.(row)}
                            className={`${onRowClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50' : ''} transition`}
                        >
                            {columns.map((col) => (
                                <td key={col.key} className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                                    {col.render ? col.render(row) : row[col.key]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}