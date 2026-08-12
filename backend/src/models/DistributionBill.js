import mongoose from 'mongoose';

const distributionBillSchema = new mongoose.Schema({
    bill_number: {
        type: String,
        required: true,
        unique: true
    },
    type: {
        type: String,
        required: true,
        enum: ['SALE', 'PURCHASE']
    },
    paymentMethod: {
        type: String,
        enum: ['Cash', 'Cheque', 'Credit'],
        default: 'Cash',
        required: true
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    party_name: {
        type: String,
        required: true,
        trim: true
    },
    items: [{
        item_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'DistributionItem',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 0.01
        },
        unit_price: {
            type: Number,
            required: true,
            min: 0
        },
        total: {
            type: Number,
            required: true,
            min: 0
        }
    }],
    grand_total: {
        type: Number,
        required: true,
        min: 0
    },
    remarks: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

const DistributionBill = mongoose.model('DistributionBill', distributionBillSchema);
export default DistributionBill;
