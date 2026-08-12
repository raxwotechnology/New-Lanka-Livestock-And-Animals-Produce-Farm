import { useNavigate } from 'react-router-dom';
import { Key } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export default function PageHeader({ title, description, actions, showRequestEdit = true }) {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const isManager = user?.role === 'manager';

    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{title}</h1>
                {description && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{description}</p>}
            </div>
            
            <div className="flex items-center flex-wrap gap-2.5">
                {isManager && showRequestEdit && title && title !== 'Request Edit Access' && (
                    <button
                        type="button"
                        onClick={() => navigate(`/manager/request-edit?module=${encodeURIComponent(title)}`)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-2xs active:scale-95"
                        title={`Request Admin edit approval for ${title}`}
                    >
                        <Key size={13} className="text-amber-600 dark:text-amber-400 flex-shrink-0" />
                        <span>Request Edit Access</span>
                    </button>
                )}
                {actions && <div className="flex items-center gap-2">{actions}</div>}
            </div>
        </div>
    );
}