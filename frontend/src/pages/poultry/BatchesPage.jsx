import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { toast } from 'react-hot-toast';
import { MoreVertical, Sparkles, Plus, Bird, Users, ChevronRight, X, Trash2, Edit2, ShieldAlert, Lock } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useAuthStore, isRecordRecentlyCreated, isRecordApprovedForEdit } from '../../store/authStore';

export default function BatchesPage() {
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingBatchId, setEditingBatchId] = useState(null);
    const navigate = useNavigate();
    const { user, createdRecords, approvedEditRecords, addCreatedRecord } = useAuthStore();
    const isDataEntry = user?.role === 'manager';

    // Form state
    const [batchName, setBatchName] = useState('');
    const [initialBirds, setInitialBirds] = useState('');
    const [breed, setBreed] = useState('');
    const [stage, setStage] = useState('');
    const [raisedFor, setRaisedFor] = useState('');
    
    const openEditModal = (batch, e) => {
        e.stopPropagation();
        setEditingBatchId(batch._id);
        setBatchName(batch.batch_name);
        setInitialBirds(batch.initial_birds);
        setBreed(batch.breed || '');
        setStage(batch.stage || '');
        setRaisedFor(batch.raised_for || '');
        setIsAddModalOpen(true);
    };

    const openCreateModal = () => {
        setEditingBatchId(null);
        setBatchName('');
        setInitialBirds('');
        setBreed('');
        setStage('');
        setRaisedFor('');
        setIsAddModalOpen(true);
    };
    
    const fetchBatches = async () => {

        setLoading(true);
        try {
            const res = await api.get('/poultry/batches');
            if (res.data.success) {
                let fetchedBatches = res.data.data;
                if (isDataEntry) {
                    fetchedBatches = fetchedBatches.filter(b => 
                        isRecordRecentlyCreated(b, createdRecords) || 
                        isRecordApprovedForEdit(b, approvedEditRecords)
                    );
                }
                setBatches(fetchedBatches);
            }
        } catch (error) {
            toast.error('Failed to load batches');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBatches();
    }, []);

    const handleCreateBatch = async (e) => {
        e.preventDefault();
        if (!batchName || !initialBirds) return;

        try {
            const payload = {
                batch_name: batchName,
                initial_birds: Number(initialBirds),
                breed,
                stage,
                raised_for: raisedFor
            };

            let res;
            if (editingBatchId) {
                res = await api.put(`/poultry/batches/${editingBatchId}`, payload);
            } else {
                res = await api.post('/poultry/batches', payload);
            }

            if (res.data.success) {
                toast.success(editingBatchId ? 'Batch updated successfully' : 'Batch created successfully');
                if (!editingBatchId && res.data.data?._id) {
                    addCreatedRecord(res.data.data._id);
                }
                setBatchName('');
                setInitialBirds('');
                setBreed('');
                setStage('');
                setRaisedFor('');
                setEditingBatchId(null);
                setIsAddModalOpen(false);
                fetchBatches();
            }
        } catch (error) {
            console.error('Error saving batch:', error);
            const errorMsg = error.response?.data?.message || error.message || 'Error saving batch';
            toast.error(errorMsg);
        }
    };

    const handleDeleteBatch = async (e, id) => {
        e.stopPropagation();
        if (window.confirm("Are you sure you want to delete this batch and all its records? This cannot be undone.")) {
            try {
                const res = await api.delete(`/poultry/batches/${id}`);
                if (res.data.success) {
                    toast.success('Batch deleted successfully');
                    fetchBatches();
                }
            } catch (error) {
                console.error('Error deleting batch:', error);
                toast.error(error.response?.data?.message || 'Error deleting batch');
            }
        }
    };

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
                <h1 className="text-lg font-semibold text-gray-900">Poultry Batches</h1>
                <div className="w-6"></div>
            </div>

            {/* Filters */}
            <div className="h-4"></div>
            {/* Batch List */}
            <div className="px-4 space-y-6">
                {loading ? (
                    <div className="text-center py-10 text-gray-500">Loading...</div>
                ) : batches.length === 0 ? (
                    user?.role === 'manager' ? (
                        <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-gray-50 rounded-lg border border-gray-200 mt-6">
                            <div className="bg-gray-200 p-3 rounded-full mb-3">
                                <Lock className="w-6 h-6 text-gray-500" />
                            </div>
                            <h3 className="text-sm font-medium text-gray-900 mb-1">History Restricted</h3>
                            <p className="text-xs text-gray-500 max-w-sm mb-4">
                                As a data entry user, you cannot view previous records in this area. You can only view the item you just added, or items approved by Admin.
                            </p>
                            <button
                                onClick={() => navigate('/manager/request-edit')}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <ShieldAlert size={16} />
                                Request Edit Access
                            </button>
                        </div>
                    ) : (
                        <div className="text-center py-10 text-gray-500">No batches yet.</div>
                    )
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
                                onClick={() => navigate(`/poultry/batches/${batch._id}`)}
                            >
                                <div className="p-4">
                                    <div className="flex justify-between items-center mb-1">
                                        <h2 className="text-lg font-bold text-gray-900">{batch.batch_name}</h2>
                                        <div className="flex gap-2">
                                            {(!isDataEntry || isRecordApprovedForEdit(batch, approvedEditRecords, createdRecords)) && (
                                                <button 
                                                    onClick={(e) => openEditModal(batch, e)}
                                                    className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-1.5 rounded-full transition-colors"
                                                    title="Edit Batch"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                            )}
                                            {!isDataEntry && (
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
                                            <span className="text-gray-700 font-medium">{batch.initial_birds}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="flex items-center gap-2 text-gray-500"><span className="text-amber-500 w-3.5 flex justify-center text-xs font-bold">#</span> Current Count</span>
                                            <span className="text-gray-700 font-medium">
                                                {batch.analytics && batch.analytics.totalMortality !== undefined
                                                    ? Math.max(0, batch.initial_birds - batch.analytics.totalMortality)
                                                    : batch.current_birds}
                                            </span>
                                        </div>
                                        {!isDataEntry && (
                                            <>
                                                <div className="flex justify-between pt-2">
                                                    <span className="flex items-center gap-2 text-gray-500"><span className="text-amber-500 w-3.5 flex justify-center text-xs">📉</span> Mortality</span>
                                                    <span className="text-gray-600 font-medium">{batch.analytics?.totalMortality || 0} ({batch.analytics?.mortalityRate || 0}%)</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="flex items-center gap-2 text-gray-500"><span className="text-amber-500 w-3.5 flex justify-center text-xs">⚖️</span> FCR</span>
                                                    <span className="text-gray-600 font-medium">{batch.analytics?.fcr || '0'}</span>
                                                </div>
                                            </>
                                        )}
                                        {!isDataEntry && (
                                            <div className="flex justify-between pb-4 border-b border-gray-100">
                                                <span className="flex items-center gap-2 text-gray-500"><span className="text-amber-500 w-3.5 flex justify-center text-xs">💵</span> Net Profit</span>
                                                <span className="text-green-600 font-bold">{formatCurrency(financials.netProfit)}</span>
                                            </div>
                                        )}
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
                onClick={openCreateModal}
                className="fixed bottom-20 right-4 bg-amber-500 hover:bg-amber-600 text-black font-semibold px-4 py-3 rounded-full shadow-lg flex items-center gap-2 transition-transform transform active:scale-95 z-50"
            >
                <Plus size={20} /> New Batch
            </button>

            {/* Add Batch Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-xl p-5 shadow-2xl animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:fade-in">
                        <div className="flex justify-between items-center mb-5 border-b border-gray-100 pb-3">
                            <h2 className="text-xl font-bold text-gray-900">{editingBatchId ? 'Edit Batch' : 'Add New Batch'}</h2>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-700 p-1">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateBatch} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Batch Name</label>
                                <input 
                                    type="text" 
                                    required
                                    placeholder="e.g. 2nd Batch"
                                    className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                                    value={batchName} 
                                    onChange={(e) => setBatchName(e.target.value)} 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Initial Bird Count</label>
                                <input 
                                    type="number" 
                                    min="1"
                                    required
                                    className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                                    value={initialBirds} 
                                    onChange={(e) => setInitialBirds(e.target.value)} 
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Breed</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. Broiler / Cobb 500"
                                        className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                                        value={breed} 
                                        onChange={(e) => setBreed(e.target.value)} 
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. Grower"
                                        className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                                        value={stage} 
                                        onChange={(e) => setStage(e.target.value)} 
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Raised For</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. Others"
                                    className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                                    value={raisedFor} 
                                    onChange={(e) => setRaisedFor(e.target.value)} 
                                />
                            </div>
                            
                            <button 
                                type="submit" 
                                className="w-full bg-amber-500 text-black font-bold py-3 mt-2 rounded-lg hover:bg-amber-600 transition-colors"
                            >
                                {editingBatchId ? 'Update Batch' : 'Create Batch'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
