import mongoose from 'mongoose';

const poultryDailyLogSchema = new mongoose.Schema({
    batch_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PoultryBatch',
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },
    mortality_count: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
    },
    feed_consumed_kg: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
    },
    average_weight_kg: {
        type: Number,
        required: true,
        min: 0,
    }
}, {
    timestamps: true
});

const PoultryDailyLog = mongoose.model('PoultryDailyLog', poultryDailyLogSchema);

export default PoultryDailyLog;
