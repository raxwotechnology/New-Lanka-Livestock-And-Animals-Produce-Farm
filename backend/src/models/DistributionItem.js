import mongoose from 'mongoose';

const distributionItemSchema = new mongoose.Schema({
    date: {
        type: Date,
        default: Date.now
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    selling_price: {
        type: Number,
        required: true,
        min: 0
    },
    stock_quantity: {
        type: Number,
        required: true,
        default: 0
    },
    unit: {
        type: String,
        required: true,
        default: 'kg'
    },
    attachments: [{
        file_data: { type: String, required: true }, // base64
        file_name: { type: String, required: true },
        file_type: { type: String, required: true },
        uploaded_at: { type: Date, default: Date.now }
    }]
}, {
    timestamps: true
});

const DistributionItem = mongoose.model('DistributionItem', distributionItemSchema);
export default DistributionItem;
