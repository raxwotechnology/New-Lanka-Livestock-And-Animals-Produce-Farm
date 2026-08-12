import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MoreVertical, Plus, Trash2, Edit } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

import AddPigBatchModal from './AddPigBatchModal';
import { piggeryApi } from '../../features/piggery/piggeryApi';
import { useAuthStore, isRecordRecentlyCreated, isRecordApprovedForEdit } from '../../store/authStore';

export default function PigBatchesPage() {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedEditBatch, setSelectedEditBatch] = useState(null);
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { user, createdRecords, approvedEditRecords } = useAuthStore();
    const isDataEntry = user?.role === 'manager';

    const { data: response, isLoading } = useQuery({
        queryKey: ['pig-batches'],
        queryFn: piggeryApi.getBatches
    });

    const deleteMutation = useMutation({
        mutationFn: piggeryApi.deleteBatch,
        onSuccess: () => {
            toast.success('Batch deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['pig-batches'] });
        },
        onError: (error) => {
            console.error('Failed to delete batch:', error);
            toast.error(error.response?.data?.message || 'Failed to delete batch');
        }
    });

    const handleDeleteBatch = (e, id) => {
        e.stopPropagation();
        if (window.confirm("Are you sure you want to delete this batch and all its records? This cannot be undone.")) {
            deleteMutation.mutate(id);
        }
    };
    
    const handleEditBatch = (e, batch) => {
        e.stopPropagation();
        setSelectedEditBatch(batch);
        setIsAddModalOpen(true);
    };

    const batchesData = response?.data || response || [];
    let batches = Array.isArray(batchesData) ? batchesData : (Array.isArray(batchesData.data) ? batchesData.data : []);

    if (isDataEntry) {
        batches = batches.filter(b => 
            isRecordRecentlyCreated(b, createdRecords) || 
            isRecordApprovedForEdit(b, approvedEditRecords)
        );
    }

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-LK', {
            style: 'currency',
            currency: 'LKR',
            minimumFractionDigits: 2
        }).format(amount || 0);
    };

    const calculateDaysAgo = (dateStr) => {
        if (!dateStr) return 0;
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return 0;
        const diffTime = Math.abs(new Date() - date);
        return Math.floor(diffTime / (1000 * 60 * 60 * 24));
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return 'Invalid Date';
        return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-800 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200 shadow-sm">
                <div className="w-6"></div>
                <h1 className="text-lg font-semibold text-gray-900">Pig Batches</h1>
                <div className="w-6"></div>
            </div>

            {/* Filters */}
            <div className="h-4"></div>

            {/* Batch List */}
            <div className="px-4 space-y-6">
                {isLoading ? (
                    <div className="text-center py-10 text-gray-500">Loading...</div>
                ) : batches.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">No pig batches yet.</div>
                ) : (
                    batches.map(batch => {
                        const { financials = {} } = batch;
                        const hasFinancials = financials.totalIncome > 0 || financials.totalExpense > 0;
                        const data = [
                            { name: 'Income', value: financials.totalIncome || 1, color: '#10b981' },
                            { name: 'Expense', value: financials.totalExpense || 1, color: '#ef4444' }
                        ];

                        return (
                            <div 
                                key={batch._id} 
                                className="bg-white rounded-xl overflow-hidden cursor-pointer hover:ring-1 hover:ring-amber-500/50 transition-all shadow-sm border border-gray-100"
                                onClick={() => navigate(`/piggery/batches/${batch._id}`)}
                            >
                                <div className="p-4">
                                    <div className="flex justify-between items-center mb-1">
                                        <h2 className="text-lg font-bold text-gray-900">{batch.batch_number}</h2>
                                        <div className="flex items-center gap-1">
                                            {(!isDataEntry || isRecordRecentlyCreated(batch, createdRecords) || isRecordApprovedForEdit(batch, approvedEditRecords)) && (
                                                <button 
                                                    onClick={(e) => handleEditBatch(e, batch)}
                                                    className="text-amber-500 hover:text-amber-600 hover:bg-amber-50 p-1.5 rounded-full transition-colors"
                                                    title="Edit Batch"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                            )}
                                            {(!isDataEntry || isRecordRecentlyCreated(batch, createdRecords) || isRecordApprovedForEdit(batch, approvedEditRecords)) && (
                                                <button 
                                                    onClick={(e) => handleDeleteBatch(e, batch._id)}
                                                    className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-full transition-colors"
                                                    title="Delete Batch"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 mb-4 pb-4 border-b border-gray-100">
                                        Start Date: {formatDate(batch.acquisition_date)} 
                                        {batch.acquisition_date && !isNaN(new Date(batch.acquisition_date).getTime()) && ` (${calculateDaysAgo(batch.acquisition_date)} days ago)`}
                                    </p>

                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="flex items-center gap-2 text-gray-500"><span className="text-amber-500 w-3.5 flex justify-center text-xs font-bold">#</span> Starting Count</span>
                                            <span className="text-gray-700 font-medium">{batch.initial_count}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="flex items-center gap-2 text-gray-500"><span className="text-amber-500 w-3.5 flex justify-center text-xs font-bold">#</span> Current Count</span>
                                            <span className="text-gray-700 font-medium">{batch.current_count}</span>
                                        </div>

                                        {!isDataEntry && (
                                            <>
                                                <div className="flex justify-between mt-2 pt-2 border-t border-gray-50">
                                                    <span className="flex items-center gap-2 text-gray-500"><span className="text-amber-500 w-3.5 flex justify-center text-xs">💵</span> Av. Purchase Price</span>
                                                    <span className="text-gray-700 font-medium">{formatCurrency(financials.avgPurchasePrice)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="flex items-center gap-2 text-gray-500"><span className="text-amber-500 w-3.5 flex justify-center text-xs">💵</span> Av. Income</span>
                                                    <span className="text-gray-700 font-medium">{formatCurrency(financials.avgIncome)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="flex items-center gap-2 text-gray-500"><span className="text-amber-500 w-3.5 flex justify-center text-xs">💵</span> Av. Cost + Expenses</span>
                                                    <span className="text-gray-700 font-medium">{formatCurrency(financials.avgCost)}</span>
                                                </div>
                                                <div className="flex justify-between pb-4 border-b border-gray-100">
                                                    <span className="flex items-center gap-2 text-gray-500"><span className="text-amber-500 w-3.5 flex justify-center text-xs">💵</span> Net Profit</span>
                                                    <span className="text-green-600 font-bold">{formatCurrency(financials.netProfit)}</span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    
                                    <div className="pt-4 mt-4 border-t border-gray-100 flex justify-between items-center">
                                        <button 
                                            onClick={() => navigate(`/piggery/batches/${batch._id}`)}
                                            className="text-sm font-medium text-amber-600 hover:text-amber-700"
                                        >
                                            View Details
                                        </button>
                                    </div>

                                    {/* Financial Summary */}
                                    {!isDataEntry && (
                                    <div className="flex items-center pt-4">
                                        <div className="w-24 h-24">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={hasFinancials ? data : [{name: 'Empty', value: 1}]}
                                                        innerRadius={25}
                                                        outerRadius={35}
                                                        paddingAngle={hasFinancials ? 5 : 0}
                                                        dataKey="value"
                                                        stroke="none"
                                                    >
                                                        {hasFinancials ? data.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                                        )) : <Cell fill="#e5e7eb" />}
                                                    </Pie>
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="flex-1 ml-4">
                                            <h3 className="font-semibold text-gray-900 mb-2">Finances</h3>
                                            <div className="flex justify-between text-xs mb-1">
                                                <span className="flex items-center gap-1 text-gray-500"><span className="w-2 h-2 rounded-full bg-green-500"></span> Income</span>
                                                <span className="text-gray-700 font-medium">{formatCurrency(financials.totalIncome)}</span>
                                            </div>
                                            <div className="flex justify-between text-xs mb-2 border-b border-gray-100 pb-2">
                                                <span className="flex items-center gap-1 text-gray-500"><span className="w-2 h-2 rounded-full bg-red-500"></span> Expense</span>
                                                <span className="text-gray-700 font-medium">-{formatCurrency(financials.totalExpense)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm font-bold">
                                                <span className="text-gray-800">Balance</span>
                                                <span className={financials.balance >= 0 ? "text-green-600" : "text-red-600"}>
                                                    {formatCurrency(financials.balance)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    )}
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            {/* Floating Action Button */}
            <button 
                onClick={() => {
                    setSelectedEditBatch(null);
                    setIsAddModalOpen(true);
                }}
                className="fixed bottom-20 right-4 bg-amber-500 hover:bg-amber-600 text-black font-semibold px-4 py-3 rounded-full shadow-lg flex items-center gap-2 transition-transform transform active:scale-95 z-50"
            >
                <Plus size={20} /> New Batch
            </button>

            {/* Add/Edit Batch Modal */}
            <AddPigBatchModal 
                isOpen={isAddModalOpen} 
                onClose={() => {
                    setIsAddModalOpen(false);
                    setSelectedEditBatch(null);
                }}
                editData={selectedEditBatch}
            />
        </div>
    );
}
