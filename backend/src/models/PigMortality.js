import mongoose from 'mongoose';

const pigMortalitySchema = new mongoose.Schema({
    batch_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PigBatch',
        required: true
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    count: {
        type: Number,
        required: true,
        min: 1
    },
    cause: {
        type: String,
        required: true
    },
    notes: {
        type: String
    }
}, {
    timestamps: true
});

// Middleware to decrement current_count on the associated batch after mortality is saved
pigMortalitySchema.post('save', async function (doc, next) {
    try {
        const PigBatch = mongoose.model('PigBatch');
        await PigBatch.findByIdAndUpdate(
            doc.batch_id,
            { $inc: { current_count: -doc.count } }
        );
        next();
    } catch (error) {
        next(error);
    }
});

const PigMortality = mongoose.model('PigMortality', pigMortalitySchema);
export default PigMortality;
