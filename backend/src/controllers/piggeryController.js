import asyncHandler from 'express-async-handler';
import PigBatch from '../models/PigBatch.js';
import PigBreeding from '../models/PigBreeding.js';
import PigMortality from '../models/PigMortality.js';
import PiggeryExpense from '../models/PiggeryExpense.js';
import PiggeryIncome from '../models/PiggeryIncome.js';

export const getBatches = asyncHandler(async (req, res) => {
    const batches = await PigBatch.find().sort({ createdAt: -1 }).lean();
    
    for (let batch of batches) {
        const incomes = await PiggeryIncome.find({ batch_id: batch._id });
        const expenses = await PiggeryExpense.find({ batch_id: batch._id });
        
        const totalIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0);
        const totalExpense = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        
        const avgIncome = batch.initial_count > 0 ? totalIncome / batch.initial_count : 0;
        const avgCost = batch.initial_count > 0 ? totalExpense / batch.initial_count : 0;
        
        batch.financials = {
            totalIncome,
            totalExpense,
            balance: totalIncome - totalExpense,
            avgPurchasePrice: 0,
            avgIncome,
            avgCost,
            netProfit: totalIncome - totalExpense
        };
    }
    
    res.json(batches);
});

export const getBatchById = asyncHandler(async (req, res) => {
    const batch = await PigBatch.findById(req.params.id).lean();
    if (!batch) return res.status(404).json({ message: 'Batch not found' });
    
    const incomes = await PiggeryIncome.find({ batch_id: batch._id });
    const expenses = await PiggeryExpense.find({ batch_id: batch._id });
    
    const totalIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0);
    const totalExpense = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    
    const avgIncome = batch.initial_count > 0 ? totalIncome / batch.initial_count : 0;
    const avgCost = batch.initial_count > 0 ? totalExpense / batch.initial_count : 0;
    
    batch.financials = {
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
        avgPurchasePrice: 0,
        avgIncome,
        avgCost,
        netProfit: totalIncome - totalExpense
    };
    
    res.json(batch);
});

export const createBatch = asyncHandler(async (req, res) => {
    const { batch_number, initial_count, acquisition_date, notes, breed, housing } = req.body;
    
    // Check if batch number exists
    const exists = await PigBatch.findOne({ batch_number });
    if (exists) return res.status(400).json({ message: 'Batch number already exists' });
    
    const batch = await PigBatch.create({
        batch_number,
        initial_count,
        current_count: initial_count,
        acquisition_date,
        notes,
        breed,
        housing
    });
    res.status(201).json(batch);
});

export const updateBatch = asyncHandler(async (req, res) => {
    const batch = await PigBatch.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!batch) return res.status(404).json({ message: 'Batch not found' });
    res.json(batch);
});

// --- Breeding ---
export const getBreedingRecords = asyncHandler(async (req, res) => {
    const records = await PigBreeding.find().populate('sow_batch_id', 'batch_number breed housing').sort({ createdAt: -1 });
    res.json(records);
});

export const createBreedingRecord = asyncHandler(async (req, res) => {
    const record = await PigBreeding.create(req.body);
    const populated = await record.populate('sow_batch_id', 'batch_number breed housing');
    res.status(201).json(populated);
});

export const updateBreedingRecord = asyncHandler(async (req, res) => {
    const record = await PigBreeding.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('sow_batch_id');
    if (!record) return res.status(404).json({ message: 'Record not found' });
    res.json(record);
});

// --- Mortalities ---
export const getMortalities = asyncHandler(async (req, res) => {
    const mortalities = await PigMortality.find().populate('batch_id', 'batch_number breed').sort({ createdAt: -1 });
    res.json(mortalities);
});

export const createMortality = asyncHandler(async (req, res) => {
    const mortality = await PigMortality.create(req.body);
    const populated = await mortality.populate('batch_id', 'batch_number breed');
    res.status(201).json(populated);
});

// --- Expenses ---
export const getExpenses = asyncHandler(async (req, res) => {

    const { paymentMethod } = req.query;
    const filter = {};
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    const expenses = await PiggeryExpense.find(filter).populate('batch_id', 'batch_number breed').sort({ date: -1 });
    res.json(expenses);
});

export const createExpense = asyncHandler(async (req, res) => {
    const data = { ...req.body };
    if (!data.batch_id || data.batch_id === '' || data.batch_id === 'none') {
        delete data.batch_id;
    }
    const expense = await PiggeryExpense.create(data);
    res.status(201).json(expense);
});

export const updateExpense = asyncHandler(async (req, res) => {
    const data = { ...req.body };
    if (!data.batch_id || data.batch_id === '' || data.batch_id === 'none') {
        data.batch_id = null;
    }
    const expense = await PiggeryExpense.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    res.json(expense);
});

export const deleteExpense = asyncHandler(async (req, res) => {
    const expense = await PiggeryExpense.findByIdAndDelete(req.params.id);
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    res.json({ success: true, message: 'Expense deleted successfully' });
});

// --- Incomes ---
export const getIncomes = asyncHandler(async (req, res) => {

    const { paymentMethod } = req.query;
    const filter = {};
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    const incomes = await PiggeryIncome.find(filter).populate('batch_id', 'batch_number breed').sort({ date: -1 });
    res.json(incomes);
});

export const createIncome = asyncHandler(async (req, res) => {
    const data = { ...req.body };
    if (!data.batch_id || data.batch_id === '' || data.batch_id === 'none') {
        delete data.batch_id;
    }
    const income = await PiggeryIncome.create(data);
    res.status(201).json(income);
});

export const updateIncome = asyncHandler(async (req, res) => {
    const data = { ...req.body };
    if (!data.batch_id || data.batch_id === '' || data.batch_id === 'none') {
        data.batch_id = null;
    }
    const income = await PiggeryIncome.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!income) return res.status(404).json({ message: 'Income not found' });
    res.json(income);
});

export const deleteIncome = asyncHandler(async (req, res) => {
    const income = await PiggeryIncome.findByIdAndDelete(req.params.id);
    if (!income) return res.status(404).json({ message: 'Income not found' });
    res.json({ success: true, message: 'Income deleted successfully' });
});

// --- Transactions (Unified for Batch Finances Page) ---
export const getBatchTransactions = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { paymentMethod } = req.query;
    const filter = { batch_id: id };
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    const incomes = await PiggeryIncome.find(filter).lean();
    const expenses = await PiggeryExpense.find(filter).lean();
    
    const unifiedIncomes = incomes.map(i => ({ ...i, type: 'income' }));
    const unifiedExpenses = expenses.map(e => ({ ...e, type: 'expense' }));
    
    const transactions = [...unifiedIncomes, ...unifiedExpenses].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    res.json({ success: true, data: transactions });
});

export const createBatchTransaction = asyncHandler(async (req, res) => {
    const { type, amount, category, description, date, batch_id, paymentMethod } = req.body;
    const cleanBatchId = (batch_id && batch_id !== '' && batch_id !== 'none') ? batch_id : undefined;
    
    let transaction;
    if (type === 'income') {
        transaction = await PiggeryIncome.create({ batch_id: cleanBatchId, amount, category, description, date, paymentMethod });
    } else {
        transaction = await PiggeryExpense.create({ batch_id: cleanBatchId, amount, category, description, date, paymentMethod });
    }
    
    res.status(201).json({ success: true, data: transaction });
});

export const updateBatchTransaction = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { type, ...updateData } = req.body;
    
    // First find where the transaction currently is
    let currentTx = await PiggeryIncome.findById(id);
    let currentCollection = 'income';
    
    if (!currentTx) {
        currentTx = await PiggeryExpense.findById(id);
        currentCollection = 'expense';
    }
    
    if (!currentTx) {
        return res.status(404).json({ success: false, message: 'Transaction not found' });
    }
    
    // If the type is being changed, we must move it to the other collection
    if (type && type !== currentCollection) {
        if (type === 'income') {
            await PiggeryExpense.findByIdAndDelete(id);
            const newIncome = new PiggeryIncome({ ...currentTx.toObject(), ...updateData });
            // Keep the same ID
            newIncome._id = id;
            await newIncome.save();
            return res.json({ success: true, data: newIncome });
        } else {
            await PiggeryIncome.findByIdAndDelete(id);
            const newExpense = new PiggeryExpense({ ...currentTx.toObject(), ...updateData });
            // Keep the same ID
            newExpense._id = id;
            await newExpense.save();
            return res.json({ success: true, data: newExpense });
        }
    }
    
    // Otherwise just update in place
    let transaction;
    if (currentCollection === 'income') {
        transaction = await PiggeryIncome.findByIdAndUpdate(id, updateData, { new: true });
    } else {
        transaction = await PiggeryExpense.findByIdAndUpdate(id, updateData, { new: true });
    }
    
    res.json({ success: true, data: transaction });
});

export const deleteBatchTransaction = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    let transaction = await PiggeryIncome.findByIdAndDelete(id);
    if (!transaction) {
        transaction = await PiggeryExpense.findByIdAndDelete(id);
    }
    
    if (!transaction) {
        return res.status(404).json({ success: false, message: 'Transaction not found' });
    }
    
    res.json({ success: true, message: 'Transaction deleted successfully' });
});

// --- Dashboard Summary ---
export const getSummary = asyncHandler(async (req, res) => {

    const totalPigs = await PigBatch.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: null, total: { $sum: '$current_count' } } }
    ]);
    
    const expensesAgg = await PiggeryExpense.aggregate([
        { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    const incomesAgg = await PiggeryIncome.aggregate([
        { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    const activeBreeding = await PigBreeding.countDocuments({ status: 'pregnant' });
    
    res.json({
        totalPigs: totalPigs[0]?.total || 0,
        totalExpenses: expensesAgg[0]?.total || 0,
        totalIncomes: incomesAgg[0]?.total || 0,
        activeBreeding
    });
});

export const deleteBatch = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const batch = await PigBatch.findById(id);
    if (!batch) return res.status(404).json({ message: 'Batch not found' });

    // Clean up related data
    await Promise.all([
        PigBreeding.deleteMany({ sow_batch_id: id }),
        PigMortality.deleteMany({ batch_id: id }),
        PiggeryExpense.deleteMany({ batch_id: id }),
        PiggeryIncome.deleteMany({ batch_id: id })
    ]);

    await PigBatch.findByIdAndDelete(id);
    res.json({ success: true, message: 'Batch and related records deleted successfully' });
});

// Get Batch Analytics
export const getBatchAnalytics = asyncHandler(async (req, res) => {
    const { batchId } = req.params;

    const batch = await PigBatch.findById(batchId);
    if (!batch) {
        return res.status(404).json({ success: false, message: 'Batch not found' });
    }

    const mortalities = await PigMortality.find({ batch_id: batchId }).sort({ date: 1 });
    const incomes = await PiggeryIncome.find({ batch_id: batchId });
    const expenses = await PiggeryExpense.find({ batch_id: batchId });

    let totalMortality = 0;
    mortalities.forEach(m => {
        totalMortality += m.count;
    });

    const mortalityRate = batch.initial_count > 0 
        ? ((totalMortality / batch.initial_count) * 100).toFixed(2) 
        : 0;
    
    const totalIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0);
    const totalExpense = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const netProfit = totalIncome - totalExpense;

    res.status(200).json({
        success: true,
        data: {
            totalMortality,
            mortalityRate,
            totalIncome,
            totalExpense,
            netProfit,
            dailyLogs: mortalities // Using mortalities for the graph
        }
    });
});
