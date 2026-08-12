import PoultryBatch from '../models/PoultryBatch.js';
import PoultryDailyLog from '../models/PoultryDailyLog.js';
import PoultryTransaction from '../models/PoultryTransaction.js';

// Create a new batch
export const createBatch = async (req, res) => {
    try {
        const { batch_name, initial_birds, breed, stage, raised_for, acquisition_date } = req.body;
        
        const batch = new PoultryBatch({
            batch_name,
            initial_birds,
            current_birds: initial_birds,
            breed,
            stage,
            raised_for,
            acquisition_date: acquisition_date || Date.now()
        });

        await batch.save();
        res.status(201).json({ success: true, data: batch });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateBatch = async (req, res) => {
    try {
        const { id } = req.params;
        const batch = await PoultryBatch.findByIdAndUpdate(id, req.body, { new: true });
        
        if (!batch) {
            return res.status(404).json({ success: false, message: 'Batch not found' });
        }
        
        res.status(200).json({ success: true, data: batch });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getBatches = async (req, res) => {
    try {
        const batches = await PoultryBatch.find().sort({ createdAt: -1 }).lean();
        
        // Calculate financials and analytics for each batch
        for (let batch of batches) {
            const transactions = await PoultryTransaction.find({ batch_id: batch._id });
            const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
            const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
            
            const netProfit = totalIncome - totalExpense;

            batch.financials = {
                totalIncome,
                totalExpense,
                netProfit,
                balance: netProfit
            };

            // Calculate Analytics (FCR, Mortality)
            const logs = await PoultryDailyLog.find({ batch_id: batch._id }).sort({ date: 1 });
            let totalMortality = 0;
            let totalFeedConsumed = 0;
            let latestWeight = 0;

            logs.forEach(log => {
                totalMortality += (log.mortality_count || 0);
                totalFeedConsumed += (log.feed_consumed_kg || 0);
                if (log.average_weight_kg > 0) {
                    latestWeight = log.average_weight_kg;
                }
            });

            const mortalityRate = batch.initial_birds > 0 
                ? ((totalMortality / batch.initial_birds) * 100).toFixed(2) 
                : 0;
            
            const totalWeightGained = batch.current_birds * latestWeight;
            const fcr = totalWeightGained > 0 
                ? (totalFeedConsumed / totalWeightGained).toFixed(2) 
                : 0;

            batch.analytics = {
                totalMortality,
                mortalityRate,
                fcr
            };
        }
        
        res.status(200).json({ success: true, data: batches });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Submit a new daily log
export const createDailyLog = async (req, res) => {
    try {
        const { batch_id, date, mortality_count, feed_consumed_kg, average_weight_kg } = req.body;

        const batch = await PoultryBatch.findById(batch_id);
        if (!batch) {
            return res.status(404).json({ success: false, message: 'Batch not found' });
        }

        // Create log
        const dailyLog = new PoultryDailyLog({
            batch_id,
            date,
            mortality_count,
            feed_consumed_kg,
            average_weight_kg
        });
        await dailyLog.save();

        // Update current birds in batch
        batch.current_birds -= mortality_count;
        if (batch.current_birds < 0) batch.current_birds = 0;
        await batch.save();

        res.status(201).json({ success: true, data: dailyLog });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get Batch Analytics
export const getBatchAnalytics = async (req, res) => {
    try {
        const { batchId } = req.params;

        const batch = await PoultryBatch.findById(batchId);
        if (!batch) {
            return res.status(404).json({ success: false, message: 'Batch not found' });
        }

        const logs = await PoultryDailyLog.find({ batch_id: batchId }).sort({ date: 1 });

        let totalMortality = 0;
        let totalFeedConsumed = 0;
        let latestWeight = 0;

        logs.forEach(log => {
            totalMortality += log.mortality_count;
            totalFeedConsumed += log.feed_consumed_kg;
            if (log.average_weight_kg > 0) {
                latestWeight = log.average_weight_kg;
            }
        });

        const mortalityRate = batch.initial_birds > 0 
            ? ((totalMortality / batch.initial_birds) * 100).toFixed(2) 
            : 0;
        
        const totalWeightGained = batch.current_birds * latestWeight;
        const fcr = totalWeightGained > 0 
            ? (totalFeedConsumed / totalWeightGained).toFixed(2) 
            : 0;

        const transactions = await PoultryTransaction.find({ batch_id: batchId });
        const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        const netProfit = totalIncome - totalExpense;

        res.status(200).json({
            success: true,
            data: {
                totalMortality,
                mortalityRate,
                totalFeedConsumed,
                totalWeightGained,
                fcr,
                totalIncome,
                totalExpense,
                netProfit,
                dailyLogs: logs
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get Single Batch
export const getBatchById = async (req, res) => {
    try {
        const batch = await PoultryBatch.findById(req.params.id).lean();
        if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });
        
        const transactions = await PoultryTransaction.find({ batch_id: batch._id });
        const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        
        const purchaseExpenses = transactions.filter(t => t.type === 'expense' && t.category === 'Purchase of chicks').reduce((sum, t) => sum + t.amount, 0);
        const otherExpenses = totalExpense - purchaseExpenses;
        
        batch.financials = {
            totalIncome,
            totalExpense,
            balance: totalIncome - totalExpense,
            avgPurchasePrice: batch.initial_birds > 0 ? (purchaseExpenses / batch.initial_birds) : 0,
            avgIncome: batch.initial_birds > 0 ? (totalIncome / batch.initial_birds) : 0,
            avgCost: batch.initial_birds > 0 ? (otherExpenses / batch.initial_birds) : 0,
            netProfit: totalIncome - totalExpense
        };
        
        res.status(200).json({ success: true, data: batch });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Transactions
export const getSummary = async (req, res) => {
    try {
        const transactions = await PoultryTransaction.find();
        const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        const netProfit = totalIncome - totalExpense;
        const activeBatchesCount = await PoultryBatch.countDocuments({ status: 'active' });

        res.status(200).json({
            success: true,
            data: {
                totalIncome,
                totalExpense,
                netProfit,
                activeBatchesCount
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getTransactions = async (req, res) => {
    try {
        const { paymentMethod, batch_id } = req.query;
        const filter = {};
        const bId = req.params.batchId || batch_id;
        if (bId && bId !== 'all') {
            filter.batch_id = bId;
        }
        if (paymentMethod) {
            filter.paymentMethod = paymentMethod;
        }
        const transactions = await PoultryTransaction.find(filter)
            .populate('batch_id', 'batch_name breed stage')
            .sort({ date: -1 });
        res.status(200).json({ success: true, data: transactions });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createTransaction = async (req, res) => {
    try {
        const tx = await PoultryTransaction.create(req.body);
        res.status(201).json({ success: true, data: tx });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        const tx = await PoultryTransaction.findByIdAndUpdate(id, req.body, { new: true });
        if (!tx) {
            return res.status(404).json({ success: false, message: 'Transaction not found' });
        }
        res.status(200).json({ success: true, data: tx });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        const tx = await PoultryTransaction.findByIdAndDelete(id);
        if (!tx) {
            return res.status(404).json({ success: false, message: 'Transaction not found' });
        }
        res.status(200).json({ success: true, message: 'Transaction deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteBatch = async (req, res) => {
    try {
        const { id } = req.params;
        const batch = await PoultryBatch.findByIdAndDelete(id);
        
        if (!batch) {
            return res.status(404).json({ success: false, message: 'Batch not found' });
        }

        // Clean up associated logs and transactions
        await PoultryDailyLog.deleteMany({ batch_id: id });
        await PoultryTransaction.deleteMany({ batch_id: id });

        res.status(200).json({ success: true, message: 'Batch deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

