import mongoose, { Schema, Document } from 'mongoose';

export interface IAccessRequest extends Document {
    userId: mongoose.Types.ObjectId;
    contentType: 'COURSE' | 'SECTION' | 'LESSON' | 'SUMMARY' | 'EXAM' | 'RESOURCE';
    contentId: mongoose.Types.ObjectId;
    specializationId: mongoose.Types.ObjectId;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
    requestedAt: Date;
    reviewedAt?: Date;
    reviewedBy?: mongoose.Types.ObjectId;
    rejectionReason?: string;
    createdAt: Date;
    updatedAt: Date;
}

const AccessRequestSchema = new Schema<IAccessRequest>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    contentType: {
        type: String,
        enum: ['COURSE', 'SECTION', 'LESSON', 'SUMMARY', 'EXAM', 'RESOURCE'],
        required: true
    },
    contentId: { type: Schema.Types.ObjectId, required: true },
    specializationId: { type: Schema.Types.ObjectId, ref: 'Specialization', required: true },
    status: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED', 'EXPIRED'],
        default: 'PENDING'
    },
    requestedAt: { type: Date, default: Date.now },
    reviewedAt: { type: Date },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    rejectionReason: { type: String }
}, { timestamps: true });

export const AccessRequest = mongoose.models.AccessRequest || mongoose.model<IAccessRequest>('AccessRequest', AccessRequestSchema);
