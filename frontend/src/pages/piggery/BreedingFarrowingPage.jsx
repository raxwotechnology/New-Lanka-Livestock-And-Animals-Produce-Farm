import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Plus, CheckCircle, X, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { piggeryApi } from '../../features/piggery/piggeryApi';
import { useAuthStore, isRecordRecentlyCreated, isRecordApprovedForEdit } from '../../store/authStore';

export default function BreedingFarrowingPage() {
    const queryClient = useQueryClient();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [farrowModalRecord, setFarrowModalRecord] = useState(null);

    const { user, createdRecords, approvedEditRecords, addCreatedRecord } = useAuthStore();
    const isDataEntry = user?.role === 'manager';

    const { data: breedingResp, isLoading: loadingBreeding } = useQuery({
        queryKey: ['pig-breeding'],
        queryFn: piggeryApi.getBreedingRecords,
    });
    
    const { data: batchesResp, isLoading: loadingBatches } = useQuery({
        queryKey: ['pig-batches'],
        queryFn: piggeryApi.getBatches,
    });

    let records = Array.isArray(breedingResp?.data?.data) ? breedingResp.data.data : (Array.isArray(breedingResp?.data) ? breedingResp.data : []);
    const batches = Array.isArray(batchesResp?.data?.data) ? batchesResp.data.data : (Array.isArray(batchesResp?.data) ? batchesResp.data : []);
    const breedingBatches = batches.filter(b => b.status === 'active' && b.current_count > 0);

    if (isDataEntry) {
        records = records.filter(b => 
            isRecordRecentlyCreated(b, createdRecords) || 
            isRecordApprovedForEdit(b, approvedEditRecords)
        );
    }

    const { register: regAdd, handleSubmit: handleAdd, reset: resetAdd, formState: { errors: errAdd } } = useForm();
    const { register: regFarrow, handleSubmit: handleFarrow, reset: resetFarrow, formState: { errors: errFarrow } } = useForm();

    const addMutation = useMutation({
        mutationFn: piggeryApi.createBreedingRecord,
        onSuccess: (res) => {
            if (res?.data?._id || res?._id) {
                addCreatedRecord(res.data?._id || res._id);
            } else if (res?.data?.data?._id) {
                addCreatedRecord(res.data.data._id);
            }
            queryClient.invalidateQueries(['pig-breeding']);
            toast.success('Breeding record added');
            setIsAddModalOpen(false);
            resetAdd();
        }
    });

    const updateMutation = useMutation({
        mutationFn: piggeryApi.updateBreedingRecord,
        onSuccess: () => {
            queryClient.invalidateQueries(['pig-breeding']);
            toast.success('Farrowing recorded');
            setFarrowModalRecord(null);
            resetFarrow();
        }
    });

    const deleteMutation = useMutation({
        mutationFn: piggeryApi.deleteBreedingRecord,
        onSuccess: () => {
            queryClient.invalidateQueries(['pig-breeding']);
            toast.success('Breeding record deleted');
        }
    });

    const handleDelete = (row, e) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this breeding record?')) {
            deleteMutation.mutate(row._id);
        }
    };

    const onAddSubmit = (data) => addMutation.mutate(data);
    const onFarrowSubmit = (data) => updateMutation.mutate({
        id: farrowModalRecord._id,
        ...data,
        piglets_born_alive: Number(data.piglets_born_alive),
        piglets_stillborn: Number(data.piglets_stillborn),
        status: 'farrowed'
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <PageHeader title="Breeding & Farrowing" description="Track mating and litter outputs" />
                <Button onClick={() => setIsAddModalOpen(true)}>
                    <Plus size={18} className="mr-2" /> Record Mating
                </Button>
            </div>

            <Card>
                <Table
                    columns={[
                        { label: 'Batch', key: 'sow_batch_id', render: (row) => row.sow_batch_id?.batch_number },
                        { label: 'Mating Date', key: 'mating_date', render: (row) => format(new Date(row.mating_date), 'MMM dd, yyyy') },
                        { label: 'Expected Farrowing', key: 'expected_farrowing_date', render: (row) => format(new Date(row.expected_farrowing_date), 'MMM dd, yyyy') },
                        { label: 'Status', key: 'status', render: (row) => <Badge variant={row.status === 'pregnant' ? 'warning' : row.status === 'farrowed' ? 'success' : 'danger'}>{row.status}</Badge> },
                        { label: 'Alive', key: 'piglets_born_alive' },
                        { label: 'Stillborn', key: 'piglets_stillborn' },
                        { 
                            label: 'Actions', 
                            key: 'actions',
                            render: (row) => (
                                <div className="flex items-center gap-2">
                                    {row.status === 'pregnant' && (
                                        <Button variant="secondary" size="sm" onClick={() => setFarrowModalRecord(row)}>
                                            <CheckCircle size={14} className="mr-1" /> Record Farrowing
                                        </Button>
                                    )}
                                    {(!isDataEntry || isRecordApprovedForEdit(row, approvedEditRecords, createdRecords)) && (
                                        <button onClick={(e) => handleDelete(row, e)} className="text-red-500 hover:text-red-700 p-1" title="Delete Record">
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            ) 
                        },
                    ]}
                    data={records}
                    isLoading={loadingBreeding}
                    isDataEntryAllowed={true}
                />
            </Card>

            {/* Add Record Mating Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-xl p-5 shadow-2xl animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:fade-in">
                        <div className="flex justify-between items-center mb-5 border-b border-gray-100 pb-3">
                            <h2 className="text-xl font-bold text-gray-900">Record New Mating</h2>
                            <button type="button" onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-700 p-1">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleAdd(onAddSubmit)} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Batch</label>
                                <select required {...regAdd('sow_batch_id', { required: true })} className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all">
                                    <option value="">Select Batch</option>
                                    {breedingBatches.map(b => (
                                        <option key={b._id} value={b._id}>{b.batch_number} (Count: {b.current_count})</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mating Date</label>
                                <input type="date" required {...regAdd('mating_date', { required: true })} className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Expected Farrowing Date</label>
                                <input type="date" required {...regAdd('expected_farrowing_date', { required: true })} className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" />
                            </div>

                            <button type="submit" disabled={addMutation.isPending} className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold p-3 rounded-lg transition-colors flex justify-center items-center">
                                {addMutation.isPending ? 'Saving...' : 'Save Mating Record'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Farrowing Modal */}
            {!!farrowModalRecord && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-xl p-5 shadow-2xl animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:fade-in">
                        <div className="flex justify-between items-center mb-5 border-b border-gray-100 pb-3">
                            <h2 className="text-xl font-bold text-gray-900">Record Farrowing (Litter)</h2>
                            <button type="button" onClick={() => setFarrowModalRecord(null)} className="text-gray-400 hover:text-gray-700 p-1">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleFarrow(onFarrowSubmit)} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Actual Farrowing Date</label>
                                <input type="date" required {...regFarrow('actual_farrowing_date', { required: true })} className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Born Alive</label>
                                    <input type="number" min="0" required {...regFarrow('piglets_born_alive', { required: true })} className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Stillborn</label>
                                    <input type="number" min="0" required {...regFarrow('piglets_stillborn', { required: true })} className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" />
                                </div>
                            </div>

                            <button type="submit" disabled={updateMutation.isPending} className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold p-3 rounded-lg transition-colors flex justify-center items-center">
                                {updateMutation.isPending ? 'Saving...' : 'Save Litter Record'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

