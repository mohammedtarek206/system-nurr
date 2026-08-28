import mongoose, { Schema, Document } from 'mongoose';

export interface ISpecialization extends Document {
    name: string;
    arName: string;
    slug: string;
    description: string;
    icon: string;
    image: string;
    active: boolean;
    order: number;
    createdAt: Date;
    updatedAt: Date;
}

const SpecializationSchema = new Schema<ISpecialization>({
    name: { type: String, required: true },
    arName: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, default: '' },
    icon: { type: String, default: '' },
    image: { type: String, default: '' },
    active: { type: Boolean, default: true },
    order: { type: Number, default: 0 }
}, { timestamps: true });

export const Specialization = mongoose.models.Specialization || mongoose.model<ISpecialization>('Specialization', SpecializationSchema);
