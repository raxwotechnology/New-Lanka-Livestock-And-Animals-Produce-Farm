import mongoose from 'mongoose';

const pigBatchSchema = new mongoose.Schema({
    batch_number: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },

    initial_count: {
        type: Number,
        required: true,
        min: 1
    },
    current_count: {
        type: Number,
        required: true,
        min: 0
    },
    acquisition_date: {
        type: Date,
        required: true,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['active', 'completed'],
        default: 'active'
    },
    notes: {
        type: String
    },
    breed: {
        type: String,
        trim: true
    },
    housing: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

const PigBatch = mongoose.model('PigBatch', pigBatchSchema);
export default PigBatch;
