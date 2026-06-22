import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  arName: string;
  icon: string;
  createdAt: Date;
}

const CategorySchema = new Schema<ICategory>({
  name: { type: String, required: true }, // e.g. "Fundamentals"
  arName: { type: String, required: true }, // e.g. "أساسيات التمريض"
  icon: { type: String, default: '📚' },
}, { timestamps: true });

export const Category = mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);
