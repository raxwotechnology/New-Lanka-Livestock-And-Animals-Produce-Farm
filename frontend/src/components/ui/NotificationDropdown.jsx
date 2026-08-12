import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, ExternalLink, CheckCheck } from 'lucide-react';
import api from '../../api/axios';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';

const NotificationDropdown = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    const { user } = useAuthStore();
    const { theme } = useThemeStore();
    const isDark = theme === 'dark';

    const fetchNotifications = async () => {
        try {
            const { data } = await api.get('/notifications');
            let list = data || [];

            // Filter admin-specific notifications for non-admins
            if (user?.role === 'manager') {
                list = list.filter(n => 
                    n.link !== '/edit-approvals' && 
                    n.type !== 'approval' && 
                    !n.title?.toLowerCase().includes('new edit request')
                );
            }

            setNotifications(list);
            const unread = list.filter(n => !n.isRead);
            setUnreadCount(unread.length);
            
            // Auto-unlock records if they have an approval notification
            const authStore = useAuthStore.getState();
            list.forEach(n => {
                if (n.title === 'Edit Access Approved' && n.metadata?.referenceString) {
                    authStore.addApprovedEditRecord(n.metadata.referenceString, new Date(n.createdAt).getTime());
                }
            });
        } catch (error) {
            console.error('Failed to fetch notifications');
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const markAsRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark as read');
        }
    };

    const markAllRead = async () => {
        try {
            await api.put('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all read');
        }
    };

    const handleNotificationClick = async (n) => {
        if (!n.isRead) {
            markAsRead(n._id);
        }
        setIsOpen(false);
        if (n.link) {
            navigate(n.link);
        }
    };

    const getTypeBadgeStyle = (type = '') => {
        const t = type.toLowerCase();
        if (t.includes('fail') || t.includes('low') || t.includes('error') || t.includes('reject')) {
            return 'bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400 border border-red-200 dark:border-red-800/50';
        }
        if (t.includes('approve') || t.includes('success') || t.includes('complete')) {
            return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50';
        }
        if (t.includes('warn') || t.includes('pending')) {
            return 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50';
        }
        return 'bg-primary-50 text-primary-600 dark:bg-primary-950/50 dark:text-primary-400 border border-primary-200 dark:border-primary-800/50';
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200 transition-colors relative rounded-lg focus:outline-none"
                aria-label="Notifications"
                title="Notifications"
            >
                <Bell size={19} className="transition-transform active:scale-90" />
                {unreadCount > 0 && (
                    <>
                        <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping opacity-75" />
                        <span className="absolute -top-1 -right-1 px-1.5 py-0.2 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-medium flex items-center justify-center rounded-full border-2 border-white dark:border-gray-800 shadow-sm">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    </>
                )}
            </button>

            {isOpen && (
                <div 
                    className="absolute right-0 mt-2.5 w-80 sm:w-96 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden transition-all transform origin-top-right"
                    style={{
                        backgroundColor: isDark ? '#0f172a' : '#ffffff',
                        opacity: 1,
                        zIndex: 99999,
                        boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.3)'
                    }}
                >
                    {/* Header */}
                    <div 
                        className="px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center"
                        style={{ backgroundColor: isDark ? '#1e293b' : '#f8fafc' }}
                    >
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">Notifications</h3>
                            {unreadCount > 0 && (
                                <span className="px-2 py-0.5 text-[11px] font-medium bg-primary-100 text-primary-700 dark:bg-primary-900/60 dark:text-primary-300 rounded-full">
                                    {unreadCount} new
                                </span>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllRead}
                                className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium flex items-center gap-1 transition-colors"
                            >
                                <CheckCheck size={14} />
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* Notification List with solid background */}
                    <div 
                        className="max-h-[380px] overflow-y-auto no-scrollbar divide-y divide-slate-100 dark:divide-slate-800"
                        style={{ backgroundColor: isDark ? '#0f172a' : '#ffffff' }}
                    >
                        {notifications.length === 0 ? (
                            <div 
                                className="py-12 px-4 text-center"
                                style={{ backgroundColor: isDark ? '#0f172a' : '#ffffff' }}
                            >
                                <Bell className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2 opacity-50" />
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-normal">No notifications yet</p>
                            </div>
                        ) : (
                            notifications.map((n) => (
                                <div
                                    key={n._id}
                                    onClick={() => handleNotificationClick(n)}
                                    className={`p-4 transition-colors cursor-pointer relative ${
                                        !n.isRead ? 'border-l-4 border-l-primary-500' : ''
                                    }`}
                                    style={{
                                        backgroundColor: !n.isRead 
                                            ? (isDark ? '#1e293b' : '#eff6ff') 
                                            : (isDark ? '#0f172a' : '#ffffff'),
                                        opacity: 1
                                    }}
                                >
                                    <div className="flex justify-between items-center mb-1.5">
                                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md uppercase tracking-wider ${getTypeBadgeStyle(n.type)}`}>
                                            {n.type.replace('notification:', '').replace('_', ' ')}
                                        </span>
                                        <span className="text-[10px] text-gray-400 dark:text-gray-500">
                                            {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                                        </span>
                                    </div>
                                    <h4 className={`text-xs text-gray-900 dark:text-gray-100 mb-1 ${!n.isRead ? 'font-medium' : 'font-normal'}`}>
                                        {n.title}
                                    </h4>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 font-normal leading-relaxed mb-2">
                                        {n.message}
                                    </p>
                                    <div className="flex justify-between items-center pt-1">
                                        {n.link ? (
                                            <span className="text-xs text-primary-600 dark:text-primary-400 flex items-center gap-1 hover:underline font-medium">
                                                View details <ExternalLink size={11} />
                                            </span>
                                        ) : <div />}
                                        {!n.isRead && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    markAsRead(n._id);
                                                }}
                                                className="text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 p-1 rounded-md hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                                                title="Mark as read"
                                            >
                                                <Check size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;
