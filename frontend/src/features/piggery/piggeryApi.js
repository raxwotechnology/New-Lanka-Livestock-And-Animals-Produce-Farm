import api from '../../api/axios';

export const piggeryApi = {
    // Batches
    getBatches: () => api.get('/piggery/batches'),
    getBatchById: (id) => api.get(`/piggery/batches/${id}`),
    createBatch: (data) => api.post('/piggery/batches', data),
    updateBatch: ({ id, ...data }) => api.put(`/piggery/batches/${id}`, data),
    deleteBatch: (id) => api.delete(`/piggery/batches/${id}`),
    getBatchAnalytics: (id) => api.get(`/piggery/analytics/${id}`),
    
    // Mortalities
    getMortalities: () => api.get('/piggery/mortalities'),
    createMortality: (data) => api.post('/piggery/mortalities', data),
    
    // Breeding
    getBreedingRecords: () => api.get('/piggery/breeding'),
    createBreedingRecord: (data) => api.post('/piggery/breeding', data),
    updateBreedingRecord: ({ id, ...data }) => api.put(`/piggery/breeding/${id}`, data),
    deleteBreedingRecord: (id) => api.delete(`/piggery/breeding/${id}`),
    
    // Finances
    getExpenses: (params) => api.get('/piggery/expenses', { params }),
    createExpense: (data) => api.post('/piggery/expenses', data),
    updateExpense: ({ id, ...data }) => api.put(`/piggery/expenses/${id}`, data),
    deleteExpense: (id) => api.delete(`/piggery/expenses/${id}`),
    
    getIncomes: (params) => api.get('/piggery/incomes', { params }),
    createIncome: (data) => api.post('/piggery/incomes', data),
    updateIncome: ({ id, ...data }) => api.put(`/piggery/incomes/${id}`, data),
    deleteIncome: (id) => api.delete(`/piggery/incomes/${id}`),

    // Batch Transactions
    getTransactions: (batchId, params) => api.get(`/piggery/transactions/${batchId}`, { params }),
    createTransaction: (data) => api.post('/piggery/transactions', data),
    updateTransaction: ({ id, ...data }) => api.put(`/piggery/transactions/${id}`, data),
    deleteTransaction: (id) => api.delete(`/piggery/transactions/${id}`),
    
    // Summary
    getSummary: () => api.get('/piggery/summary'),
};
