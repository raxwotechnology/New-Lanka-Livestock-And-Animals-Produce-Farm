import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { toast } from 'react-hot-toast';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Activity, Droplets, TrendingDown, TrendingUp, Scale, DollarSign } from 'lucide-react';

export default function BatchAnalyticsPage() {
    const [batches, setBatches] = useState([]);
    const [selectedBatch, setSelectedBatch] = useState('');
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(false);

    const apiBase = import.meta.env.VITE_API_URL || 'https://new-lanka-livestock-and-animals-produce.onrender.com/api';

    useEffect(() => {
        const fetchBatches = async () => {
            try {
                const res = await api.get(`/poultry/batches`);
                if (res.data.success) {
                    setBatches(res.data.data);
                    if (res.data.data.length > 0) {
                        setSelectedBatch(res.data.data[0]._id);
                    }
                }
            } catch (error) {
                toast.error('Failed to load batches');
            }
        };
        fetchBatches();
    }, [apiBase]);

    useEffect(() => {
        if (!selectedBatch) return;

        const fetchAnalytics = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/poultry/analytics/${selectedBatch}`);
                if (res.data.success) {
                    setAnalytics(res.data.data);
                }
            } catch (error) {
                toast.error('Failed to fetch analytics');
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [selectedBatch, apiBase]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-LK', {
            style: 'currency',
            currency: 'LKR',
            minimumFractionDigits: 0
        }).format(amount || 0);
    };

    const financialData = analytics ? [
        { name: 'Income', amount: analytics.totalIncome, fill: '#10b981' },
        { name: 'Expense', amount: analytics.totalExpense, fill: '#ef4444' }
    ] : [];

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-gray-800">Batch Analytics</h1>
                <div className="w-full sm:w-64">
                    <select 
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 shadow-sm"
                        value={selectedBatch} 
                        onChange={(e) => setSelectedBatch(e.target.value)}
                    >
                        <option value="">-- Select a Batch --</option>
                        {batches.map(b => (
                            <option key={b._id} value={b._id}>
                                {b.batch_name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {loading && <div className="text-gray-500">Loading analytics...</div>}

            {!loading && analytics && (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        
                        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                            <div className="p-3 bg-red-100 text-red-600 rounded-lg">
                                <TrendingDown size={24} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Total Mortality</p>
                                <p className="text-2xl font-bold text-gray-800">{analytics.totalMortality} ({analytics.mortalityRate}%)</p>
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                                <Droplets size={24} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Total Feed Consumed</p>
                                <p className="text-2xl font-bold text-gray-800">{analytics.totalFeedConsumed} <span className="text-sm font-normal text-gray-500">kg</span></p>
                            </div>
                        </div>

                        {/* FCR Card */}
                        <div className="bg-gradient-to-br from-primary-600 to-primary-800 p-5 rounded-xl shadow-md flex items-center gap-4 text-white">
                            <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                                <Scale size={24} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-primary-100">Feed Conversion Ratio</p>
                                <p className="text-2xl font-bold">{analytics.fcr}</p>
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg">
                                <DollarSign size={24} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                                <p className="text-xl font-bold text-gray-800">{formatCurrency(analytics.totalIncome)}</p>
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                            <div className="p-3 bg-orange-100 text-orange-600 rounded-lg">
                                <Activity size={24} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Total Expenses</p>
                                <p className="text-xl font-bold text-gray-800">{formatCurrency(analytics.totalExpense)}</p>
                            </div>
                        </div>

                        {/* Net Profit Card */}
                        <div className={`p-5 rounded-xl shadow-md flex items-center gap-4 text-white ${analytics.netProfit >= 0 ? 'bg-gradient-to-br from-emerald-500 to-emerald-700' : 'bg-gradient-to-br from-red-500 to-red-700'}`}>
                            <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                                {analytics.netProfit >= 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-white/90">Net Profit</p>
                                <p className="text-xl font-bold">{formatCurrency(analytics.netProfit)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                        {/* Mortality Chart */}
                        <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-100 shadow-sm min-w-0">
                            <h2 className="text-lg font-semibold mb-4 text-gray-800">Mortality Trend</h2>
                            <div className="h-72 w-full min-w-0">
                                {analytics.dailyLogs && analytics.dailyLogs.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={analytics.dailyLogs} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                            <XAxis 
                                                dataKey="date" 
                                                tickFormatter={(val) => new Date(val).toLocaleDateString()}
                                                stroke="#9CA3AF"
                                            />
                                            <YAxis stroke="#9CA3AF" />
                                            <Tooltip 
                                                labelFormatter={(val) => new Date(val).toLocaleDateString()}
                                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            />
                                            <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                            <Line 
                                                type="monotone" 
                                                name="Mortality Count" 
                                                dataKey="mortality_count" 
                                                stroke="#EF4444" 
                                                strokeWidth={3}
                                                dot={{ r: 4, strokeWidth: 2 }}
                                                activeDot={{ r: 6 }} 
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-gray-400">
                                        No mortality records for this batch.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Feed Consumption Chart */}
                        <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-100 shadow-sm min-w-0">
                            <h2 className="text-lg font-semibold mb-4 text-gray-800">Feed Consumption (kg)</h2>
                            <div className="h-72 w-full min-w-0">
                                {analytics.dailyLogs && analytics.dailyLogs.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={analytics.dailyLogs} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                            <XAxis 
                                                dataKey="date" 
                                                tickFormatter={(val) => new Date(val).toLocaleDateString()}
                                                stroke="#9CA3AF"
                                            />
                                            <YAxis stroke="#9CA3AF" />
                                            <Tooltip 
                                                labelFormatter={(val) => new Date(val).toLocaleDateString()}
                                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            />
                                            <Bar name="Feed (kg)" dataKey="feed_consumed_kg" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-gray-400">
                                        No feed records for this batch.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Financials Chart */}
                        <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-100 shadow-sm min-w-0 lg:col-span-2">
                            <h2 className="text-lg font-semibold mb-4 text-gray-800">Income vs. Expense</h2>
                            <div className="h-72 w-full min-w-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={financialData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                        <XAxis dataKey="name" stroke="#9CA3AF" />
                                        <YAxis tickFormatter={(val) => `Rs.${val/1000}k`} stroke="#9CA3AF" />
                                        <Tooltip 
                                            formatter={(value) => formatCurrency(value)}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Bar dataKey="amount" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
