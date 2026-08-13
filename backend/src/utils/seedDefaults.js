import UnitOfMeasure from '../models/UnitOfMeasure.js';
import Category from '../models/Category.js';
import CustomerGroup from '../models/CustomerGroup.js';
import Warehouse from '../models/Warehouse.js';
import Holiday from '../models/Holiday.js';
import User from '../models/User.js';
import { seedPermissions } from './seedPermissions.js';

const defaultUoms = [
    { name: 'Bag', symbol: 'bag', type: 'count' },
    { name: 'Piece', symbol: 'pc', type: 'count' },
    { name: 'Box', symbol: 'box', type: 'count' },
    { name: 'Carton', symbol: 'ctn', type: 'count' },
    { name: 'Kilogram', symbol: 'kg', type: 'weight' },
    { name: 'Metric Ton', symbol: 'MT', type: 'weight' },
    { name: 'Liter', symbol: 'L', type: 'volume' },
    { name: 'Milliliter', symbol: 'ml', type: 'volume' },
    { name: 'Bottle', symbol: 'btl', type: 'count' },
];

const defaultCategories = [
    { name: 'Poultry Feeds & Ingredients', code: 'POU', type: 'product', displayOrder: 1 },
    { name: 'Piggery Feeds & Supplements', code: 'PIG', type: 'product', displayOrder: 2 },
    { name: 'Livestock Medicines & Vaccines', code: 'MED', type: 'product', displayOrder: 3 },
    { name: 'Farm Equipment & Accessories', code: 'EQP', type: 'product', displayOrder: 4 },
    { name: 'Agricultural / Wholesale Goods', code: 'AGR', type: 'both', displayOrder: 5 },
    { name: 'Meat & Animal Produce', code: 'PRD', type: 'product', displayOrder: 6 },
];

const defaultCustomerGroups = [
    {
        name: 'Platinum',
        code: 'PLAT',
        description: 'Top-tier distributors with largest volumes',
        defaultPaymentTerms: { type: 'credit', creditDays: 45, defaultCreditLimit: 1000000 },
        defaultDiscountPercent: 12,
        priority: 100,
        color: '#6366f1',
    },
    {
        name: 'Gold',
        code: 'GOLD',
        description: 'Established wholesalers',
        defaultPaymentTerms: { type: 'credit', creditDays: 30, defaultCreditLimit: 500000 },
        defaultDiscountPercent: 8,
        priority: 75,
        color: '#f59e0b',
    },
    {
        name: 'Silver',
        code: 'SILV',
        description: 'Regular wholesale customers',
        defaultPaymentTerms: { type: 'credit', creditDays: 15, defaultCreditLimit: 200000 },
        defaultDiscountPercent: 5,
        priority: 50,
        color: '#94a3b8',
    },
    {
        name: 'Standard',
        code: 'STD',
        description: 'General customers, no credit terms',
        defaultPaymentTerms: { type: 'cod', creditDays: 0, defaultCreditLimit: 0 },
        defaultDiscountPercent: 0,
        priority: 10,
        color: '#64748b',
    },
];

const defaultWarehouse = {
    warehouseCode: 'MAIN',
    name: 'Main Warehouse',
    type: 'main',
    address: {
        line1: 'Configure address in settings',
        city: 'Colombo',
        country: 'Sri Lanka',
    },
    zones: [
        { code: 'RCV', name: 'Receiving Zone', type: 'receiving' },
        { code: 'STG', name: 'Storage Zone', type: 'storage' },
        { code: 'DSP', name: 'Dispatch Zone', type: 'dispatch' },
    ],
    capabilities: {
        canShipDirectly: true,
        canReceiveGoods: true,
    },
    isDefault: true,
    isActive: true,
};

// Add this function to your existing seedDefaults.js
const seedSriLankaHolidays = async () => {
    const existing = await Holiday.countDocuments();
    if (existing > 0) {
        console.log('✓ Holidays already seeded, skipping');
        return;
    }

    // Sri Lanka public holidays 2026 (verify with client's accountant before production)
    const holidays2026 = [
        { name: 'Duruthu Full Moon Poya Day', date: '2026-01-03', type: 'poya' },
        { name: 'Tamil Thai Pongal Day', date: '2026-01-14', type: 'religious' },
        { name: 'Independence Day', date: '2026-02-04', type: 'national' },
        { name: 'Navam Full Moon Poya Day', date: '2026-02-01', type: 'poya' },
        { name: 'Mahasivarathri Day', date: '2026-02-15', type: 'religious' },
        { name: 'Medin Full Moon Poya Day', date: '2026-03-03', type: 'poya' },
        { name: 'Bak Full Moon Poya Day', date: '2026-04-01', type: 'poya' },
        { name: 'Day prior to Sinhala and Tamil New Year', date: '2026-04-13', type: 'national' },
        { name: 'Sinhala and Tamil New Year Day', date: '2026-04-14', type: 'national' },
        { name: 'Good Friday', date: '2026-04-03', type: 'religious' },
        { name: 'May Day (Labour Day)', date: '2026-05-01', type: 'national' },
        { name: 'Vesak Full Moon Poya Day', date: '2026-05-01', type: 'poya' },
        { name: 'Day following Vesak', date: '2026-05-02', type: 'poya' },
        { name: 'Poson Full Moon Poya Day', date: '2026-05-31', type: 'poya' },
        { name: 'Esala Full Moon Poya Day', date: '2026-06-29', type: 'poya' },
        { name: 'Nikini Full Moon Poya Day', date: '2026-07-29', type: 'poya' },
        { name: 'Binara Full Moon Poya Day', date: '2026-08-27', type: 'poya' },
        { name: 'Vap Full Moon Poya Day', date: '2026-09-26', type: 'poya' },
        { name: 'Deepavali', date: '2026-10-20', type: 'religious' },
        { name: 'Il Full Moon Poya Day', date: '2026-10-25', type: 'poya' },
        { name: 'Unduvap Full Moon Poya Day', date: '2026-11-24', type: 'poya' },
        { name: 'Christmas Day', date: '2026-12-25', type: 'religious' },
    ];

    for (const h of holidays2026) {
        await Holiday.create({
            name: h.name,
            date: new Date(h.date),
            type: h.type,
            isActive: true,
        });
    }

    console.log(`✓ Seeded ${holidays2026.length} Sri Lanka holidays for 2026`);
};

const seedDefaultUsers = async () => {
    const usersToSeed = [
        {
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@lankalivestock.com',
            phone: '+94771234567',
            password: 'Admin123!',
            role: 'admin',
        },
        {
            firstName: 'Admin',
            lastName: 'System',
            email: 'admin@example.com',
            phone: '+94771234560',
            password: 'Admin123!',
            role: 'admin',
        },
        {
            firstName: 'Farm',
            lastName: 'Manager',
            email: 'manager@lankalivestock.com',
            phone: '+94771234568',
            password: 'Manager123!',
            role: 'manager',
        },
        {
            firstName: 'Farm',
            lastName: 'Manager',
            email: 'manager@example.com',
            phone: '+94771234569',
            password: 'Manager123!',
            role: 'manager',
        }
    ];

    for (const u of usersToSeed) {
        let user = await User.findOne({ email: u.email }).select('+password');
        if (!user) {
            await User.create(u);
            console.log(`✓ Seeded user (${u.email}) [Role: ${u.role}]`);
        } else {
            user.password = u.password;
            user.isActive = true;
            user.lockedUntil = undefined;
            user.failedLoginAttempts = 0;
            user.role = u.role;
            await user.save();
            console.log(`✓ Updated & unlocked user (${u.email}) [Role: ${u.role}]`);
        }
    }
};

// In your main seedDefaults function, add:
// await seedSriLankaHolidays();

export const seedDefaults = async () => {
    try {
        const uomCount = await UnitOfMeasure.countDocuments();
        if (uomCount === 0) {
            await UnitOfMeasure.insertMany(defaultUoms);
            console.log(`✓ Seeded ${defaultUoms.length} Units of Measure`);
        }

        const catCount = await Category.countDocuments();
        if (catCount === 0) {
            await Category.insertMany(defaultCategories);
            console.log(`✓ Seeded ${defaultCategories.length} default Categories`);
        }

        // ADD THIS BLOCK:
        const groupCount = await CustomerGroup.countDocuments();
        if (groupCount === 0) {
            await CustomerGroup.insertMany(defaultCustomerGroups);
            console.log(`✓ Seeded ${defaultCustomerGroups.length} Customer Groups`);
        }

        const warehouseCount = await Warehouse.countDocuments();
        if (warehouseCount === 0) {
            await Warehouse.create(defaultWarehouse);
            console.log(`✓ Seeded default Warehouse (MAIN)`);
        }

        await seedDefaultUsers();
        await seedSriLankaHolidays();
        await seedPermissions();

    } catch (error) {
        console.error('Seed error:', error.message);
    }
};