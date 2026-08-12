import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import jwt from 'jsonwebtoken';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const UserSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', UserSchema);

async function test() {
    try {
        console.log('Connecting to', process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI);
        
        const user = await User.findOne({ email: 'admin@farm.com' });
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
        
        console.log('Got token. Calling API...');
        
        const res = await fetch('http://localhost:5000/api/crm/inquiries?limit=100', {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.ok) {
            const data = await res.json();
            console.log('Success!', data.data.length);
        } else {
            console.log('HTTP Error:', res.status);
            console.log('Response body:', await res.text());
        }
    } catch (e) {
        console.error('Error:', e);
    } finally {
        mongoose.disconnect();
    }
}

test();
