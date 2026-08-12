import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from './src/models/Category.js';
import UnitOfMeasure from './src/models/UnitOfMeasure.js';
import { seedDefaults } from './src/utils/seedDefaults.js';

dotenv.config();

const resetCategories = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Delete existing
        await Category.deleteMany({});
        console.log('Deleted existing categories');
        
        await UnitOfMeasure.deleteMany({});
        console.log('Deleted existing UOMs');

        // Re-seed
        await seedDefaults();
        console.log('Reseeded successfully');

        process.exit(0);
    } catch (error) {
        console.error('Error resetting categories:', error);
        process.exit(1);
    }
};

resetCategories();
