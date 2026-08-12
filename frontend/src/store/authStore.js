import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
    persist(
        (set) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            lastAddedRecords: {}, // { currentPath: recordId }
            createdRecords: [], // array of record IDs created in current session
            approvedEditRecords: [], // array of record IDs

            setLastAddedRecord: (path, id) => set((state) => ({
                lastAddedRecords: { ...state.lastAddedRecords, [path]: { id, timestamp: Date.now() } }
            })),
            clearLastAddedRecord: (path) => set((state) => {
                const newRecords = { ...state.lastAddedRecords };
                delete newRecords[path];
                return { lastAddedRecords: newRecords };
            }),
            addCreatedRecord: (id, timestamp = Date.now()) => set((state) => {
                const exists = state.createdRecords.find(r => r.id === id);
                if (!exists) {
                    return { createdRecords: [...state.createdRecords, { id, timestamp }] };
                }
                return state;
            }),
            addApprovedEditRecord: (id, timestamp = Date.now()) => set((state) => {
                const APPROVED_WINDOW_MS = 5 * 60 * 1000; // strictly 5 minutes limit
                const tsNum = Number(timestamp) || Date.now();
                if (Date.now() - tsNum > APPROVED_WINDOW_MS) {
                    return state; // Expired, do not add
                }
                const freshRecords = (state.approvedEditRecords || []).filter(r => {
                    if (typeof r !== 'object' || !r.timestamp) return false;
                    return (Date.now() - Number(r.timestamp) <= APPROVED_WINDOW_MS);
                });
                const exists = freshRecords.some(r => (typeof r === 'object' ? r.id : r) === id);
                return {
                    approvedEditRecords: exists ? freshRecords : [...freshRecords, { id, timestamp: tsNum }]
                };
            }),
            removeApprovedEditRecord: (id) => set((state) => ({
                approvedEditRecords: (state.approvedEditRecords || []).filter(r => (typeof r === 'object' ? r.id : r) !== id)
            })),
            cleanupExpiredRecords: () => set((state) => {
                const APPROVED_WINDOW_MS = 5 * 60 * 1000; // strictly 5 minutes limit
                const validCreated = (state.createdRecords || []).filter(r => {
                    const ts = typeof r === 'object' ? r.timestamp : Date.now();
                    return Date.now() - ts <= 5 * 60 * 1000;
                });
                const validApproved = (state.approvedEditRecords || []).filter(r => {
                    if (typeof r !== 'object' || !r.timestamp) return false;
                    return (Date.now() - Number(r.timestamp) <= APPROVED_WINDOW_MS);
                });
                return { createdRecords: validCreated, approvedEditRecords: validApproved };
            }),

            login: (user, token) => {
                localStorage.setItem('token', token);
                set({ user, token, isAuthenticated: true });
            },

            logout: () => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                set({ 
                    user: null, 
                    token: null, 
                    isAuthenticated: false, 
                    lastAddedRecords: {},
                    createdRecords: [],
                    approvedEditRecords: [] 
                });
            },

            updateUser: (user) => set({ user }),

            setUser: (user) => set({ user }),
        }),
        {
            name: 'auth-storage',
        }
    )
);

const APPROVED_EDIT_WINDOW_MS = 5 * 60 * 1000;

export const isRecordApprovedForEdit = (row, approvedRecordsArg) => {
    if (!row) return false;
    const state = useAuthStore.getState();
    const approvedRecords = approvedRecordsArg || state.approvedEditRecords;
    if (!approvedRecords || !Array.isArray(approvedRecords) || approvedRecords.length === 0) return false;

    const rowId = String(row._id || row.id || '').trim();
    const batchName = String(row.batch_id?.batch_name || row.batch_id?.batch_number || row.batch_name || row.batch_number || '').trim().toLowerCase();
    const category = String(row.category || '').trim().toLowerCase();
    const description = String(row.description || '').trim().toLowerCase();

    return approvedRecords.some(refObj => {
        if (typeof refObj !== 'object' || !refObj.timestamp) return false;
        const ref = String(refObj.id || refObj.referenceString || '').trim();
        if (!ref) return false;

        // Check 5-minute approval window limit strictly
        if (Date.now() - Number(refObj.timestamp) > APPROVED_EDIT_WINDOW_MS) {
            return false;
        }

        // Direct ID match or ID inside referenceString [ID: xxx]
        if (rowId && (rowId === ref || ref.includes(rowId))) return true;

        const refLower = ref.toLowerCase();

        // Check if ref matches batchName (e.g. "1st batch")
        if (batchName && batchName.length >= 2 && refLower.includes(batchName)) {
            return true;
        }

        // Check category or description match
        if (category && category.length >= 3 && refLower.includes(category)) {
            return true;
        }
        if (description && description.length >= 3 && refLower.includes(description)) {
            return true;
        }

        const cleanRef = refLower
            .replace(/^(bill|invoice|supplier invoice|sales order|purchase order|request|edit|access|for|record|item|#|:\s*)+/gi, '')
            .trim();

        const matchableFields = [
            'invoiceNumber', 'billNumber', 'bill_number', 'supplierInvoiceNumber', 'orderNumber', 
            'bookingReference', 'receipt_number', 'gatePassNumber', 'quoteNumber', 'inquiryCode',
            'productCode', 'customerCode', 'warehouseCode', 'code', 'batch_name', 'batchNo', 'reference', 'refNo'
        ];

        return matchableFields.some(field => {
            const val = row[field];
            if (val == null) return false;
            const valStrLower = String(val).trim().toLowerCase();
            if (!valStrLower) return false;

            if (valStrLower === refLower || (cleanRef && valStrLower === cleanRef)) return true;
            if (cleanRef && cleanRef.length >= 3 && (valStrLower.includes(cleanRef) || valStrLower.endsWith(cleanRef))) return true;
            return false;
        });
    });
};

export const isRecordRecentlyCreated = (row, createdRecords) => {
    if (!row || !createdRecords || !Array.isArray(createdRecords) || createdRecords.length === 0) return false;
    return createdRecords.some(refObj => {
        const ref = typeof refObj === 'object' ? refObj.id : refObj;
        if (!ref) return false;
        const timestamp = typeof refObj === 'object' ? refObj.timestamp : Date.now();
        if (Date.now() - timestamp > 5 * 60 * 1000) return false;

        const rowId = row._id || row.id;
        if (rowId && (String(rowId) === String(ref) || String(ref).includes(String(rowId)))) return true;

        const rawRef = String(ref).trim().toLowerCase();
        const cleanRef = rawRef
            .replace(/^(bill|invoice|supplier invoice|sales order|purchase order|request|edit|access|for|record|item|#|:\s*)+/gi, '')
            .trim();

        const genericTerms = ['bill', 'bills', 'invoice', 'invoices', 'product', 'products', 'item', 'items', 'order', 'orders', 'customer', 'supplier', 'stock', 'request', 'edit'];
        if (genericTerms.includes(rawRef) || genericTerms.includes(cleanRef)) {
            return false;
        }

        const matchableFields = [
            'invoiceNumber', 'billNumber', 'bill_number', 'supplierInvoiceNumber', 'orderNumber', 
            'bookingReference', 'receipt_number', 'gatePassNumber', 'quoteNumber', 'inquiryCode',
            'productCode', 'customerCode', 'warehouseCode', 'code', 'batch_name', 'batchNo', 'reference', 'refNo'
        ];

        return matchableFields.some(field => {
            const val = row[field];
            if (val == null) return false;
            const valStrLower = String(val).trim().toLowerCase();
            if (!valStrLower) return false;

            if (valStrLower === rawRef || (cleanRef && valStrLower === cleanRef)) return true;

            if (cleanRef && cleanRef.length >= 3) {
                if (valStrLower.includes(cleanRef) || valStrLower.endsWith(cleanRef)) return true;
            }
            if (rawRef && rawRef.length >= 3) {
                if (valStrLower.includes(rawRef) || valStrLower.endsWith(rawRef)) return true;
            }
            return false;
        });
    });
};