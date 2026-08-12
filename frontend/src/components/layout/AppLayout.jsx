import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import Sidebar from './Sidebar';
import Header from './Header';
import { useSocket } from '../../hooks/useSocket';

import { useSettings } from '../../features/settings/useSettings';

export default function AppLayout() {
    const { user, addApprovedEditRecord } = useAuthStore();
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
    const { data: settingsData } = useSettings();

    // Dynamically set tab title and favicon icon
    useEffect(() => {
        if (settingsData?.data) {
            if (settingsData.data.companyName) {
                document.title = settingsData.data.companyName;
            }
            if (settingsData.data.logoUrl) {
                const link = document.querySelector("link[rel*='icon']");
                if (link) {
                    link.href = settingsData.data.logoUrl;
                }
            }
        }
    }, [settingsData]);

    // Initialize real-time notifications
    useSocket();

    // Fetch approved edit requests for manager to hydrate the store
    useQuery({
        queryKey: ['my-approved-requests'],
        queryFn: async () => {
            if (user?.role !== 'manager') return [];
            const res = await api.get('/edit-requests/my');
            const APPROVED_WINDOW_MS = 5 * 60 * 1000; // strictly 5 minutes limit
            const approved = (res.data.data || []).filter(r => r.status === 'approved' && r.referenceString);
            approved.forEach(r => {
                const approvalTs = new Date(r.updatedAt || r.createdAt).getTime();
                if (Date.now() - approvalTs <= APPROVED_WINDOW_MS) {
                    addApprovedEditRecord(r.referenceString, approvalTs);
                }
            });
            return approved;
        },
        enabled: user?.role === 'manager'
    });

    useEffect(() => {
        if (user?.role === 'manager') {
            document.body.classList.add('role-manager');
        } else {
            document.body.classList.remove('role-manager');
        }
    }, [user]);

    // Automatically remove expired records (older than 2 minutes) from manager view
    useEffect(() => {
        if (user?.role !== 'manager') return;
        const interval = setInterval(() => {
            useAuthStore.getState().cleanupExpiredRecords?.();
        }, 10000); // Check every 10 seconds
        return () => clearInterval(interval);
    }, [user]);

    return (
        <div className="h-screen flex bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-hidden transition-colors">
            <Sidebar
                userRole={user?.role}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                <Header onToggleSidebar={() => setSidebarOpen((o) => !o)} />
                <main className="flex-1 overflow-y-auto p-6 relative bg-gray-50 dark:bg-gray-900">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}