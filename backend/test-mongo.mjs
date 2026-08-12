import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const InquirySchema = new mongoose.Schema({
    interestedProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    deletedAt: { type: Date, default: null }
}, { strict: false });

const Inquiry = mongoose.model('Inquiry', InquirySchema);
const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));

async function test() {
    try {
        console.log('Connecting to', process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected');

        const inquiries = await Inquiry.find({ deletedAt: null })
            .populate('interestedProducts', 'name productCode')
            .populate('assignedTo', 'firstName lastName')
            .limit(10);
        
        console.log('Found', inquiries.length, 'inquiries');
    } catch (e) {
        console.error('Error:', e);
    } finally {
        mongoose.disconnect();
    }
}

test();
