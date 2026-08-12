import mongoose from 'mongoose';

const editRequestSchema = new mongoose.Schema({
    managerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    moduleName: {
        type: String,
        required: true,
        trim: true
    },
    referenceString: {
        type: String,
        required: true,
        trim: true
    },
    reason: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    approvedRecordId: {
        type: String, // String because it could be ObjectId or custom ID depending on the module
        default: null
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    approvedAt: {
        type: Date,
        default: null
    }
}, { timestamps: true });

const EditRequest = mongoose.model('EditRequest', editRequestSchema);
export default EditRequest;
