import mongoose, { Schema, Document } from 'mongoose';

export interface IDeviceSession extends Document {
    userId: mongoose.Types.ObjectId;
    sessionId: string;
    deviceId: string;
    ipAddress?: string;
    browserInfo?: string;
    lastActivity: Date;
    loginTime: Date;
}

const DeviceSessionSchema = new Schema<IDeviceSession>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    sessionId: { type: String, required: true },
    deviceId: { type: String, required: true },
    ipAddress: { type: String, default: '' },
    browserInfo: { type: String, default: '' },
    lastActivity: { type: Date, default: Date.now },
    loginTime: { type: Date, default: Date.now },
}, { timestamps: true });

export const DeviceSession = mongoose.models.DeviceSession || mongoose.model<IDeviceSession>('DeviceSession', DeviceSessionSchema);
