import { useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';
import { piggeryApi } from '../../features/piggery/piggeryApi';
import { useAuthStore } from '../../store/authStore';

export default function AddPigBatchModal({ isOpen, onClose, editData }) {
    const queryClient = useQueryClient();
    const { register, handleSubmit, reset, formState: { errors } } = useForm();
    const addCreatedRecord = useAuthStore(state => state.addCreatedRecord);

    useEffect(() => {
        if (isOpen && editData) {
            reset({
                batch_number: editData.batch_number,
                initial_count: editData.initial_count,
                acquisition_date: editData.acquisition_date ? editData.acquisition_date.split('T')[0] : '',
                breed: editData.breed,
                housing: editData.housing,
                notes: editData.notes
            });
        } else if (isOpen && !editData) {
            reset({
                batch_number: '',
                initial_count: '',
                acquisition_date: '',
                breed: '',
                housing: '',
                notes: ''
            });
        }
    }, [isOpen, editData, reset]);

    const saveMutation = useMutation({
        mutationFn: editData ? piggeryApi.updateBatch : piggeryApi.createBatch,
        onSuccess: (res) => {
            if (!editData) {
                if (res?.data?._id || res?._id) {
                    addCreatedRecord(res.data?._id || res._id);
                } else if (res?.data?.data?._id) {
                    addCreatedRecord(res.data.data._id);
                }
            }
            queryClient.invalidateQueries({ queryKey: ['pig-batches'] });
            toast.success(`Batch ${editData ? 'updated' : 'created'} successfully`);
            onClose();
            reset();
        },
        onError: (err) => toast.error(err.response?.data?.message || `Failed to ${editData ? 'update' : 'create'} batch`)
    });

    const onSubmit = (data) => {
        const payload = { ...data, initial_count: Number(data.initial_count) };
        if (editData) {
            saveMutation.mutate({ id: editData._id, ...payload });
        } else {
            saveMutation.mutate(payload);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-xl p-5 shadow-2xl animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:fade-in">
                <div className="flex justify-between items-center mb-5 border-b border-gray-100 pb-3">
                    <h2 className="text-xl font-bold text-gray-900">{editData ? 'Edit Pig Batch' : 'Add New Pig Batch'}</h2>
                    <button onClick={onClose} type="button" className="text-gray-400 hover:text-gray-700 p-1">
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Batch Name / ID</label>
                        <input 
                            type="text" 
                            placeholder="e.g. Batch A1"
                            className={`w-full p-2.5 bg-gray-50 border ${errors.batch_number ? 'border-red-500' : 'border-gray-300'} text-gray-900 rounded-lg focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all`}
                            {...register('batch_number', { required: 'Required' })} 
                        />
                        {errors.batch_number && <p className="text-red-500 text-xs mt-1">{errors.batch_number.message}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Initial Count</label>
                            <input 
                                type="number" 
                                min="1"
                                placeholder="e.g. 50"
                                className={`w-full p-2.5 bg-gray-50 border ${errors.initial_count ? 'border-red-500' : 'border-gray-300'} text-gray-900 rounded-lg focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all`}
                                {...register('initial_count', { required: 'Required' })} 
                            />
                            {errors.initial_count && <p className="text-red-500 text-xs mt-1">{errors.initial_count.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Arrival Date</label>
                            <input 
                                type="date" 
                                className={`w-full p-2.5 bg-gray-50 border ${errors.acquisition_date ? 'border-red-500' : 'border-gray-300'} text-gray-900 rounded-lg focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all`}
                                {...register('acquisition_date', { required: 'Required' })} 
                            />
                            {errors.acquisition_date && <p className="text-red-500 text-xs mt-1">{errors.acquisition_date.message}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Breed Type</label>
                            <input 
                                type="text" 
                                placeholder="e.g. Large White"
                                className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                                {...register('breed')} 
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Housing / Pen</label>
                            <input 
                                type="text" 
                                placeholder="e.g. Pen 3"
                                className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                                {...register('housing')} 
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                        <textarea 
                            placeholder="Optional notes"
                            rows="2"
                            className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all resize-none"
                            {...register('notes')} 
                        ></textarea>
                    </div>

                    <button 
                        type="submit" 
                        disabled={saveMutation.isPending}
                        className="w-full bg-amber-500 text-black font-bold py-3 mt-2 rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50"
                    >
                        {saveMutation.isPending ? (editData ? 'Updating...' : 'Creating...') : (editData ? 'Update Batch' : 'Create Batch')}
                    </button>
                </form>
            </div>
        </div>
    );
}
