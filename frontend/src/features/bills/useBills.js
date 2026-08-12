import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { billsApi } from './billsApi';

export const useBills = (filters = {}) => useQuery({
    queryKey: ['bills', filters],
    queryFn: () => billsApi.list(filters),
    keepPreviousData: true,
});

export const useBill = (id) => useQuery({
    queryKey: ['bill', id],
    queryFn: () => billsApi.getById(id),
    enabled: !!id,
});

export const useCreateBill = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: billsApi.create,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['bills'] });
            toast.success('Bill created');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
    });
};

export const useCreateBillFromGrn = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: billsApi.createFromGrn,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['bills'] });
            toast.success('Bill created from GRN');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
    });
};

export const useUpdateBill = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }) => billsApi.update(id, data),
        onSuccess: (data, variables) => {
            qc.invalidateQueries({ queryKey: ['bills'] });
            qc.invalidateQueries({ queryKey: ['bill', variables.id] });
            toast.success('Bill updated');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
    });
};

export const usePayablesAging = () => useQuery({
    queryKey: ['payablesAging'],
    queryFn: billsApi.agingSummary,
});