import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { toast } from 'react-hot-toast';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import { useAuthStore } from '../../store/authStore';

export default function DailyLogsPage() {
    const [batches, setBatches] = useState([]);
    const [selectedBatch, setSelectedBatch] = useState('');
    const { addCreatedRecord } = useAuthStore();
    
    // Log form state
    const [date, setDate] = useState('');
    const [mortality, setMortality] = useState(0);
    const [feedConsumed, setFeedConsumed] = useState(0);
    const [averageWeight, setAverageWeight] = useState(0);

    const fetchBatches = async () => {
        try {
            const res = await api.get('/poultry/batches');
            if (res.data.success) {
                // Filter only active batches with birds remaining for logging
                setBatches(res.data.data.filter(b => b.status === 'active' && b.current_birds > 0));
            }
        } catch (error) {
            toast.error('Failed to load batches');
        }
    };

    useEffect(() => {
        fetchBatches();
    }, []);

    const handleSubmitLog = async (e) => {
        e.preventDefault();
        if (!selectedBatch || !date) {
            return toast.error('Please select a batch and date.');
        }
        
        try {
            const res = await api.post('/poultry/logs', {
                batch_id: selectedBatch,
                date,
                mortality_count: mortality,
                feed_consumed_kg: feedConsumed,
                average_weight_kg: averageWeight
            });

            if (res.data.success) {
                if (res.data.data?._id && addCreatedRecord) {
                    addCreatedRecord(res.data.data._id);
                }
                toast.success('Daily log submitted!');
                setDate('');
                setMortality(0);
                setFeedConsumed(0);
                setAverageWeight(0);
                fetchBatches(); // Refresh batches to get updated current_birds
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error submitting log');
        }
    };

    return (
        <div className="max-w-3xl mx-auto">
            <PageHeader 
                title="Poultry Daily Logs" 
                description="Submit daily mortality, feed, and weight data for your active batches"
            />
            
            <Card>
                <div className="p-4 sm:p-6">
                    <form onSubmit={handleSubmitLog} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Select Batch</label>
                            <select 
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                                value={selectedBatch} 
                                onChange={(e) => setSelectedBatch(e.target.value)}
                            >
                                <option value="">-- Choose a Batch --</option>
                                {batches.map(b => (
                                    <option key={b._id} value={b._id}>
                                        {b.batch_name} ({b.current_birds} birds left)
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                            <input 
                                type="date" 
                                required
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                                value={date} 
                                onChange={(e) => setDate(e.target.value)} 
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mortality Count</label>
                                <input 
                                    type="number" 
                                    min="0"
                                    required
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                                    value={mortality} 
                                    onChange={(e) => setMortality(Number(e.target.value))} 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Feed Consumed (kg)</label>
                                <input 
                                    type="number" 
                                    step="0.1"
                                    min="0"
                                    required
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                                    value={feedConsumed} 
                                    onChange={(e) => setFeedConsumed(Number(e.target.value))} 
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Average Weight (kg)</label>
                            <input 
                                type="number" 
                                step="0.01"
                                min="0"
                                required
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                                value={averageWeight} 
                                onChange={(e) => setAverageWeight(Number(e.target.value))} 
                            />
                        </div>

                        <div className="pt-2">
                            <button 
                                type="submit" 
                                className="w-full bg-primary-600 text-white font-medium py-2.5 rounded-lg hover:bg-primary-700 transition"
                            >
                                Submit Log
                            </button>
                        </div>
                    </form>
                </div>
            </Card>
        </div>
    );
}
