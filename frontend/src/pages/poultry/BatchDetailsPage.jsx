import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../../api/axios';
import { toast } from 'react-hot-toast';
import { ChevronLeft, MoreVertical, FileText, Activity, DollarSign, Package, ShoppingCart, BarChart2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useAuthStore } from '../../store/authStore';

export default function BatchDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [batch, setBatch] = useState(null);
    const [loading, setLoading] = useState(true);
    const { user } = useAuthStore();
    const isDataEntry = user?.role === 'manager';
    
    const isPiggery = location.pathname.includes('piggery');
    const modulePrefix = isPiggery ? 'piggery' : 'poultry';

    useEffect(() => {
        const fetchBatch = async () => {
            try {
                const res = await api.get(`/${modulePrefix}/batches/${id}`);
                if (res.data.success) {
                    setBatch(res.data.data);
                } else if (res.data && res.data._id) {
                    setBatch(res.data);
                }
            } catch (error) {
                toast.error('Failed to load batch details');
                navigate(`/${modulePrefix}/batches`);
            } finally {
                setLoading(false);
            }
        };
        fetchBatch();
    }, [id, navigate, modulePrefix]);

    if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading batch details...</div>;
    if (!batch) return null;

    const { financials = {} } = batch;
    const hasFinancials = financials.totalIncome > 0 || financials.totalExpense > 0;
    const data = [
        { name: 'Income', value: financials.totalIncome || 1, color: '#10b981' },
        { name: 'Expense', value: financials.totalExpense || 1, color: '#ef4444' }
    ];

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

    const widgets = [
        { label: 'Finances', icon: DollarSign, color: 'text-amber-500', path: `/${modulePrefix}/batches/${id}/finances` },
        { label: 'Reports & Analytics', icon: BarChart2, color: 'text-orange-400', path: `/${modulePrefix}/batch-analytics?batch=${id}` },
    ];

    return (
        <div className="min-h-screen bg-gray-50 text-gray-800 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200 shadow-sm">
                <button onClick={() => navigate(`/${modulePrefix}/batches`)} className="text-amber-600 flex items-center gap-1 font-medium hover:text-amber-700">
                    <ChevronLeft size={24} /> Batches
                </button>
                <h1 className="text-lg font-semibold text-gray-900 truncate max-w-[150px]">{batch.batch_name || batch.batch_number} Details</h1>
                <div className="w-20"></div> {/* Spacer for centering */}
            </div>

            <div className="p-4 space-y-6">
                {/* Main Card */}
                <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200">
                    <div className="p-4">
                        <div className="flex justify-between items-center mb-1">
                            <h2 className="text-lg font-bold text-gray-900">{batch.batch_name || batch.batch_number}</h2>
                        </div>
                        <p className="text-xs text-gray-500 mb-4 pb-4 border-b border-gray-100">
                            Start Date: {formatDate(batch.acquisition_date)} 
                            {batch.acquisition_date && !isNaN(new Date(batch.acquisition_date).getTime()) && ` (${calculateDaysAgo(batch.acquisition_date)} days ago)`}
                        </p>

                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="flex items-center gap-2 text-gray-500"><span className="text-amber-500 w-3.5 flex justify-center text-xs font-bold">#</span> Starting Count</span>
                                <span className="text-gray-700 font-medium">{batch.initial_birds || batch.initial_count}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="flex items-center gap-2 text-gray-500"><span className="text-amber-500 w-3.5 flex justify-center text-xs font-bold">#</span> Current Count</span>
                                <span className="text-gray-700 font-medium">{batch.current_birds || batch.current_count}</span>
                            </div>
                            {!isDataEntry && (
                                <>
                                    <div className="flex justify-between pt-2">
                                        <span className="flex items-center gap-2 text-gray-500"><span className="text-amber-500 w-3.5 flex justify-center text-xs">💵</span> Av. Purchase Price</span>
                                        <span className="text-gray-600 font-medium">{formatCurrency(financials.avgPurchasePrice)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="flex items-center gap-2 text-gray-500"><span className="text-amber-500 w-3.5 flex justify-center text-xs">💵</span> Av. Income</span>
                                        <span className="text-green-600 font-medium">{formatCurrency(financials.avgIncome)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="flex items-center gap-2 text-gray-500"><span className="text-amber-500 w-3.5 flex justify-center text-xs">💵</span> Av. Cost + Expenses</span>
                                        <span className="text-amber-600 font-medium">{formatCurrency(financials.avgCost)}</span>
                                    </div>
                                    <div className="flex justify-between pb-4 border-b border-gray-100">
                                        <span className="flex items-center gap-2 text-gray-500"><span className="text-amber-500 w-3.5 flex justify-center text-xs">💵</span> Net Profit</span>
                                        <span className="text-green-600 font-bold">{formatCurrency(financials.netProfit)}</span>
                                    </div>
                                </>
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

                {/* Widgets */}
                <div>
                    <h3 className="text-sm font-semibold text-gray-600 mb-3 px-1">Batch Widgets</h3>
                    <div className="grid grid-cols-3 gap-3">
                        {widgets.map((widget, i) => (
                            <div 
                                key={i}
                                onClick={() => widget.path && navigate(widget.path)}
                                className={`bg-white p-4 rounded-xl flex flex-col items-center justify-center gap-2 shadow-sm border border-gray-200 hover:bg-gray-50 hover:border-amber-200 transition-colors ${widget.path ? 'cursor-pointer' : 'opacity-70 cursor-not-allowed'}`}
                            >
                                <widget.icon className={widget.color} size={28} />
                                <span className="text-xs text-center font-medium text-gray-700 leading-tight">{widget.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
