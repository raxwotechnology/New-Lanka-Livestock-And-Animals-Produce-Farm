import api from '../../api/axios';

export const distributionApi = {
    // Items
    getItems: () => api.get('/distribution/items'),
    getItemById: (id) => api.get(`/distribution/items/${id}`),
    createItem: (data) => api.post('/distribution/items', data),
    updateItem: ({ id, ...data }) => api.put(`/distribution/items/${id}`, data),
    deleteItem: (id) => api.delete(`/distribution/items/${id}`),
    uploadItemAttachment: (id, data) => api.post(`/distribution/items/${id}/attachments`, data),
    deleteItemAttachment: (id, attachmentId) => api.delete(`/distribution/items/${id}/attachments/${attachmentId}`),

    // Bills
    getBills: (params) => api.get('/distribution/bills', { params }),
    createBill: (data) => api.post('/distribution/bills', data),
    deleteBill: (id) => api.delete(`/distribution/bills/${id}`),

    // Reports
    getSummary: () => api.get('/distribution/summary'),
};
