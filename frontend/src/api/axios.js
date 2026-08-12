import axios from 'axios';
import { useAuthStore, isRecordRecentlyCreated, isRecordApprovedForEdit } from '../store/authStore';

const getBaseUrl = () => {
    let envUrl = import.meta.env.VITE_API_URL || 'https://new-lanka-livestock-and-animals-produce.onrender.com/api';
    envUrl = envUrl.trim().replace(/\/$/, '');
    if (!envUrl.endsWith('/api')) {
        envUrl += '/api';
    }
    if (envUrl.includes('localhost') && typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
        return envUrl.replace('localhost', window.location.hostname);
    }
    return envUrl;
};

const api = axios.create({
    baseURL: getBaseUrl(),
    headers: {
        'Content-Type': 'application/json',
    },
});

// Attach JWT token to every request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        // For manager role GET requests with pagination, increase limit so approved records on later pages are retrieved for client-side filtering
        const state = useAuthStore.getState();
        if (config.method === 'get' && state.user?.role === 'manager' && config.params?.page) {
            config.params = { ...config.params, limit: 1000 };
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Handle 401 and capture POST successes
api.interceptors.response.use(
    (response) => {
        // If it's a successful POST or PUT request, record its ID for the manager workflow
        if ((response.config.method === 'post' || response.config.method === 'put') && response.data?.data) {
            const state = useAuthStore.getState();
            const data = response.data.data;
            const currentPath = window.location.pathname;
            
            if (Array.isArray(data)) {
                data.forEach(item => {
                    const recordId = item.stockItem?._id || item.stockItem || item._id;
                    if (recordId) {
                        state.setLastAddedRecord(currentPath, recordId);
                        state.addCreatedRecord(recordId);
                        if (response.config.method === 'put') {
                            state.removeApprovedEditRecord(recordId);
                        }
                    }
                });
            } else if (data._id) {
                const recordId = data._id;
                state.setLastAddedRecord(currentPath, recordId);
                state.addCreatedRecord(recordId);
                if (response.config.method === 'put') {
                    state.removeApprovedEditRecord(recordId);
                }
            }
        }

        // Intercept GET requests to hide history from managers on paginated endpoints
        if (response.config.method === 'get') {
            const state = useAuthStore.getState();
            if (state.user?.role === 'manager') {
                const isPaginatedTableRequest = !!response.config.params?.page;
                
                if (isPaginatedTableRequest && response.data && Array.isArray(response.data.data)) {
                    // Import helper functions statically at the top of the file instead of require()
                    // Assuming isRecordRecentlyCreated and isRecordApprovedForEdit are imported at the top
                    const filteredData = response.data.data.filter(row => {
                        return isRecordRecentlyCreated(row, state.createdRecords) || 
                               isRecordApprovedForEdit(row, state.approvedEditRecords, state.createdRecords);
                    });
                    response.data.data = filteredData;
                    response.data.total = filteredData.length;
                    response.data.count = filteredData.length;
                    response.data.totalPages = Math.ceil(filteredData.length / (response.config.params?.limit || 10)) || 1;
                }
            }
        }

        return response;
    },
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('auth-storage'); // Reset Zustand persisted auth state
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;