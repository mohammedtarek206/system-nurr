import mongoose, { Schema, Document } from 'mongoose';

export interface ISummaryCategory extends Document {
    name: string;
    arName: string;
    order: number;
    createdAt: Date;
}

const SummaryCategorySchema = new Schema<ISummaryCategory>({
    name: { type: String, required: true, unique: true },
    arName: { type: String, required: true },
    order: { type: Number, default: 0 },
}, { timestamps: true });

export const SummaryCategory = mongoose.models.SummaryCategory || mongoose.model<ISummaryCategory>('SummaryCategory', SummaryCategorySchema);
