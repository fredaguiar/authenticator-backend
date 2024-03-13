import mongoose, { Types } from 'mongoose';
import bcrypt from 'bcrypt';

export type Country = 'BR' | 'USA';

export type TUser = {
  firstName: string;
  lastName: string;
  language: string;
  country: Country;
  email: string;
  phoneCountry: string;
  phone: string;
  password?: string;
  token?: string;
  emailVerified: boolean;
  mobileVerified: boolean;
  mobileVerifyCode?: number;
  introductionViewed?: boolean;
  _id?: Types.ObjectId;
};

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  language: { type: String, required: true },
  country: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String, required: true },
  phoneCountry: { type: String, required: true },
  password: { type: String, required: true, minLength: 1 },
  emailVerified: { type: Boolean, required: true, default: false },
  mobileVerified: { type: Boolean, required: true, default: false },
  mobileVerifyCode: { type: Number, required: false },
  introductionViewed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

userSchema.pre('save', async function (next, err) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt();
    this.password = bcrypt.hashSync(this.password, salt);
  } catch (err) {}
  next();
});

const User = mongoose.model<TUser>('user', userSchema);

export default User;
