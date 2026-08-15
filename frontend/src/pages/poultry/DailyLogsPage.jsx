import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { toast } from 'react-hot-toast';
import { Trash2, Edit2, Calendar, Bird, Scale, Utensils, Filter, RotateCcw, X } from 'lucide-react';
import { format } from 'date-fns';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import { useAuthStore, isRecordRecentlyCreated, isRecordApprovedForEdit } from '../../store/authStore';

export default function DailyLogsPage() {
    const [allBatches, setAllBatches] = useState([]);
    const [activeBatches, setActiveBatches] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loadingLogs, setLoadingLogs] = useState(false);
    const [selectedBatch, setSelectedBatch] = useState('');
    const { user, createdRecords, approvedEditRecords, addCreatedRecord } = useAuthStore();
    const isDataEntry = user?.role === 'manager';
    
    // Log form state
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [mortality, setMortality] = useState(0);
    const [feedConsumed, setFeedConsumed] = useState(0);
    const [averageWeight, setAverageWeight] = useState(0);

    // Edit Modal state
    const [editingLog, setEditingLog] = useState(null);
    const [editDate, setEditDate] = useState('');
    const [editMortality, setEditMortality] = useState(0);
    const [editFeedConsumed, setEditFeedConsumed] = useState(0);
    const [editAverageWeight, setEditAverageWeight] = useState(0);
    const [updating, setUpdating] = useState(false);

    // Filter states
    const [filterBatch, setFilterBatch] = useState('all');
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');

    const fetchBatches = async () => {
        try {
            const res = await api.get('/poultry/batches');
            if (res.data.success) {
                const fetched = res.data.data || [];
                setAllBatches(fetched);
                const active = fetched.filter(b => b.status !== 'completed');
                setActiveBatches(active.length > 0 ? active : fetched);
            }
        } catch (error) {
            toast.error('Failed to load batches');
        }
    };

    const fetchLogs = async () => {
        setLoadingLogs(true);
        try {
            const params = {};
            if (filterBatch && filterBatch !== 'all') params.batchId = filterBatch;
            if (filterStartDate) params.startDate = filterStartDate;
            if (filterEndDate) params.endDate = filterEndDate;

            const res = await api.get('/poultry/logs', { params });
            if (res.data.success) {
                setLogs(res.data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch logs:', error);
        } finally {
            setLoadingLogs(false);
        }
    };

    useEffect(() => {
        fetchBatches();
    }, []);

    useEffect(() => {
        fetchLogs();
    }, [filterBatch, filterStartDate, filterEndDate]);

    const handleSubmitLog = async (e) => {
        e.preventDefault();
        if (!selectedBatch || !date) {
            return toast.error('Please select a batch and date.');
        }
        
        try {
            const res = await api.post('/poultry/logs', {
                batch_id: selectedBatch,
                date,
                mortality_count: Number(mortality),
                feed_consumed_kg: Number(feedConsumed),
                average_weight_kg: Number(averageWeight)
            });

            if (res.data.success) {
                if (res.data.data?._id && addCreatedRecord) {
                    addCreatedRecord(res.data.data._id);
                }
                toast.success('Daily log submitted!');
                setDate(new Date().toISOString().split('T')[0]);
                setMortality(0);
                setFeedConsumed(0);
                setAverageWeight(0);
                fetchBatches();
                fetchLogs();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error submitting log');
        }
    };

    const openEditLogModal = (log) => {
        setEditingLog(log);
        setEditDate(log.date ? new Date(log.date).toISOString().split('T')[0] : '');
        setEditMortality(log.mortality_count || 0);
        setEditFeedConsumed(log.feed_consumed_kg || 0);
        setEditAverageWeight(log.average_weight_kg || 0);
    };

    const handleUpdateLog = async (e) => {
        e.preventDefault();
        if (!editingLog) return;

        setUpdating(true);
        try {
            const res = await api.put(`/poultry/logs/${editingLog._id}`, {
                date: editDate,
                mortality_count: Number(editMortality),
                feed_consumed_kg: Number(editFeedConsumed),
                average_weight_kg: Number(editAverageWeight)
            });

            if (res.data.success) {
                toast.success('Daily log updated successfully!');
                setEditingLog(null);
                fetchLogs();
                fetchBatches();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update log');
        } finally {
            setUpdating(false);
        }
    };

    const handleDeleteLog = async (id) => {
        if (window.confirm('Are you sure you want to delete this log entry?')) {
            try {
                const res = await api.delete(`/poultry/logs/${id}`);
                if (res.data.success) {
                    toast.success('Daily log deleted');
                    fetchLogs();
                    fetchBatches();
                }
            } catch (error) {
                toast.error(error.response?.data?.message || 'Error deleting log');
            }
        }
    };

    const resetFilters = () => {
        setFilterBatch('all');
        setFilterStartDate('');
        setFilterEndDate('');
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <PageHeader 
                title="Poultry Daily Logs" 
                description="Submit, edit, and view daily mortality, feed consumption, and bird weight logs"
            />
            
            {/* Form */}
            <Card>
                <div className="p-4 sm:p-6">
                    <h3 className="text-base font-bold text-gray-900 mb-4 border-b pb-2 flex items-center gap-2">
                        <Calendar size={18} className="text-amber-500" /> New Daily Log Entry
                    </h3>
                    <form onSubmit={handleSubmitLog} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Select Batch</label>
                            <select 
                                required
                                className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-1 focus:ring-amber-500 outline-none text-sm text-gray-900"
                                value={selectedBatch} 
                                onChange={(e) => setSelectedBatch(e.target.value)}
                            >
                                <option value="">-- Choose a Batch --</option>
                                {activeBatches.map(b => (
                                    <option key={b._id} value={b._id}>
                                        {b.batch_name || b.batch_number} (Birds: {b.current_birds ?? b.initial_birds ?? 0})
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                            <input 
                                type="date" 
                                required
                                className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-1 focus:ring-amber-500 outline-none text-sm text-gray-900"
                                value={date} 
                                onChange={(e) => setDate(e.target.value)} 
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                                    <Bird size={14} className="text-red-500" /> Mortality Count
                                </label>
                                <input 
                                    type="number" 
                                    min="0"
                                    required
                                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-1 focus:ring-amber-500 outline-none text-sm text-gray-900"
                                    value={mortality} 
                                    onChange={(e) => setMortality(e.target.value)} 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                                    <Utensils size={14} className="text-amber-500" /> Feed Consumed (kg)
                                </label>
                                <input 
                                    type="number" 
                                    step="0.1"
                                    min="0"
                                    required
                                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-1 focus:ring-amber-500 outline-none text-sm text-gray-900"
                                    value={feedConsumed} 
                                    onChange={(e) => setFeedConsumed(e.target.value)} 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                                    <Scale size={14} className="text-blue-500" /> Average Weight (kg)
                                </label>
                                <input 
                                    type="number" 
                                    step="0.01"
                                    min="0"
                                    required
                                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-1 focus:ring-amber-500 outline-none text-sm text-gray-900"
                                    value={averageWeight} 
                                    onChange={(e) => setAverageWeight(e.target.value)} 
                                />
                            </div>
                        </div>

                        <div className="pt-2">
                            <button 
                                type="submit" 
                                className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold py-2.5 rounded-lg transition-colors text-sm"
                            >
                                Submit Daily Log
                            </button>
                        </div>
                    </form>
                </div>
            </Card>

            {/* Daily Logs Table with Batch & Date Filters */}
            <Card>
                <div className="p-4 sm:p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
                        <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                            <Filter size={18} className="text-amber-500" /> Submitted Daily Logs History
                        </h3>

                        {/* Filter Bar */}
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="w-full sm:w-auto min-w-[150px]">
                                <select
                                    className="w-full p-2 bg-gray-50 border border-gray-300 rounded-lg text-xs text-gray-900 focus:ring-1 focus:ring-amber-500 outline-none"
                                    value={filterBatch}
                                    onChange={(e) => setFilterBatch(e.target.value)}
                                >
                                    <option value="all">All Batches</option>
                                    {allBatches.map(b => (
                                        <option key={b._id} value={b._id}>{b.batch_name || b.batch_number}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center gap-1 text-xs">
                                <span className="text-gray-500 font-medium">From:</span>
                                <input
                                    type="date"
                                    className="p-1.5 bg-gray-50 border border-gray-300 rounded-lg text-xs text-gray-900 outline-none"
                                    value={filterStartDate}
                                    onChange={(e) => setFilterStartDate(e.target.value)}
                                />
                            </div>

                            <div className="flex items-center gap-1 text-xs">
                                <span className="text-gray-500 font-medium">To:</span>
                                <input
                                    type="date"
                                    className="p-1.5 bg-gray-50 border border-gray-300 rounded-lg text-xs text-gray-900 outline-none"
                                    value={filterEndDate}
                                    onChange={(e) => setFilterEndDate(e.target.value)}
                                />
                            </div>

                            {(filterBatch !== 'all' || filterStartDate || filterEndDate) && (
                                <button
                                    onClick={resetFilters}
                                    className="p-1.5 text-xs text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-1"
                                    title="Reset Filters"
                                >
                                    <RotateCcw size={14} /> Reset
                                </button>
                            )}
                        </div>
                    </div>

                    <Table
                        columns={[
                            { 
                                label: 'Date', 
                                key: 'date', 
                                render: (row) => row.date ? format(new Date(row.date), 'MMM dd, yyyy') : 'N/A' 
                            },
                            { 
                                label: 'Batch', 
                                key: 'batch_id', 
                                render: (row) => row.batch_id?.batch_name || row.batch_id?.batch_number || 'General' 
                            },
                            { 
                                label: 'Mortality', 
                                key: 'mortality_count',
                                render: (row) => <span className="font-semibold text-red-600">{row.mortality_count || 0}</span>
                            },
                            { 
                                label: 'Feed (kg)', 
                                key: 'feed_consumed_kg',
                                render: (row) => <span className="font-semibold text-amber-700">{row.feed_consumed_kg || 0} kg</span>
                            },
                            { 
                                label: 'Av. Weight (kg)', 
                                key: 'average_weight_kg',
                                render: (row) => <span className="font-semibold text-blue-700">{row.average_weight_kg || 0} kg</span>
                            },
                            {
                                label: 'Actions',
                                key: 'actions',
                                render: (row) => (
                                    (!isDataEntry || isRecordApprovedForEdit(row, approvedEditRecords, createdRecords) || isRecordRecentlyCreated(row, createdRecords)) ? (
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => openEditLogModal(row)}
                                                className="text-blue-600 hover:text-blue-800 p-1 transition-colors"
                                                title="Edit Log"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteLog(row._id)}
                                                className="text-red-600 hover:text-red-800 p-1 transition-colors"
                                                title="Delete Log"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ) : null
                                )
                            }
                        ]}
                        data={logs}
                        isLoading={loadingLogs}
                    />
                </div>
            </Card>

            {/* Edit Log Modal */}
            {editingLog && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-5 border-b border-gray-100 pb-3">
                            <h2 className="text-xl font-bold text-gray-900">Edit Daily Log</h2>
                            <button type="button" onClick={() => setEditingLog(null)} className="text-gray-400 hover:text-gray-700 p-1">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleUpdateLog} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Batch</label>
                                <input 
                                    type="text" 
                                    disabled 
                                    value={editingLog.batch_id?.batch_name || editingLog.batch_id?.batch_number || 'General'} 
                                    className="w-full p-2.5 bg-gray-100 border border-gray-300 text-gray-700 rounded-lg text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                <input 
                                    type="date" 
                                    required 
                                    value={editDate} 
                                    onChange={(e) => setEditDate(e.target.value)} 
                                    className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-1 focus:ring-amber-500 outline-none text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mortality Count</label>
                                <input 
                                    type="number" 
                                    min="0" 
                                    required 
                                    value={editMortality} 
                                    onChange={(e) => setEditMortality(e.target.value)} 
                                    className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-1 focus:ring-amber-500 outline-none text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Feed Consumed (kg)</label>
                                <input 
                                    type="number" 
                                    step="0.1" 
                                    min="0" 
                                    required 
                                    value={editFeedConsumed} 
                                    onChange={(e) => setEditFeedConsumed(e.target.value)} 
                                    className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-1 focus:ring-amber-500 outline-none text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Average Weight (kg)</label>
                                <input 
                                    type="number" 
                                    step="0.01" 
                                    min="0" 
                                    required 
                                    value={editAverageWeight} 
                                    onChange={(e) => setEditAverageWeight(e.target.value)} 
                                    className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-1 focus:ring-amber-500 outline-none text-sm"
                                />
                            </div>

                            <button 
                                type="submit" 
                                disabled={updating} 
                                className="w-full mt-4 bg-amber-500 hover:bg-amber-600 text-black font-bold p-3 rounded-lg transition-colors flex justify-center items-center text-sm"
                            >
                                {updating ? 'Updating Log...' : 'Update Daily Log'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
