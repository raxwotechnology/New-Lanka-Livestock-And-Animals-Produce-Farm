import mongoose from 'mongoose';

const pigBreedingSchema = new mongoose.Schema({
    sow_batch_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PigBatch',
        required: true
    },
    mating_date: {
        type: Date,
        required: true
    },
    expected_farrowing_date: {
        type: Date,
        required: true
    },
    actual_farrowing_date: {
        type: Date
    },
    piglets_born_alive: {
        type: Number,
        min: 0,
        default: 0
    },
    piglets_stillborn: {
        type: Number,
        min: 0,
        default: 0
    },
    status: {
        type: String,
        enum: ['pregnant', 'farrowed', 'failed'],
        default: 'pregnant'
    },
    notes: {
        type: String
    }
}, {
    timestamps: true
});

const PigBreeding = mongoose.model('PigBreeding', pigBreedingSchema);
export default PigBreeding;
