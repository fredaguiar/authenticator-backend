import mongoose, { Types } from 'mongoose';

export type TSafe = {
  name: string;
  _id?: Types.ObjectId;
};

const safeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

safeSchema.pre('save', async function (next, err) {
  next();
});

export const Safe = mongoose.model<TSafe>('safe', safeSchema);
export { safeSchema };
