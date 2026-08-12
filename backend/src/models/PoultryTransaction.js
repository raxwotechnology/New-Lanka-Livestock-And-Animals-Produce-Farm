import mongoose from 'mongoose';

const poultryTransactionSchema = new mongoose.Schema({
    batch_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PoultryBatch',
        required: true
    },
    type: {
        type: String,
        enum: ['income', 'expense'],
        required: true
    },
    category: {
        type: String, // e.g., 'Labor and Employment', 'Sales of poultry', 'Purchase of Feed'
        required: true
    },
    description: {
        type: String, // e.g., 'Nandasena Salary', 'Live Chicken', 'Finisher 30'
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    paymentMethod: {
        type: String,
        enum: ['Cash', 'Cheque', 'Credit'],
        default: 'Cash',
        required: true
    },
    date: {
        type: Date,
        default: Date.now,
        required: true
    }
}, {
    timestamps: true
});

const PoultryTransaction = mongoose.model('PoultryTransaction', poultryTransactionSchema);
export default PoultryTransaction;
