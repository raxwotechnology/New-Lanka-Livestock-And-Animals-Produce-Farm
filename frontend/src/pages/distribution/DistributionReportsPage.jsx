import { useQuery } from '@tanstack/react-query';
import { DollarSign, Package, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import { distributionApi } from '../../features/distribution/distributionApi';

const COLORS = ['#ef4444', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6'];

export default function DistributionReportsPage() {
    const { data: resp, isLoading } = useQuery({ queryKey: ['dist-summary'], queryFn: distributionApi.getSummary });
    
    if (isLoading) return <div className="p-6 text-gray-500">Loading reports...</div>;

    const data = resp?.data?.data || { totalSales: 0, totalPurchases: 0, stockValuation: 0, totalItems: 0, lowStockItems: 0, itemsData: [] };

    const financialData = [
        { name: 'Total Sales', value: data.totalSales },
        { name: 'Total Purchases', value: data.totalPurchases }
    ];
    const PIE_COLORS = ['#10b981', '#f59e0b']; // Green for sales, Amber for purchases

    return (
        <div className="space-y-6 pb-12">
            <PageHeader 
                title="Distribution Reports & Analytics" 
                description="Visual performance indicators for independent distribution"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="p-6 border-b-4 border-b-green-500">
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-green-100 p-3 rounded-lg text-green-600">
                            <TrendingUp size={24} />
                        </div>
                    </div>
                    <p className="text-sm font-medium text-gray-500">Total Sales (Revenue)</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">Rs. {data.totalSales.toLocaleString()}</p>
                </Card>

                <Card className="p-6 border-b-4 border-b-amber-500">
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-amber-100 p-3 rounded-lg text-amber-600">
                            <TrendingDown size={24} />
                        </div>
                    </div>
                    <p className="text-sm font-medium text-gray-500">Total Purchases</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">Rs. {data.totalPurchases.toLocaleString()}</p>
                </Card>

                <Card className="p-6 border-b-4 border-b-blue-500">
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-blue-100 p-3 rounded-lg text-blue-600">
                            <DollarSign size={24} />
                        </div>
                    </div>
                    <p className="text-sm font-medium text-gray-500">Stock Valuation</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">Rs. {data.stockValuation.toLocaleString()}</p>
                </Card>

                <Card className="p-6 border-b-4 border-b-red-500">
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-red-100 p-3 rounded-lg text-red-600">
                            <AlertTriangle size={24} />
                        </div>
                    </div>
                    <p className="text-sm font-medium text-gray-500">Low Stock Items</p>
                    <p className="text-2xl font-bold text-red-600 mt-1">{data.lowStockItems} Items</p>
                </Card>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <Card className="p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-6">Current Stock Availability by Item</h3>
                    <div className="h-80 w-full" style={{ minWidth: 0, minHeight: 0 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.itemsData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={60} />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip formatter={(value) => [value, 'Stock Quantity']} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                                <Bar dataKey="stock" radius={[4, 4, 0, 0]}>
                                    {data.itemsData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card className="p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-6">Sales vs Purchases Overview</h3>
                    <div className="h-80 w-full" style={{ minWidth: 0, minHeight: 0 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={financialData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {financialData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => ['Rs. ' + value.toLocaleString(), '']} />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>
        </div>
    );
}
