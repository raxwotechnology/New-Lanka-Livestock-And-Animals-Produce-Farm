import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;

const connectDB = async (retryCount = 0) => {
    try {
        let uri = process.env.MONGO_URI;
        if (mongoServer) {
            uri = mongoServer.getUri();
        }

        const conn = await mongoose.connect(uri);
        console.log(`✓ MongoDB Connected: ${conn.connection.host}`);
        
        if (mongoServer) {
            console.log(`✓ Using In-Memory Database (Fallback)`);
        }
        
        return conn;
    } catch (error) {
        console.error(`✗ MongoDB Connection Error: ${error.message}`);
        
        if (!mongoServer && retryCount < 1) {
            console.log('  Falling back to In-Memory Database...');
            mongoServer = await MongoMemoryServer.create();
            return connectDB(retryCount + 1);
        }
        
        console.log('  Retrying connection in 5 seconds...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        return connectDB(retryCount);
    }
};

export default connectDB;