import mongoose from 'mongoose';
import dotenv from 'dotenv';
import PoultryBatch from './src/models/PoultryBatch.js';
import PoultryDailyLog from './src/models/PoultryDailyLog.js';

dotenv.config();

async function seedExample() {
    try {
        const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/wholesale_system';
        await mongoose.connect(uri);
        console.log('✓ Connected to MongoDB');

        // Check if a batch exists, else create one
        let batch = await PoultryBatch.findOne({ status: 'active' });
        if (!batch) {
            batch = await PoultryBatch.create({
                batch_name: 'Batch-2026-01 (Broiler)',
                initial_birds: 500,
                current_birds: 495,
                breed: 'Cobb 500',
                stage: 'Grower',
                raised_for: 'Broiler Meat',
                acquisition_date: new Date(),
                status: 'active'
            });
            console.log('✓ Created sample Poultry Batch:', batch.batch_name);
        } else {
            console.log('✓ Found existing batch:', batch.batch_name);
        }

        // Add 2 sample Daily Logs
        const today = new Date();
        const yesterday = new Date(Date.now() - 86400000);

        const log1 = await PoultryDailyLog.create({
            batch_id: batch._id,
            date: yesterday,
            mortality_count: 2,
            feed_consumed_kg: 45.5,
            average_weight_kg: 1.75
        });

        const log2 = await PoultryDailyLog.create({
            batch_id: batch._id,
            date: today,
            mortality_count: 3,
            feed_consumed_kg: 48.0,
            average_weight_kg: 1.82
        });

        console.log('\n======================================');
        console.log('✓ Sample Poultry Batch & Daily Logs Created!');
        console.log('  Batch:', batch.batch_name);
        console.log('  Log 1:', log1.date.toISOString().split('T')[0], '| Mortality:', log1.mortality_count, '| Feed:', log1.feed_consumed_kg, 'kg | Weight:', log1.average_weight_kg, 'kg');
        console.log('  Log 2:', log2.date.toISOString().split('T')[0], '| Mortality:', log2.mortality_count, '| Feed:', log2.feed_consumed_kg, 'kg | Weight:', log2.average_weight_kg, 'kg');
        console.log('======================================\n');

        process.exit(0);
    } catch (err) {
        console.error('Error seeding example:', err.message);
        process.exit(1);
    }
}

seedExample();
