import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/farm').then(async () => {
    const db = mongoose.connection.db;
    const collection = db.collection('users');
    const user = await collection.findOne({email: 'admin@farm.com'});
    console.log('Admin user:', user);
    
    if (user) {
        const bcrypt = await import('bcryptjs');
        const salt = await bcrypt.default.genSalt(10);
        const hashedPassword = await bcrypt.default.hash('Admin123!', salt);
        await collection.updateOne({email: 'admin@farm.com'}, {$set: {password: hashedPassword, failedLoginAttempts: 0, lockedUntil: null}});
        console.log('Updated admin password to Admin123! and unlocked account.');
    } else {
        console.log('Admin user not found!');
    }
    process.exit(0);
}).catch(console.error);
