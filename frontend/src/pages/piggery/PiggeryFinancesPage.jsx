import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { DollarSign, Plus, ArrowUpRight, ArrowDownRight, X, Edit2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { piggeryApi } from '../../features/piggery/piggeryApi';
import { useAuthStore, isRecordRecentlyCreated, isRecordApprovedForEdit } from '../../store/authStore';

export default function PiggeryFinancesPage() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [editingIncome, setEditingIncome] = useState(null);
    const { user, createdRecords, approvedEditRecords, addCreatedRecord } = useAuthStore();
    const isDataEntry = user?.role === 'manager';

    const [paymentFilter, setPaymentFilter] = useState('');

    const { data: summaryResp } = useQuery({ queryKey: ['pig-summary'], queryFn: piggeryApi.getSummary });
    const { data: expResp, isLoading: loadExp } = useQuery({ queryKey: ['pig-expenses', paymentFilter], queryFn: () => piggeryApi.getExpenses(paymentFilter ? { paymentMethod: paymentFilter } : {}) });
    const { data: incResp, isLoading: loadInc } = useQuery({ queryKey: ['pig-incomes', paymentFilter], queryFn: () => piggeryApi.getIncomes(paymentFilter ? { paymentMethod: paymentFilter } : {}) });
    const { data: batchesResp } = useQuery({ queryKey: ['pig-batches'], queryFn: piggeryApi.getBatches });

    let expenses = Array.isArray(expResp?.data?.data) ? expResp.data.data : (Array.isArray(expResp?.data) ? expResp.data : []);
    let incomes = Array.isArray(incResp?.data?.data) ? incResp.data.data : (Array.isArray(incResp?.data) ? incResp.data : []);
    const batches = Array.isArray(batchesResp?.data?.data) ? batchesResp.data.data : (Array.isArray(batchesResp?.data) ? batchesResp.data : []);

    if (isDataEntry) {
        expenses = expenses.filter(e => isRecordRecentlyCreated(e, createdRecords) || isRecordApprovedForEdit(e, approvedEditRecords));
        incomes = incomes.filter(i => isRecordRecentlyCreated(i, createdRecords) || isRecordApprovedForEdit(i, approvedEditRecords));
    }
    const activeBatches = batches.filter(b => b.status === 'active');
    const summary = summaryResp?.data || { totalExpenses: 0, totalIncomes: 0 };
    const netProfit = summary.totalIncomes - summary.totalExpenses;

    const { register: regExp, handleSubmit: handleExp, reset: resetExp } = useForm();
    const { register: regInc, handleSubmit: handleInc, reset: resetInc } = useForm();

    const addExp = useMutation({
        mutationFn: piggeryApi.createExpense,
        onSuccess: (res) => {
            if (res?.data?._id || res?._id) {
                addCreatedRecord(res.data?._id || res._id);
            } else if (res?.data?.data?._id) {
                addCreatedRecord(res.data.data._id);
            }
            queryClient.invalidateQueries(['pig-expenses']);
            queryClient.invalidateQueries(['pig-summary']);
            setIsExpenseModalOpen(false);
            resetExp();
            Swal.fire({
                title: 'Success!',
                text: 'Expense recorded successfully!',
                icon: 'success',
                confirmButtonColor: '#3085d6',
            });
        }
    });

    const addInc = useMutation({
        mutationFn: piggeryApi.createIncome,
        onSuccess: (res) => {
            if (res?.data?._id || res?._id) {
                addCreatedRecord(res.data?._id || res._id);
            } else if (res?.data?.data?._id) {
                addCreatedRecord(res.data.data._id);
            }
            queryClient.invalidateQueries(['pig-incomes']);
            queryClient.invalidateQueries(['pig-summary']);
            setIsIncomeModalOpen(false);
            resetInc();
            Swal.fire({
                title: 'Success!',
                text: 'Income recorded successfully!',
                icon: 'success',
                confirmButtonColor: '#3085d6',
            });
        }
    });

    const updateExp = useMutation({
        mutationFn: async (data) => {
            const res = await api.put(`/piggery/expenses/${data._id}`, data);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['pig-expenses']);
            queryClient.invalidateQueries(['pig-summary']);
            setIsExpenseModalOpen(false);
            setEditingExpense(null);
            resetExp();
            toast.success('Expense updated successfully');
        }
    });

    const updateInc = useMutation({
        mutationFn: async (data) => {
            const res = await api.put(`/piggery/incomes/${data._id}`, data);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['pig-incomes']);
            queryClient.invalidateQueries(['pig-summary']);
            setIsIncomeModalOpen(false);
            setEditingIncome(null);
            resetInc();
            toast.success('Income updated successfully');
        }
    });

    const deleteExp = useMutation({
        mutationFn: piggeryApi.deleteExpense,
        onSuccess: () => {
            queryClient.invalidateQueries(['pig-expenses']);
            queryClient.invalidateQueries(['pig-summary']);
            toast.success('Expense deleted successfully');
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || 'Failed to delete expense');
        }
    });

    const deleteInc = useMutation({
        mutationFn: piggeryApi.deleteIncome,
        onSuccess: () => {
            queryClient.invalidateQueries(['pig-incomes']);
            queryClient.invalidateQueries(['pig-summary']);
            toast.success('Income deleted successfully');
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || 'Failed to delete income');
        }
    });

    const handleDeleteInc = (row, e) => {
        e.stopPropagation();
        if (window.confirm(`Are you sure you want to delete this income: ${row.category} (Rs. ${row.amount})?`)) {
            deleteInc.mutate(row._id);
        }
    };

    const handleDeleteExp = (row, e) => {
        e.stopPropagation();
        if (window.confirm(`Are you sure you want to delete this expense: ${row.category} (Rs. ${row.amount})?`)) {
            deleteExp.mutate(row._id);
        }
    };

    const openEditInc = (row, e) => {
        e.stopPropagation();
        setEditingIncome(row);
        resetInc({
            date: new Date(row.date).toISOString().split('T')[0],
            category: row.category,
            paymentMethod: row.paymentMethod,
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
            paymentMethod: row.paymentMethod,
            batch_id: row.batch_id?._id || row.batch_id || '',
            amount: row.amount,
            description: row.description
        });
        setIsExpenseModalOpen(true);
    };

    const onIncSubmit = (data) => {
        const payload = { ...data, amount: Number(data.amount) };
        if (!payload.batch_id || payload.batch_id === '' || payload.batch_id === 'none') {
            delete payload.batch_id;
        }
        if (editingIncome) {
            updateInc.mutate({ ...payload, _id: editingIncome._id });
        } else {
            addInc.mutate(payload);
        }
    };

    const onExpSubmit = (data) => {
        const payload = { ...data, amount: Number(data.amount) };
        if (!payload.batch_id || payload.batch_id === '' || payload.batch_id === 'none') {
            delete payload.batch_id;
        }
        if (editingExpense) {
            updateExp.mutate({ ...payload, _id: editingExpense._id });
        } else {
            addExp.mutate(payload);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-4">
                <PageHeader title="Piggery Finances" description="Track incomes and expenses (Feed, Medicine, Maintenance, etc.)" />
                <Select
                    value={paymentFilter}
                    onChange={(e) => setPaymentFilter(e.target.value)}
                    className="w-full md:w-48 bg-white"
                >
                    <option value="">All Payment Methods</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Credit">Credit</option>
                </Select>
            </div>
            
            {!isDataEntry && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="p-6">
                        <p className="text-sm font-medium text-gray-500">Total Income</p>
                        <p className="text-2xl font-bold text-green-600">Rs. {summary.totalIncomes.toLocaleString()}</p>
                    </Card>
                    <Card className="p-6">
                        <p className="text-sm font-medium text-gray-500">Total Expenses</p>
                        <p className="text-2xl font-bold text-red-600">Rs. {summary.totalExpenses.toLocaleString()}</p>
                    </Card>
                    <Card className="p-6 border-t-4 border-t-primary-500">
                        <p className="text-sm font-medium text-gray-500">Net Profit / Loss</p>
                        <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            Rs. {netProfit.toLocaleString()}
                        </p>
                    </Card>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Incomes */}
                <Card className="p-4">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold flex items-center text-green-600"><ArrowUpRight className="mr-2" /> Incomes</h3>
                        <Button size="sm" onClick={() => setIsIncomeModalOpen(true)}>Add Income</Button>
                    </div>
                    <Table
                        columns={[
                            { label: 'Date', key: 'date', render: (row) => format(new Date(row.date), 'MMM dd') },
                            { label: 'Category', key: 'category' },
                            { label: 'Batch', key: 'batch_id', render: (row) => row.batch_id?.batch_number || '-' },
                            { label: 'Method', key: 'paymentMethod', render: (row) => (
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${row.paymentMethod === 'Cash' ? 'bg-green-100 text-green-800' : row.paymentMethod === 'Cheque' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>
                                    {row.paymentMethod || 'Cash'}
                                </span>
                            ) },
                            { label: 'Description', key: 'description' },
                            { label: 'Amount (Rs)', key: 'amount', render: (row) => row.amount.toLocaleString() },
                            { 
                                label: '', 
                                key: 'actions', 
                                render: (row) => (
                                    (!isDataEntry || isRecordApprovedForEdit(row, approvedEditRecords, createdRecords)) ? (
                                        <div className="flex items-center gap-2">
                                            <button onClick={(e) => openEditInc(row, e)} className="text-blue-500 hover:text-blue-700" title="Edit Income">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={(e) => handleDeleteInc(row, e)} className="text-red-500 hover:text-red-700" title="Delete Income">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ) : null
                                ) 
                            }
                        ]}
                        data={incomes}
                        isLoading={loadInc}
                    />
                </Card>

                {/* Expenses */}
                <Card className="p-4">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold flex items-center text-red-600"><ArrowDownRight className="mr-2" /> Expenses</h3>
                        <Button size="sm" onClick={() => setIsExpenseModalOpen(true)}>Add Expense</Button>
                    </div>
                    <Table
                        columns={[
                            { label: 'Date', key: 'date', render: (row) => format(new Date(row.date), 'MMM dd') },
                            { label: 'Category', key: 'category' },
                            { label: 'Batch', key: 'batch_id', render: (row) => row.batch_id?.batch_number || '-' },
                            { label: 'Method', key: 'paymentMethod', render: (row) => (
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${row.paymentMethod === 'Cash' ? 'bg-green-100 text-green-800' : row.paymentMethod === 'Cheque' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>
                                    {row.paymentMethod || 'Cash'}
                                </span>
                            ) },
                            { label: 'Description', key: 'description' },
                            { label: 'Amount (Rs)', key: 'amount', render: (row) => row.amount.toLocaleString() },
                            { 
                                label: '', 
                                key: 'actions', 
                                render: (row) => (
                                    (!isDataEntry || isRecordApprovedForEdit(row, approvedEditRecords, createdRecords)) ? (
                                        <div className="flex items-center gap-2">
                                            <button onClick={(e) => openEditExp(row, e)} className="text-blue-500 hover:text-blue-700" title="Edit Expense">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={(e) => handleDeleteExp(row, e)} className="text-red-500 hover:text-red-700" title="Delete Expense">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ) : null
                                ) 
                            }
                        ]}
                        data={expenses}
                        isLoading={loadExp}
                    />
                </Card>
            </div>

            {/* Record Income Modal */}
            {isIncomeModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-xl p-5 shadow-2xl animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:fade-in">
                        <div className="flex justify-between items-center mb-5 border-b border-gray-100 pb-3">
                            <h2 className="text-xl font-bold text-gray-900">{editingIncome ? 'Edit Income' : 'Record Income'}</h2>
                            <button type="button" onClick={() => { setIsIncomeModalOpen(false); setEditingIncome(null); resetInc(); }} className="text-gray-400 hover:text-gray-700 p-1">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleInc(onIncSubmit)} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                <input type="date" required {...regInc('date', { required: true })} className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                <select required {...regInc('category', { required: true })} className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all">
                                    <option value="Pork Sale">Pork Sale</option>
                                    <option value="Live Pig Sale">Live Pig Sale</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                                <select required {...regInc('paymentMethod', { required: true })} className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all">
                                    <option value="Cash">Cash</option>
                                    <option value="Cheque">Cheque</option>
                                    <option value="Credit">Credit</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Related Batch (Optional)</label>
                                <select {...regInc('batch_id')} className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all">
                                    <option value="">None / General</option>
                                    {activeBatches.map(b => (
                                        <option key={b._id} value={b._id}>{b.batch_number}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (Rs)</label>
                                <input type="number" min="0" required {...regInc('amount', { required: true })} className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <input type="text" required {...regInc('description', { required: true })} className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" />
                            </div>

                            <button type="submit" disabled={addInc.isPending || updateInc.isPending} className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold p-3 rounded-lg transition-colors flex justify-center items-center">
                                {addInc.isPending || updateInc.isPending ? 'Saving...' : (editingIncome ? 'Update Income' : 'Save Income')}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Record Expense Modal */}
            {isExpenseModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-xl p-5 shadow-2xl animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:fade-in">
                        <div className="flex justify-between items-center mb-5 border-b border-gray-100 pb-3">
                            <h2 className="text-xl font-bold text-gray-900">{editingExpense ? 'Edit Expense' : 'Record Expense'}</h2>
                            <button type="button" onClick={() => { setIsExpenseModalOpen(false); setEditingExpense(null); resetExp(); }} className="text-gray-400 hover:text-gray-700 p-1">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleExp(onExpSubmit)} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                <input type="date" required {...regExp('date', { required: true })} className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                <select required {...regExp('category', { required: true })} className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all">
                                    <option value="Feed">Feed</option>
                                    <option value="Medicine">Medicine</option>
                                    <option value="Maintenance">Maintenance</option>
                                    <option value="Transport">Transport</option>
                                    <option value="Salary">Salary</option>
                                    <option value="Fuel">Fuel</option>
                                    <option value="Labor">Labor</option>
                                    <option value="Utility">Utility</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                                <select required {...regExp('paymentMethod', { required: true })} className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all">
                                    <option value="Cash">Cash</option>
                                    <option value="Cheque">Cheque</option>
                                    <option value="Credit">Credit</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Related Batch (Optional)</label>
                                <select {...regExp('batch_id')} className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all">
                                    <option value="">None / General</option>
                                    {activeBatches.map(b => (
                                        <option key={b._id} value={b._id}>{b.batch_number}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (Rs)</label>
                                <input type="number" min="0" required {...regExp('amount', { required: true })} className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <input type="text" required {...regExp('description', { required: true })} className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" />
                            </div>

                            <button type="submit" disabled={addExp.isPending || updateExp.isPending} className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold p-3 rounded-lg transition-colors flex justify-center items-center">
                                {addExp.isPending || updateExp.isPending ? 'Saving...' : (editingExpense ? 'Update Expense' : 'Save Expense')}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

