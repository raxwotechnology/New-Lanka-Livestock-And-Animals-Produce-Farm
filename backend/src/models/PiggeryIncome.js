import mongoose from 'mongoose';

const piggeryIncomeSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    category: {
        type: String,
        required: true,
        enum: ['Pork Sale', 'Live Pig Sale', 'Other']
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

const PiggeryIncome = mongoose.model('PiggeryIncome', piggeryIncomeSchema);
export default PiggeryIncome;
