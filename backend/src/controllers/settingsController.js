import asyncHandler from 'express-async-handler';
import Settings from '../models/Settings.js';

// @desc    Get system settings
// @route   GET /api/settings
// @access  Private
export const getSettings = asyncHandler(async (req, res) => {
    let settings = await Settings.findOne();
    if (!settings) {
        settings = await Settings.create({
            companyName: 'New Lanka Livestock And Animals Produce Farm',
            companyAddress: 'Rathugala ,Wellassa ,Galgamuwa, Inginiygala.',
            companyPhone: '0760348159',
            companyEmail: 'janstephan06@gmail.com',
            currency: 'LKR',
            currencySymbol: 'Rs.',
            defaultTaxRate: 0,
            lowStockThreshold: 10,
        });
    }
    res.json({ success: true, data: settings });
});

// @desc    Update system settings
// @route   PUT /api/settings
// @access  Private/Admin
export const updateSettings = asyncHandler(async (req, res) => {
    let settings = await Settings.findOne();
    
    if (!settings) {
        settings = new Settings(req.body);
    } else {
        Object.assign(settings, req.body);
    }

    settings.updatedBy = req.user._id;
    await settings.save();

    res.json({ success: true, data: settings });
});
