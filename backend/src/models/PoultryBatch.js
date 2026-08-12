import mongoose from 'mongoose';

const poultryBatchSchema = new mongoose.Schema({
    batch_name: {
        type: String,
        required: true,
        trim: true,
    },
    initial_birds: {
        type: Number,
        required: true,
        min: 1,
    },
    current_birds: {
        type: Number,
        required: true,
        min: 0,
    },
    animal: {
        type: String,
        default: 'Chicken',
        trim: true,
    },
    tracking: {
        type: String,
        default: 'Group',
        trim: true,
    },
    breed: {
        type: String,
        trim: true,
    },
    stage: {
        type: String,
        trim: true,
    },
    raised_for: {
        type: String,
        trim: true,
    },
    acquisition_date: {
        type: Date,
        default: Date.now,
    },
    status: {
        type: String,
        enum: ['active', 'completed'],
        default: 'active',
    }
}, {
    timestamps: true
});

const PoultryBatch = mongoose.model('PoultryBatch', poultryBatchSchema);

export default PoultryBatch;
