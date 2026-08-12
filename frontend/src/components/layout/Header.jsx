import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User as UserIcon, Menu, Sun, Moon, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../features/auth/authApi';
import NotificationDropdown from '../ui/NotificationDropdown';

export default function Header({ onToggleSidebar }) {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();
    const { theme, toggleTheme } = useThemeStore();
    const isDarkMode = theme === 'dark';

    const handleLogout = async () => {
        try {
            await authApi.logout();
        } catch (err) {
            // Even if backend fails, log out locally
        }
        logout();
        toast.success('Logged out successfully');
        navigate('/login');
    };

    const roleLabel = {
        admin: 'Administrator',
        manager: 'Manager',
        accountant: 'Accountant',
        sales_manager: 'Sales Manager',
        sales_rep: 'Sales Rep',
        warehouse_staff: 'Warehouse Staff',
        production_staff: 'Production Staff',
        staff: 'Staff',
    }[user?.role] || 'User';

    return (
        <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 flex-shrink-0 transition-colors">
            <div className="flex items-center gap-3">
                {/* Hamburger toggle */}
                <button
                    onClick={onToggleSidebar}
                    className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition"
                    aria-label="Toggle sidebar"
                    title="Toggle sidebar"
                >
                    <Menu size={20} />
                </button>
                <h1 className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-gray-100 truncate max-w-[120px] sm:max-w-none">
                    Welcome, {user?.firstName}
                </h1>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
                {/* Request Edit Access Button for Manager */}
                {user?.role === 'manager' && (
                    <button
                        onClick={() => navigate('/manager/request-edit')}
                        className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                        title="Request Edit Access for another record"
                    >
                        <ShieldAlert size={15} className="text-amber-600 dark:text-amber-400 flex-shrink-0" />
                        <span className="hidden sm:inline">Request Edit</span>
                    </button>
                )}

                {/* Theme Toggle Button */}
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition"
                    aria-label="Toggle theme"
                >
                    {isDarkMode ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} />}
                </button>

                <NotificationDropdown />

                <div className="flex items-center gap-2 px-2 py-1.5 sm:px-3 sm:py-1.5 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary-500 transition-all" onClick={() => navigate('/profile')}>
                        {user?.avatar ? (
                            <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <UserIcon className="w-4 h-4 text-primary-600 dark:text-primary-300" />
                        )}
                    </div>
                    <div className="text-sm hidden md:block">
                        <p className="font-medium text-gray-900 dark:text-gray-100 leading-tight">{user?.fullName}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">{roleLabel}</p>
                    </div>
                </div>

                <button
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                >
                    <LogOut size={16} />
                    <span className="hidden sm:inline">Logout</span>
                </button>
            </div>
        </header>
    );
}