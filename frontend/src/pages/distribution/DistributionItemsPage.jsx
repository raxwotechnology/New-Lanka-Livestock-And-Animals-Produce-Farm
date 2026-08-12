import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, Eye, X } from 'lucide-react';

import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import { distributionApi } from '../../features/distribution/distributionApi';
import { useAuthStore, isRecordRecentlyCreated, isRecordApprovedForEdit } from '../../store/authStore';

export default function DistributionItemsPage() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const { data: resp, isLoading } = useQuery({ queryKey: ['dist-items'], queryFn: distributionApi.getItems });
    let items = resp?.data?.data || [];

    const { user, createdRecords, approvedEditRecords, addCreatedRecord } = useAuthStore();
    const isDataEntry = user?.role === 'manager';

    if (isDataEntry) {
        items = items.filter(b => 
            isRecordRecentlyCreated(b, createdRecords) || 
            isRecordApprovedForEdit(b, approvedEditRecords)
        );
    }

    const { register, handleSubmit, reset, setValue, watch } = useForm();
    const selectedCategory = watch('category');

    const addMut = useMutation({
        mutationFn: distributionApi.createItem,
        onSuccess: (res) => {
            if (res?.data?._id || res?._id) {
                addCreatedRecord(res.data?._id || res._id);
            } else if (res?.data?.data?._id) {
                addCreatedRecord(res.data.data._id);
            }
            queryClient.invalidateQueries(['dist-items']);
            toast.success('Item added successfully');
            closeModal();
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Failed to add item')
    });

    const updateMut = useMutation({
        mutationFn: distributionApi.updateItem,
        onSuccess: () => {
            queryClient.invalidateQueries(['dist-items']);
            toast.success('Item updated successfully');
            closeModal();
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Failed to update item')
    });

    const deleteMut = useMutation({
        mutationFn: distributionApi.deleteItem,
        onSuccess: () => {
            queryClient.invalidateQueries(['dist-items']);
            toast.success('Item deleted');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Cannot delete item')
    });

    const openModal = (item = null) => {
        setEditingItem(item);
        if (item) {
            setValue('date', item.date ? new Date(item.date).toISOString().split('T')[0] : new Date(item.createdAt).toISOString().split('T')[0]);
            setValue('name', item.name);
            
            // Check if item's category is one of the defaults, if not it's custom
            const defaultCategories = ['Meat', 'Offal/Parts', 'Processed'];
            if (!defaultCategories.includes(item.category) && item.category) {
                setValue('category', 'Other');
                setValue('custom_category', item.category);
            } else {
                setValue('category', item.category);
                setValue('custom_category', '');
            }

            setValue('selling_price', item.selling_price);
            setValue('unit', item.unit);
            setValue('stock_quantity', item.stock_quantity);
        } else {
            reset();
            setValue('date', new Date().toISOString().split('T')[0]);
            setValue('unit', 'kg');
            setValue('stock_quantity', 0);
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
        reset();
    };

    const onSubmit = (data) => {
        const payload = { ...data };
        if (payload.category === 'Other' && payload.custom_category) {
            payload.category = payload.custom_category;
        }
        delete payload.custom_category;

        if (editingItem) {
            updateMut.mutate({ id: editingItem._id, ...payload });
        } else {
            addMut.mutate(payload);
        }
    };

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this item?')) {
            deleteMut.mutate(id);
        }
    };

    const columns = [
        { label: 'Date', key: 'date', render: (row) => new Date(row.date || row.createdAt).toLocaleDateString() },
        { label: 'Item Name', key: 'name', className: 'font-medium text-gray-900' },
        { label: 'Category', key: 'category' },
        { 
            label: 'Unit', 
            key: 'unit',
            render: (row) => (
                <span className="text-xs font-semibold text-gray-500 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-md">
                    {row.unit}
                </span>
            )
        },
        { label: 'Selling Price (Rs)', key: 'selling_price', render: (row) => row.selling_price.toLocaleString() },
        { 
            label: 'Stock Available', 
            key: 'stock_quantity', 
            render: (row) => (
                <span className={`px-2.5 py-0.5 inline-flex text-sm font-bold rounded-md border ${row.stock_quantity > 0 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                    {row.stock_quantity}
                </span>
            ) 
        },
        {
            label: 'Actions',
            key: 'actions',
            render: (row) => (
                <div className="flex space-x-3 items-center">
                    {(!isDataEntry || isRecordApprovedForEdit(row, approvedEditRecords, createdRecords)) && (
                        <button onClick={(e) => { e.stopPropagation(); openModal(row); }} className="text-blue-600 hover:text-blue-900" title="Edit Item"><Edit2 size={16} /></button>
                    )}
                    {!isDataEntry && (
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(row._id); }} className="text-red-600 hover:text-red-900" title="Delete Item"><Trash2 size={16} /></button>
                    )}
                </div>
            ),
        }
    ];

    return (
        <div className="space-y-6">
            <PageHeader 
                title="Chicken Distribution Items" 
                description="Manage items for external distribution and tracking"
                actions={<Button onClick={() => openModal()} className="flex items-center gap-2"><Plus size={16} /> Add New Item</Button>}
            />

            <Card className="p-0 overflow-hidden">
                <Table 
                    columns={columns} 
                    data={items} 
                    isLoading={isLoading} 
                    onRowClick={(row) => navigate(`/distribution/items/${row._id}`)}
                />
            </Card>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-xl p-5 shadow-2xl animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:fade-in">
                        <div className="flex justify-between items-center mb-5 border-b border-gray-100 pb-3">
                            <h2 className="text-xl font-bold text-gray-900">{editingItem ? 'Edit Item' : 'Add New Item'}</h2>
                            <button type="button" onClick={closeModal} className="text-gray-400 hover:text-gray-700 p-1">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                <input type="date" required {...register('date', { required: true })} className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                                <input type="text" placeholder="e.g. Chicken Whole" required {...register('name', { required: true })} className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                <select required {...register('category', { required: true })} className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all">
                                    <option value="" disabled>Select Category</option>
                                    <option value="Meat">Meat</option>
                                    <option value="Offal/Parts">Offal/Parts</option>
                                    <option value="Processed">Processed</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            {selectedCategory === 'Other' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Custom Category Name</label>
                                    <input type="text" placeholder="Specify Custom Category..." required {...register('custom_category', { required: selectedCategory === 'Other' })} className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" />
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price (Rs)</label>
                                    <input type="number" min="0" step="0.01" required {...register('selling_price', { required: true, valueAsNumber: true })} className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                                    <input type="text" placeholder="e.g. kg, pieces" required {...register('unit', { required: true })} className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Stock Available</label>
                                <div className="relative">
                                    <input type="number" min="0" step="0.01" required {...register('stock_quantity', { required: true, valueAsNumber: true })} className="w-full p-2.5 pr-12 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">Qty</span>
                                </div>
                            </div>

                            <button type="submit" disabled={addMut.isPending || updateMut.isPending} className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold p-3 rounded-lg transition-colors flex justify-center items-center">
                                {addMut.isPending || updateMut.isPending ? 'Saving...' : (editingItem ? 'Update Item' : 'Add Item')}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
