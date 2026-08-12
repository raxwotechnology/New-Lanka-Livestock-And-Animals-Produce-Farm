import mongoose from 'mongoose';

const piggeryExpenseSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    category: {
        type: String,
        required: true,
        enum: ['Feed', 'Medicine', 'Maintenance', 'Transport', 'Other']
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    description: {
        type: String,
        required: true
    },
    paymentMethod: {
        type: String,
        enum: ['Cash', 'Cheque', 'Credit'],
        default: 'Cash',
        required: true
    },
    batch_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PigBatch'
    }
}, {
    timestamps: true
});

const PiggeryExpense = mongoose.model('PiggeryExpense', piggeryExpenseSchema);
export default PiggeryExpense;
