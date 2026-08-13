import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;

const connectDB = async (retryCount = 0) => {
    try {
        let uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/wholesale_system';
        if (mongoServer) {
            uri = mongoServer.getUri();
        } else if (uri.includes('localhost')) {
            uri = uri.replace('localhost', '127.0.0.1');
        }

        const conn = await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 5000,
        });
        console.log(`✓ MongoDB Connected: ${conn.connection.host}`);
        
        if (mongoServer) {
            console.log(`✓ Using In-Memory Database (Fallback)`);
        }
        
        return conn;
    } catch (error) {
        console.error(`✗ MongoDB Connection Error: ${error.message}`);
        
        if (!mongoServer && retryCount < 1) {
            console.log('  Falling back to In-Memory Database...');
            try {
                mongoServer = await MongoMemoryServer.create();
                return connectDB(retryCount + 1);
            } catch (memErr) {
                console.error('  In-Memory Database Error:', memErr.message);
            }
        }
        
        console.log('  Retrying connection in 5 seconds...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        return connectDB(retryCount);
    }
};

export default connectDB;