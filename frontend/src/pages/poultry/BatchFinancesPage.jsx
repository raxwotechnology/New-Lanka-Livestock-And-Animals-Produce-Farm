import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../../api/axios';
import { toast } from 'react-hot-toast';
import Swal from 'sweetalert2';
import { ChevronLeft, Plus, ArrowUpRight, ArrowDownRight, X, Edit2, Trash2, Key, Clock } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useAuthStore, isRecordRecentlyCreated, isRecordApprovedForEdit } from '../../store/authStore';

export default function BatchFinancesPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const isPiggery = location.pathname.includes('piggery');
    const modulePrefix = isPiggery ? 'piggery' : 'poultry';

    const [batch, setBatch] = useState(null);
    const { user, createdRecords, approvedEditRecords, addCreatedRecord } = useAuthStore();
    const isDataEntry = user?.role === 'manager';
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Modal states
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingTx, setEditingTx] = useState(null);
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [requestTargetRecord, setRequestTargetRecord] = useState(null);
    const [requestReason, setRequestReason] = useState('');
    const [submittingRequest, setSubmittingRequest] = useState(false);

    // Form state
    const [type, setType] = useState('expense');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [paymentFilter, setPaymentFilter] = useState('');

    const fetchData = async () => {
        try {
            const [batchRes, txRes] = await Promise.all([
                api.get(`/${modulePrefix}/batches/${id}`),
                api.get(`/${modulePrefix}/transactions/${id}${paymentFilter ? `?paymentMethod=${paymentFilter}` : ''}`)
            ]);
            
            if (batchRes.data.success) {
                setBatch(batchRes.data.data);
            } else if (batchRes.data && batchRes.data._id) {
                setBatch(batchRes.data);
            }
            
            if (txRes.data.success) {
                setTransactions(txRes.data.data);
            } else if (Array.isArray(txRes.data)) {
                setTransactions(txRes.data);
            }
        } catch (error) {
            toast.error('Failed to load finances');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id, modulePrefix, paymentFilter]);

    const handleSaveTransaction = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                batch_id: id,
                type,
                category,
                description,
                amount: Number(amount),
                date,
                paymentMethod
            };

            let res;
            if (isPiggery) {
                const targetEndpoint = type === 'income' ? 'incomes' : 'expenses';
                if (editingTx) {
                    const oldEndpoint = (editingTx.type || 'expense') === 'income' ? 'incomes' : 'expenses';
                    if (oldEndpoint !== targetEndpoint) {
                        await api.delete(`/piggery/${oldEndpoint}/${editingTx._id}`).catch(() => {});
                        res = await api.post(`/piggery/${targetEndpoint}`, payload);
                    } else {
                        res = await api.put(`/piggery/${targetEndpoint}/${editingTx._id}`, payload);
                    }
                } else {
                    res = await api.post(`/piggery/${targetEndpoint}`, payload);
                }
            } else {
                if (editingTx) {
                    res = await api.put(`/poultry/transactions/${editingTx._id}`, payload);
                } else {
                    res = await api.post(`/poultry/transactions`, payload);
                }
            }

            if (res?.data?.success || res?.data?._id || res?.data?.data?._id) {
                const createdTxId = res.data.data?._id || res.data._id;
                if (!editingTx && createdTxId && addCreatedRecord) {
                    addCreatedRecord(createdTxId);
                }
                Swal.fire({
                    title: 'Success!',
                    text: editingTx ? 'Transaction updated successfully!' : 'Transaction added successfully!',
                    icon: 'success',
                    confirmButtonColor: '#3085d6',
                });
                setIsAddModalOpen(false);
                setEditingTx(null);
                setCategory('');
                setDescription('');
                setAmount('');
                setPaymentMethod('Cash');
                fetchData();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error saving transaction');
        }
    };

    const handleDeleteTransaction = (tx, e) => {
        e.stopPropagation();
        Swal.fire({
            title: 'Delete Transaction?',
            text: `Are you sure you want to delete ${tx.category} (${tx.amount} LKR)?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    if (isPiggery) {
                        const targetEndpoint = (tx.type || 'expense') === 'income' ? 'incomes' : 'expenses';
                        try {
                            await api.delete(`/piggery/${targetEndpoint}/${tx._id}`);
                        } catch (err) {
                            await api.delete(`/piggery/transactions/${tx._id}`);
                        }
                    } else {
                        await api.delete(`/poultry/transactions/${tx._id}`);
                    }
                    toast.success('Transaction deleted successfully');
                    fetchData();
                } catch (err) {
                    toast.error(err.response?.data?.message || 'Failed to delete transaction');
                }
            }
        });
    };

    const openEditModal = (tx, e) => {
        e.stopPropagation();
        setEditingTx(tx);
        setType(tx.type || 'expense');
        setCategory(tx.category || '');
        setDescription(tx.description || '');
        setAmount(tx.amount || '');
        setDate(tx.date ? new Date(tx.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
        setPaymentMethod(tx.paymentMethod || 'Cash');
        setIsAddModalOpen(true);
    };

    const openRequestModal = (tx, e) => {
        e.stopPropagation();
        setRequestTargetRecord(tx);
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
            const refStr = `${isPiggery ? 'Piggery' : 'Poultry'} Transaction - ${requestTargetRecord?.category} (${requestTargetRecord?.amount} LKR) [ID: ${requestTargetRecord?._id}]`;
            
            await api.post('/edit-requests', {
                moduleName: isPiggery ? 'Piggery Transaction' : 'Poultry Transaction',
                referenceString: refStr,
                reason: requestReason
            });

            Swal.fire({
                title: 'Request Sent!',
                text: 'Edit approval request sent to Admin. Once approved, you will get 5 minutes edit access.',
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

    const canEditRecord = (tx) => {
        if (!isDataEntry) return true; // Admins have full access
        return isRecordRecentlyCreated(tx, createdRecords) || isRecordApprovedForEdit(tx, approvedEditRecords);
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading finance details...</div>;
    if (!batch) return null;

    const { financials = {} } = batch;
    const hasFinancials = financials.totalIncome > 0 || financials.totalExpense > 0;
    const data = [
        { name: 'Income', value: financials.totalIncome || 1, color: '#10b981' },
        { name: 'Expense', value: financials.totalExpense || 1, color: '#ef4444' }
    ];

    const formatCurrency = (val) => new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(val || 0);

    return (
        <div className="min-h-screen bg-gray-50 text-gray-800 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200 shadow-sm">
                <button onClick={() => navigate(`/${modulePrefix}/batches/${id}`)} className="text-amber-600 flex items-center gap-1 font-medium hover:text-amber-700">
                    <ChevronLeft size={24} /> Back
                </button>
                <h1 className="text-lg font-semibold text-gray-900 truncate max-w-[180px]">{batch.batch_name || batch.batch_number} Finance</h1>
                <div className="w-16"></div>
            </div>

            <div className="px-4 space-y-4 pt-4">
                {!isDataEntry && (
                    <>
                        <h3 className="text-gray-500 font-semibold text-sm">Financial Summary</h3>
                        
                        {/* Summary Card */}
                        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm flex items-center">
                            <div className="w-20 h-20">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={hasFinancials ? data : [{name: 'Empty', value: 1}]}
                                            innerRadius={20}
                                            outerRadius={30}
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
                                <h3 className="font-semibold text-gray-900 mb-2 text-sm">Finances</h3>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="flex items-center gap-1 text-gray-500"><span className="w-2 h-2 rounded-full bg-green-500"></span> Income</span>
                                    <span className="text-gray-700 font-medium">{formatCurrency(financials.totalIncome)}</span>
                                </div>
                                <div className="flex justify-between text-xs mb-2 border-b border-gray-100 pb-2">
                                    <span className="flex items-center gap-1 text-gray-500"><span className="w-2 h-2 rounded-full bg-red-500"></span> Expense</span>
                                    <span className="text-gray-700 font-medium">-{formatCurrency(financials.totalExpense)}</span>
                                </div>
                                <div className="flex justify-between text-sm font-bold">
                                    <span className="text-gray-800 font-semibold">Net Profit / Loss</span>
                                    <span className={financials.netProfit >= 0 ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                                        {formatCurrency(financials.netProfit)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                <div className="flex justify-between items-center pt-2 pb-2">
                    <h2 className="text-gray-900 font-bold text-base">Transactions History</h2>
                    <div className="flex items-center gap-3">
                        <select 
                            value={paymentFilter}
                            onChange={(e) => setPaymentFilter(e.target.value)}
                            className="bg-white border border-gray-200 text-xs rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-amber-500 outline-none"
                        >
                            <option value="">All Methods</option>
                            <option value="Cash">Cash</option>
                            <option value="Cheque">Cheque</option>
                            <option value="Credit">Credit</option>
                        </select>
                        <span className="text-green-600 font-bold text-sm">
                            {formatCurrency(financials.netProfit)}
                        </span>
                    </div>
                </div>

                {/* Transactions List */}
                <div className="space-y-3">
                    {transactions.length === 0 ? (
                        <div className="text-center text-gray-500 py-8 bg-white rounded-xl border border-gray-200">
                            No transactions recorded for this batch.
                        </div>
                    ) : (
                        transactions.map(tx => {
                            const editable = canEditRecord(tx);
                            return (
                                <div key={tx._id} className="bg-white p-3 rounded-xl flex items-center justify-between shadow-sm border border-gray-200 hover:border-amber-300 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${tx.type === 'expense' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                            {tx.type === 'expense' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                                        </div>
                                        <div>
                                            <div className="text-gray-900 font-bold text-sm capitalize flex items-center gap-2">
                                                {tx.category}
                                                {isDataEntry && editable && (
                                                    <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-normal flex items-center gap-1">
                                                        <Clock size={10} /> 5m Edit Active
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${tx.paymentMethod === 'Cash' ? 'bg-green-100 text-green-800' : tx.paymentMethod === 'Cheque' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>
                                                    {tx.paymentMethod || 'Cash'}
                                                </span>
                                                <span className="text-xs text-gray-500">{tx.description}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 text-right">
                                        <div>
                                            <div className={`font-bold text-sm ${tx.type === 'expense' ? 'text-red-600' : 'text-green-600'}`}>
                                                {tx.type === 'expense' ? '-' : '+'}{formatCurrency(tx.amount)}
                                            </div>
                                            <div className="text-[10px] text-gray-400 mt-0.5">
                                                {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                                            </div>
                                        </div>

                                        {editable ? (
                                            <div className="flex items-center gap-1">
                                                <button onClick={(e) => openEditModal(tx, e)} className="text-blue-600 hover:text-blue-800 p-1" title="Edit Transaction">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={(e) => handleDeleteTransaction(tx, e)} className="text-red-600 hover:text-red-800 p-1" title="Delete Transaction">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ) : (
                                            <button 
                                                onClick={(e) => openRequestModal(tx, e)} 
                                                className="p-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg border border-amber-200 text-xs flex items-center gap-1 font-medium transition-colors"
                                                title="5-minute window passed. Request edit approval from Admin."
                                            >
                                                <Key size={14} /> Request Edit
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Add / Edit Transaction Button */}
            <button 
                onClick={() => {
                    setEditingTx(null);
                    setCategory('');
                    setDescription('');
                    setAmount('');
                    setPaymentMethod('Cash');
                    setIsAddModalOpen(true);
                }}
                className="fixed bottom-20 right-4 bg-amber-500 hover:bg-amber-600 text-black font-bold px-4 py-3 rounded-full shadow-lg flex items-center gap-2 transition-transform transform active:scale-95 z-40"
            >
                <Plus size={20} /> Add Transaction
            </button>

            {/* Add / Edit Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-xl p-5 shadow-2xl animate-in slide-in-from-bottom-4 sm:fade-in">
                        <div className="flex justify-between items-center mb-5 border-b border-gray-100 pb-3">
                            <h2 className="text-xl font-bold text-gray-900">{editingTx ? 'Edit Transaction' : 'Add Transaction'}</h2>
                            <button onClick={() => { setIsAddModalOpen(false); setEditingTx(null); }} className="text-gray-400 hover:text-gray-700 p-1"><X size={20}/></button>
                        </div>
                        <form onSubmit={handleSaveTransaction} className="space-y-4">
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 text-gray-700 font-medium">
                                    <input type="radio" checked={type === 'expense'} onChange={() => setType('expense')} className="text-amber-500 focus:ring-amber-500" /> Expense
                                </label>
                                <label className="flex items-center gap-2 text-gray-700 font-medium">
                                    <input type="radio" checked={type === 'income'} onChange={() => setType('income')} className="text-amber-500 focus:ring-amber-500" /> Income
                                </label>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                <select 
                                    required 
                                    className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-1 focus:ring-amber-500 outline-none" 
                                    value={category} 
                                    onChange={e => setCategory(e.target.value)}
                                >
                                    <option value="" disabled>Select a category</option>
                                    {type === 'income' ? (
                                        isPiggery ? (
                                            <>
                                                <option value="Pork Sale">Pork Sale</option>
                                                <option value="Live Pig Sale">Live Pig Sale</option>
                                                <option value="Other">Other</option>
                                            </>
                                        ) : (
                                            <>
                                                <option value="Sale of Animals/Birds">Sale of Animals/Birds</option>
                                                <option value="Manure Sale">Manure Sale</option>
                                                <option value="Eggs Sale">Eggs Sale</option>
                                                <option value="Empty Bag Sale">Empty Bag Sale</option>
                                                <option value="Other Income">Other Income</option>
                                            </>
                                        )
                                    ) : (
                                        isPiggery ? (
                                            <>
                                                <option value="Feed">Feed</option>
                                                <option value="Medicine">Medicine</option>
                                                <option value="Maintenance">Maintenance</option>
                                                <option value="Transport">Transport</option>
                                                <option value="Salary">Salary</option>
                                                <option value="Fuel">Fuel</option>
                                                <option value="Labor">Labor</option>
                                                <option value="Utility">Utility</option>
                                                <option value="Other">Other</option>
                                            </>
                                        ) : (
                                            <>
                                                <option value="Animal/Bird Purchase">Animal/Bird Purchase</option>
                                                <option value="Feed Purchase">Feed Purchase</option>
                                                <option value="Medicine & Vaccines">Medicine & Vaccines</option>
                                                <option value="Transport">Transport</option>
                                                <option value="Labor">Labor</option>
                                                <option value="Equipment & Maintenance">Equipment & Maintenance</option>
                                                <option value="Utility (Water/Electricity)">Utility (Water/Electricity)</option>
                                                <option value="Other Expense">Other Expense</option>
                                            </>
                                        )
                                    )}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <input type="text" required placeholder="e.g. 1500 Broiler Chicks" className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-1 focus:ring-amber-500 outline-none" value={description} onChange={e => setDescription(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (LKR)</label>
                                <input type="number" required min="1" className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-1 focus:ring-amber-500 outline-none" value={amount} onChange={e => setAmount(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                                <select required className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-1 focus:ring-amber-500 outline-none" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                                    <option value="Cash">Cash</option>
                                    <option value="Cheque">Cheque</option>
                                    <option value="Credit">Credit</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                <input type="date" required className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-1 focus:ring-amber-500 outline-none" value={date} onChange={e => setDate(e.target.value)} />
                            </div>
                            <button type="submit" className="w-full bg-amber-500 text-black font-bold py-3 mt-2 rounded-lg hover:bg-amber-600 transition-colors">
                                {editingTx ? 'Update Transaction' : 'Save Transaction'}
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
                                <Clock size={14} /> 5-Minute Window Expired
                            </p>
                            <p>This transaction was added over 5 minutes ago. Submit an edit request to the Admin for approval.</p>
                        </div>

                        <form onSubmit={handleSendEditRequest} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Record Details</label>
                                <div className="p-3 bg-gray-50 rounded-lg text-sm border border-gray-200 space-y-1">
                                    <p className="font-bold text-gray-800">{requestTargetRecord.category} ({requestTargetRecord.type})</p>
                                    <p className="text-xs font-semibold text-amber-600">Amount: LKR {requestTargetRecord.amount?.toLocaleString()}</p>
                                </div>
                            </div>

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
