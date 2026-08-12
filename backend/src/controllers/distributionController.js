import DistributionItem from '../models/DistributionItem.js';
import DistributionBill from '../models/DistributionBill.js';
import asyncHandler from 'express-async-handler';

// --- Items ---
export const getItems = asyncHandler(async (req, res) => {
    const items = await DistributionItem.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: items });
});

export const getItemById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const item = await DistributionItem.findById(id);
    if (!item) {
        return res.status(404).json({ success: false, message: 'Item not found' });
    }

    // Fetch history
    const bills = await DistributionBill.find({ 'items.item_id': id }).sort({ date: -1, createdAt: -1 });
    
    // Process bills to only include the relevant item's quantities and totals
    const history = bills.map(b => {
        const lineItem = b.items.find(i => i.item_id.toString() === id);
        return {
            bill_id: b._id,
            bill_number: b.bill_number,
            date: b.date,
            type: b.type,
            party_name: b.party_name,
            paymentMethod: b.paymentMethod,
            quantity: lineItem ? lineItem.quantity : 0,
            unit_price: lineItem ? lineItem.unit_price : 0,
            total: lineItem ? lineItem.total : 0
        };
    });

    res.status(200).json({ success: true, data: { item, history } });
});

export const createItem = asyncHandler(async (req, res) => {
    const item = await DistributionItem.create(req.body);
    res.status(201).json({ success: true, data: item });
});

export const updateItem = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const item = await DistributionItem.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true
    });
    
    if (!item) {
        return res.status(404).json({ success: false, message: 'Item not found' });
    }
    
    res.status(200).json({ success: true, data: item });
});

export const deleteItem = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const item = await DistributionItem.findByIdAndDelete(id);
    if (!item) {
        return res.status(404).json({ success: false, message: 'Item not found' });
    }
    
    res.status(200).json({ success: true, message: 'Item deleted successfully' });
});

export const uploadItemAttachment = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { file_data, file_name, file_type } = req.body;

    if (!file_data) return res.status(400).json({ success: false, message: 'No file provided' });

    const item = await DistributionItem.findById(id);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

    item.attachments.push({ file_data, file_name, file_type });
    await item.save();

    res.status(200).json({ success: true, data: item.attachments });
});

export const deleteItemAttachment = asyncHandler(async (req, res) => {
    const { id, attachmentId } = req.params;

    const item = await DistributionItem.findById(id);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

    item.attachments = item.attachments.filter(a => a._id.toString() !== attachmentId);
    await item.save();

    res.status(200).json({ success: true, data: item.attachments });
});

// --- Bills (Sales & Purchases) ---
export const getBills = asyncHandler(async (req, res) => {

    const { paymentMethod } = req.query;
    const filter = {};
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    const bills = await DistributionBill.find(filter)
        .populate('items.item_id', 'name category unit')
        .sort({ date: -1, createdAt: -1 });
    res.status(200).json({ success: true, data: bills });
});

export const createBill = asyncHandler(async (req, res) => {
    const { type, items, grand_total } = req.body;
    
    // Create the bill
    const bill = await DistributionBill.create(req.body);
    
    // Update stock quantities based on bill type
    for (const item of items) {
        const distItem = await DistributionItem.findById(item.item_id);
        if (distItem) {
            if (type === 'PURCHASE') {
                distItem.stock_quantity += Number(item.quantity);
            } else if (type === 'SALE') {
                distItem.stock_quantity -= Number(item.quantity);
            }
            await distItem.save();
        }
    }
    
    const populated = await bill.populate('items.item_id', 'name category unit');
    res.status(201).json({ success: true, data: populated });
});

export const updateBill = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { type, items, grand_total } = req.body;

    const oldBill = await DistributionBill.findById(id);
    if (!oldBill) {
        return res.status(404).json({ success: false, message: 'Bill not found' });
    }

    // Revert old items stock
    for (const item of oldBill.items) {
        const distItem = await DistributionItem.findById(item.item_id);
        if (distItem) {
            if (oldBill.type === 'PURCHASE') distItem.stock_quantity -= Number(item.quantity);
            else if (oldBill.type === 'SALE') distItem.stock_quantity += Number(item.quantity);
            await distItem.save();
        }
    }

    // Apply new items stock
    for (const item of items) {
        const distItem = await DistributionItem.findById(item.item_id);
        if (distItem) {
            if (type === 'PURCHASE') distItem.stock_quantity += Number(item.quantity);
            else if (type === 'SALE') distItem.stock_quantity -= Number(item.quantity);
            await distItem.save();
        }
    }

    const updatedBill = await DistributionBill.findByIdAndUpdate(id, req.body, { new: true });
    const populated = await updatedBill.populate('items.item_id', 'name category unit');
    res.status(200).json({ success: true, data: populated });
});

export const deleteBill = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const bill = await DistributionBill.findById(id);
    if (!bill) {
        return res.status(404).json({ success: false, message: 'Bill not found' });
    }

    // Reverse stock quantities based on bill type
    for (const item of bill.items) {
        const distItem = await DistributionItem.findById(item.item_id);
        if (distItem) {
            if (bill.type === 'PURCHASE') {
                distItem.stock_quantity -= Number(item.quantity);
            } else if (bill.type === 'SALE') {
                distItem.stock_quantity += Number(item.quantity);
            }
            await distItem.save();
        }
    }
    
    await DistributionBill.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: 'Bill deleted successfully' });
});

// --- Summary / Reports ---
export const getSummary = asyncHandler(async (req, res) => {

    const items = await DistributionItem.find();
    
    const stockValuation = items.reduce((acc, item) => acc + (item.stock_quantity * item.selling_price), 0);
    const lowStockItems = items.filter(i => i.stock_quantity <= 10).length;

    const billsAgg = await DistributionBill.aggregate([
        {
            $group: {
                _id: '$type',
                totalAmount: { $sum: '$grand_total' },
                count: { $sum: 1 }
            }
        }
    ]);
    
    let totalSales = 0;
    let totalPurchases = 0;
    
    billsAgg.forEach(b => {
        if (b._id === 'SALE') totalSales = b.totalAmount;
        if (b._id === 'PURCHASE') totalPurchases = b.totalAmount;
    });

    const itemsData = items.map(i => ({
        name: i.name,
        stock: i.stock_quantity,
        value: i.stock_quantity * i.selling_price
    }));

    res.status(200).json({
        success: true,
        data: {
            totalSales,
            totalPurchases,
            stockValuation,
            totalItems: items.length,
            lowStockItems,
            itemsData
        }
    });
});
