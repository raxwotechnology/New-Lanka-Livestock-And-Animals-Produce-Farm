import { Package, Lock, ShieldAlert } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';

export default function EmptyState({
    icon: Icon = Package,
    title = 'No data',
    description,
    action,
    allowManagerView = false
}) {
    const { user } = useAuthStore();
    const navigate = useNavigate();

    if (user?.role === 'manager' && !allowManagerView) {
        return (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-gray-50 rounded-lg border border-gray-200">
                <div className="bg-gray-200 p-3 rounded-full mb-3">
                    <Lock className="w-6 h-6 text-gray-500" />
                </div>
                <h3 className="text-sm font-medium text-gray-900 mb-1">History Restricted</h3>
                <p className="text-xs text-gray-500 max-w-sm mb-4">
                    As a data entry user, you cannot view previous records in this area. You can only view the item you just added, or items approved by Admin.
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
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Icon size={28} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            {description && <p className="text-sm text-gray-500 mt-1 max-w-md">{description}</p>}
            {action && <div className="mt-6">{action}</div>}
        </div>
    );
}