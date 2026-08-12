import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { DollarSign, Plus, ArrowUpRight, ArrowDownRight, X, Edit2, Trash2, Key, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

import api from '../../api/axios';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Select from '../../components/ui/Select';
import { useAuthStore, isRecordRecentlyCreated, isRecordApprovedForEdit } from '../../store/authStore';

export default function PoultryFinancesPage() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    
    // Modal states
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    
    const [editingExpense, setEditingExpense] = useState(null);
    const [editingIncome, setEditingIncome] = useState(null);
    const [requestTargetRecord, setRequestTargetRecord] = useState(null);
    const [requestReason, setRequestReason] = useState('');
    const [submittingRequest, setSubmittingRequest] = useState(false);

    // Filters
    const [paymentFilter, setPaymentFilter] = useState('');
    const [batchFilter, setBatchFilter] = useState('all');

    const { user, createdRecords, approvedEditRecords, addCreatedRecord, addApprovedEditRecord } = useAuthStore();
    const isDataEntry = user?.role === 'manager';

    // Query Manager's own edit requests to automatically sync approved requests
    const { data: myRequestsResp } = useQuery({
        queryKey: ['my-edit-requests-poultry'],
        queryFn: () => api.get('/edit-requests/my').then(res => res.data),
        enabled: !!isDataEntry,
        refetchInterval: 3000 // Poll every 3 seconds for live Admin approval updates
    });

    useEffect(() => {
        if (!isDataEntry) return;
        const requests = Array.isArray(myRequestsResp?.data) ? myRequestsResp.data : [];
        requests.forEach(req => {
            if (req.status === 'approved' && req.approvedAt) {
                const approvedTs = new Date(req.approvedAt).getTime();
                if (Date.now() - approvedTs <= 5 * 60 * 1000) {
                    if (req.referenceString) {
                        addApprovedEditRecord(req.referenceString, approvedTs);
                    }
                    if (req.approvedRecordId) {
                        addApprovedEditRecord(req.approvedRecordId, approvedTs);
                    }
                }
            }
        });
    }, [myRequestsResp, isDataEntry, addApprovedEditRecord]);

    // Queries
    const { data: summaryResp } = useQuery({ 
        queryKey: ['poultry-summary'], 
        queryFn: () => api.get('/poultry/summary').then(res => res.data)
    });
    
    const { data: txResp, isLoading: loadTx } = useQuery({ 
        queryKey: ['poultry-transactions', batchFilter, paymentFilter], 
        queryFn: () => api.get(`/poultry/transactions?batch_id=${batchFilter}${paymentFilter ? `&paymentMethod=${paymentFilter}` : ''}`).then(res => res.data)
    });
    
    const { data: batchesResp } = useQuery({ 
        queryKey: ['poultry-batches'], 
        queryFn: () => api.get('/poultry/batches').then(res => res.data)
    });

    let transactions = Array.isArray(txResp?.data) ? txResp.data : [];
    if (isDataEntry) {
        transactions = transactions.filter(t => isRecordRecentlyCreated(t, createdRecords) || isRecordApprovedForEdit(t, approvedEditRecords));
    }
    const batches = Array.isArray(batchesResp?.data) ? batchesResp.data : [];
    const activeBatches = batches.filter(b => b.status === 'active' || !b.status);

    const expenses = transactions.filter(t => t.type === 'expense');
    const incomes = transactions.filter(t => t.type === 'income');

    const summary = summaryResp?.data || {
        totalIncome: incomes.reduce((s, t) => s + t.amount, 0),
        totalExpense: expenses.reduce((s, t) => s + t.amount, 0),
        netProfit: incomes.reduce((s, t) => s + t.amount, 0) - expenses.reduce((s, t) => s + t.amount, 0),
        activeBatchesCount: activeBatches.length
    };

    const { register: regExp, handleSubmit: handleExp, reset: resetExp } = useForm();
    const { register: regInc, handleSubmit: handleInc, reset: resetInc } = useForm();

    // Mutations
    const createTxMutation = useMutation({
        mutationFn: (data) => api.post('/poultry/transactions', data),
        onSuccess: (res) => {
            const createdId = res.data?.data?._id || res.data?._id;
            if (createdId && addCreatedRecord) {
                addCreatedRecord(createdId);
            }
            queryClient.invalidateQueries(['poultry-transactions']);
            queryClient.invalidateQueries(['poultry-summary']);
            queryClient.invalidateQueries(['poultry-batches']);
            setIsExpenseModalOpen(false);
            setIsIncomeModalOpen(false);
            resetExp();
            resetInc();
            Swal.fire({
                title: 'Success!',
                text: 'Transaction recorded successfully!',
                icon: 'success',
                confirmButtonColor: '#3085d6',
            });
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || 'Failed to record transaction');
        }
    });

    const updateTxMutation = useMutation({
        mutationFn: ({ id, data }) => api.put(`/poultry/transactions/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['poultry-transactions']);
            queryClient.invalidateQueries(['poultry-summary']);
            queryClient.invalidateQueries(['poultry-batches']);
            setIsExpenseModalOpen(false);
            setIsIncomeModalOpen(false);
            setEditingExpense(null);
            setEditingIncome(null);
            resetExp();
            resetInc();
            toast.success('Transaction updated successfully');
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || 'Failed to update transaction');
        }
    });

    const deleteTxMutation = useMutation({
        mutationFn: (id) => api.delete(`/poultry/transactions/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries(['poultry-transactions']);
            queryClient.invalidateQueries(['poultry-summary']);
            queryClient.invalidateQueries(['poultry-batches']);
            toast.success('Transaction deleted successfully');
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || 'Failed to delete transaction');
        }
    });

    const openEditInc = (row, e) => {
        e.stopPropagation();
        setEditingIncome(row);
        resetInc({
            date: new Date(row.date).toISOString().split('T')[0],
            category: row.category,
            paymentMethod: row.paymentMethod || 'Cash',
            batch_id: row.batch_id?._id || row.batch_id || '',
            amount: row.amount,
            description: row.description
        });
        setIsIncomeModalOpen(true);
    };

    const openEditExp = (row, e) => {
        e.stopPropagation();
        setEditingExpense(row);
        resetExp({
            date: new Date(row.date).toISOString().split('T')[0],
            category: row.category,
            paymentMethod: row.paymentMethod || 'Cash',
            batch_id: row.batch_id?._id || row.batch_id || '',
            amount: row.amount,
            description: row.description
        });
        setIsExpenseModalOpen(true);
    };

    const handleDelete = (row, e) => {
        e.stopPropagation();
        Swal.fire({
            title: 'Delete Transaction?',
            text: `Are you sure you want to delete ${row.category} (${row.amount} LKR)?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.isConfirmed) {
                deleteTxMutation.mutate(row._id);
            }
        });
    };

    const openRequestEdit = (row, e) => {
        e.stopPropagation();
        setRequestTargetRecord(row);
        setRequestReason('');
        setIsRequestModalOpen(true);
    };

    const handleSendEditRequest = async (e) => {
        e.preventDefault();
        if (!requestReason.trim()) {
            toast.error('Please enter a reason for your edit request');
            return;
        }

        try {
            setSubmittingRequest(true);
            const refStr = requestTargetRecord?._id
                ? `Poultry Transaction - ${requestTargetRecord?.category} (${requestTargetRecord?.amount} LKR, Batch: ${requestTargetRecord?.batch_id?.batch_name || 'General'}) [ID: ${requestTargetRecord?._id}]`
                : `Poultry Batch Finance Edit Request - Batch: ${requestTargetRecord?.selectedBatchName || 'General'} (${requestTargetRecord?.customRef || 'Previous Record'})`;
            
            await api.post('/edit-requests', {
                moduleName: 'Poultry Transaction',
                referenceString: refStr,
                reason: requestReason
            });

            Swal.fire({
                title: 'Request Sent!',
                text: 'Edit approval request sent to Admin. Once approved, you will gain 5 minutes edit access.',
                icon: 'success',
                confirmButtonColor: '#3085d6',
            });

            setIsRequestModalOpen(false);
            setRequestTargetRecord(null);
            setRequestReason('');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to submit edit request');
        } finally {
            setSubmittingRequest(false);
        }
    };

    const onIncSubmit = (formData) => {
        const payload = {
            ...formData,
            type: 'income',
            amount: Number(formData.amount)
        };
        if (editingIncome) {
            updateTxMutation.mutate({ id: editingIncome._id, data: payload });
        } else {
            createTxMutation.mutate(payload);
        }
    };

    const onExpSubmit = (formData) => {
        const payload = {
            ...formData,
            type: 'expense',
            amount: Number(formData.amount)
        };
        if (editingExpense) {
            updateTxMutation.mutate({ id: editingExpense._id, data: payload });
        } else {
            createTxMutation.mutate(payload);
        }
    };

    const canEditRecord = (row) => {
        if (!isDataEntry) return true; // Admins / MDs have full edit access
        return isRecordRecentlyCreated(row, createdRecords) || isRecordApprovedForEdit(row, approvedEditRecords);
    };

    return (
        <div className="space-y-6 pb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <PageHeader 
                    title="Poultry Batch Expenses & Income" 
                    description="Manage batch-wise revenues and costs for all poultry batches" 
                />
                
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">


                    <Select
                        value={batchFilter}
                        onChange={(e) => setBatchFilter(e.target.value)}
                        className="bg-white min-w-[160px]"
                    >
                        <option value="all">All Poultry Batches</option>
                        {batches.map(b => (
                            <option key={b._id} value={b._id}>{b.batch_name || b.batch_number}</option>
                        ))}
                    </Select>

                    <Select
                        value={paymentFilter}
                        onChange={(e) => setPaymentFilter(e.target.value)}
                        className="bg-white min-w-[140px]"
                    >
                        <option value="">All Payment Methods</option>
                        <option value="Cash">Cash</option>
                        <option value="Cheque">Cheque</option>
                        <option value="Credit">Credit</option>
                    </Select>
                </div>
            </div>



            {/* Incomes and Expenses Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Incomes */}
                <Card className="p-5 shadow-sm border border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-green-500"></span> Batch Incomes
                            </h3>
                            <p className="text-xs text-gray-500">Sale of birds, manure, eggs, etc.</p>
                        </div>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-1" onClick={() => setIsIncomeModalOpen(true)}>
                            <Plus size={16} /> Add Income
                        </Button>
                    </div>

                    <Table
                        columns={[
                            { label: 'Date', key: 'date', render: (row) => <span className="whitespace-nowrap">{format(new Date(row.date), 'MMM dd, yyyy')}</span> },
                            { label: 'Category', key: 'category', render: (row) => <span className="font-semibold text-gray-800 whitespace-nowrap">{row.category}</span> },
                            { label: 'Batch', key: 'batch_id', render: (row) => (
                                <span className="px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-200 whitespace-nowrap inline-block">
                                    {row.batch_id?.batch_name || 'General'}
                                </span>
                            ) },
                            { label: 'Method', key: 'paymentMethod', render: (row) => (
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${row.paymentMethod === 'Cash' ? 'bg-green-100 text-green-800' : row.paymentMethod === 'Cheque' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>
                                    {row.paymentMethod || 'Cash'}
                                </span>
                            ) },
                            { label: 'Description', key: 'description', render: (row) => <span className="text-xs text-gray-600 truncate max-w-[120px] block">{row.description}</span> },
                            { label: 'Amount (LKR)', key: 'amount', render: (row) => <span className="font-bold text-green-600 whitespace-nowrap">+{row.amount.toLocaleString()}</span> },
                            { 
                                label: 'Action', 
                                key: 'actions', 
                                render: (row) => {
                                    const editable = canEditRecord(row);
                                    if (editable) {
                                        return (
                                            <div className="flex items-center gap-2">
                                                <button onClick={(e) => openEditInc(row, e)} className="text-blue-600 hover:text-blue-800 p-1" title="Edit Record">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={(e) => handleDelete(row, e)} className="text-red-600 hover:text-red-800 p-1" title="Delete Record">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        );
                                    }
                                    return (
                                        <button 
                                            onClick={(e) => openRequestEdit(row, e)} 
                                            className="inline-flex items-center gap-1 text-xs bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-300 px-2 py-1 rounded font-medium transition-colors whitespace-nowrap" 
                                            title="5min passed. Request Admin Edit Access"
                                        >
                                            <Key size={12} /> Request Edit
                                        </button>
                                    );
                                } 
                            }
                        ]}
                        data={incomes}
                        isLoading={loadTx}
                    />
                </Card>

                {/* Expenses */}
                <Card className="p-5 shadow-sm border border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-red-500"></span> Batch Expenses
                            </h3>
                            <p className="text-xs text-gray-500">Chicks, Feed, Vaccines, Transport, Labor, etc.</p>
                        </div>
                        <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-1" onClick={() => setIsExpenseModalOpen(true)}>
                            <Plus size={16} /> Add Expense
                        </Button>
                    </div>

                    <Table
                        columns={[
                            { label: 'Date', key: 'date', render: (row) => <span className="whitespace-nowrap">{format(new Date(row.date), 'MMM dd, yyyy')}</span> },
                            { label: 'Category', key: 'category', render: (row) => <span className="font-semibold text-gray-800 whitespace-nowrap">{row.category}</span> },
                            { label: 'Batch', key: 'batch_id', render: (row) => (
                                <span className="px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-200 whitespace-nowrap inline-block">
                                    {row.batch_id?.batch_name || 'General'}
                                </span>
                            ) },
                            { label: 'Method', key: 'paymentMethod', render: (row) => (
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${row.paymentMethod === 'Cash' ? 'bg-green-100 text-green-800' : row.paymentMethod === 'Cheque' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>
                                    {row.paymentMethod || 'Cash'}
                                </span>
                            ) },
                            { label: 'Description', key: 'description', render: (row) => <span className="text-xs text-gray-600 truncate max-w-[120px] block">{row.description}</span> },
                            { label: 'Amount (LKR)', key: 'amount', render: (row) => <span className="font-bold text-red-600 whitespace-nowrap">-{row.amount.toLocaleString()}</span> },
                            { 
                                label: 'Action', 
                                key: 'actions', 
                                render: (row) => {
                                    const editable = canEditRecord(row);
                                    if (editable) {
                                        return (
                                            <div className="flex items-center gap-2">
                                                <button onClick={(e) => openEditExp(row, e)} className="text-blue-600 hover:text-blue-800 p-1" title="Edit Record">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={(e) => handleDelete(row, e)} className="text-red-600 hover:text-red-800 p-1" title="Delete Record">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        );
                                    }
                                    return (
                                        <button 
                                            onClick={(e) => openRequestEdit(row, e)} 
                                            className="inline-flex items-center gap-1 text-xs bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-300 px-2 py-1 rounded font-medium transition-colors" 
                                            title="5min passed. Request Admin Edit Access"
                                        >
                                            <Key size={12} /> Request Edit
                                        </button>
                                    );
                                } 
                            }
                        ]}
                        data={expenses}
                        isLoading={loadTx}
                    />
                </Card>
            </div>

            {/* Income Modal */}
            {isIncomeModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-5 border-b border-gray-100 pb-3">
                            <h2 className="text-xl font-bold text-gray-900">{editingIncome ? 'Edit Poultry Income' : 'Record Poultry Income'}</h2>
                            <button type="button" onClick={() => { setIsIncomeModalOpen(false); setEditingIncome(null); resetInc(); }} className="text-gray-400 hover:text-gray-700 p-1">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleInc(onIncSubmit)} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Select Batch</label>
                                <select required {...regInc('batch_id', { required: true })} className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-1 focus:ring-amber-500 outline-none">
                                    <option value="" disabled>Select a Poultry Batch</option>
                                    {batches.map(b => (
                                        <option key={b._id} value={b._id}>{b.batch_name || b.batch_number}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Income Category</label>
                                <select required {...regInc('category', { required: true })} className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-1 focus:ring-amber-500 outline-none">
                                    <option value="Sale of Animals/Birds">Sale of Animals/Birds</option>
                                    <option value="Manure Sale">Manure Sale</option>
                                    <option value="Eggs Sale">Eggs Sale</option>
                                    <option value="Empty Bag Sale">Empty Bag Sale</option>
                                    <option value="Other Income">Other Income</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                                <select required {...regInc('paymentMethod', { required: true })} className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-1 focus:ring-amber-500 outline-none">
                                    <option value="Cash">Cash</option>
                                    <option value="Cheque">Cheque</option>
                                    <option value="Credit">Credit</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (LKR)</label>
                                <input type="number" min="1" required {...regInc('amount', { required: true })} className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-1 focus:ring-amber-500 outline-none" placeholder="e.g. 50000" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <input type="text" required {...regInc('description', { required: true })} className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-1 focus:ring-amber-500 outline-none" placeholder="e.g. Sold 200 birds" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                <input type="date" required {...regInc('date', { required: true })} className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-1 focus:ring-amber-500 outline-none" />
                            </div>

                            <button type="submit" disabled={createTxMutation.isPending || updateTxMutation.isPending} className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-bold p-3 rounded-lg transition-colors flex justify-center items-center">
                                {createTxMutation.isPending || updateTxMutation.isPending ? 'Saving...' : (editingIncome ? 'Update Income' : 'Save Income')}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Expense Modal */}
            {isExpenseModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-5 border-b border-gray-100 pb-3">
                            <h2 className="text-xl font-bold text-gray-900">{editingExpense ? 'Edit Poultry Expense' : 'Record Poultry Expense'}</h2>
                            <button type="button" onClick={() => { setIsExpenseModalOpen(false); setEditingExpense(null); resetExp(); }} className="text-gray-400 hover:text-gray-700 p-1">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleExp(onExpSubmit)} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Select Batch</label>
                                <select required {...regExp('batch_id', { required: true })} className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-1 focus:ring-amber-500 outline-none">
                                    <option value="" disabled>Select a Poultry Batch</option>
                                    {batches.map(b => (
                                        <option key={b._id} value={b._id}>{b.batch_name || b.batch_number}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Expense Category</label>
                                <select required {...regExp('category', { required: true })} className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-1 focus:ring-amber-500 outline-none">
                                    <option value="Animal/Bird Purchase">Animal/Bird Purchase</option>
                                    <option value="Feed Purchase">Feed Purchase</option>
                                    <option value="Medicine & Vaccines">Medicine & Vaccines</option>
                                    <option value="Transport">Transport</option>
                                    <option value="Labor">Labor</option>
                                    <option value="Equipment & Maintenance">Equipment & Maintenance</option>
                                    <option value="Utility (Water/Electricity)">Utility (Water/Electricity)</option>
                                    <option value="Other Expense">Other Expense</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                                <select required {...regExp('paymentMethod', { required: true })} className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-1 focus:ring-amber-500 outline-none">
                                    <option value="Cash">Cash</option>
                                    <option value="Cheque">Cheque</option>
                                    <option value="Credit">Credit</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (LKR)</label>
                                <input type="number" min="1" required {...regExp('amount', { required: true })} className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-1 focus:ring-amber-500 outline-none" placeholder="e.g. 25000" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <input type="text" required {...regExp('description', { required: true })} className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-1 focus:ring-amber-500 outline-none" placeholder="e.g. Starter Feed 50 bags" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                <input type="date" required {...regExp('date', { required: true })} className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-1 focus:ring-amber-500 outline-none" />
                            </div>

                            <button type="submit" disabled={createTxMutation.isPending || updateTxMutation.isPending} className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white font-bold p-3 rounded-lg transition-colors flex justify-center items-center">
                                {createTxMutation.isPending || updateTxMutation.isPending ? 'Saving...' : (editingExpense ? 'Update Expense' : 'Save Expense')}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Request Edit Modal */}
            {isRequestModalOpen && requestTargetRecord && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Key className="text-amber-500" size={20} /> Request Admin Edit Access
                            </h2>
                            <button type="button" onClick={() => setIsRequestModalOpen(false)} className="text-gray-400 hover:text-gray-700 p-1">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-xs text-amber-800 space-y-1">
                            <p className="font-semibold flex items-center gap-1">
                                <Clock size={14} /> 5-Minute Edit Window Expired
                            </p>
                            <p>This transaction was added over 5 minutes ago. Submit a request to the Admin to request edit approval.</p>
                        </div>

                        <form onSubmit={handleSendEditRequest} className="space-y-4">
                            {requestTargetRecord?._id ? (
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Record Details</label>
                                    <div className="p-3 bg-gray-50 rounded-lg text-sm border border-gray-200 space-y-1">
                                        <p className="font-bold text-gray-800">{requestTargetRecord.category} ({requestTargetRecord.type})</p>
                                        <p className="text-xs text-gray-600">Batch: {requestTargetRecord.batch_id?.batch_name || 'General'}</p>
                                        <p className="text-xs font-semibold text-amber-600">Amount: LKR {requestTargetRecord.amount?.toLocaleString()}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Poultry Batch</label>
                                        <select
                                            className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-1 focus:ring-amber-500 outline-none text-sm"
                                            onChange={(e) => setRequestTargetRecord(prev => ({ ...prev, selectedBatchName: e.target.options[e.target.selectedIndex].text }))}
                                        >
                                            <option value="">General / All Batches</option>
                                            {batches.map(b => (
                                                <option key={b._id} value={b._id}>{b.batch_name || b.batch_number}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Entry Reference / Details (Optional)</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Sale of Animals/Birds 50,000 LKR"
                                            className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-1 focus:ring-amber-500 outline-none text-sm"
                                            onChange={(e) => setRequestTargetRecord(prev => ({ ...prev, customRef: e.target.value }))}
                                        />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Edit / Correction</label>
                                <textarea
                                    required
                                    rows={3}
                                    value={requestReason}
                                    onChange={(e) => setRequestReason(e.target.value)}
                                    placeholder="Explain why this entry needs editing..."
                                    className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-1 focus:ring-amber-500 outline-none text-sm"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={submittingRequest}
                                className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold p-3 rounded-lg transition-colors flex justify-center items-center"
                            >
                                {submittingRequest ? 'Submitting Request...' : 'Send Request to Admin'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
