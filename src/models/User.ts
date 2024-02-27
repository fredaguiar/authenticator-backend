import mongoose, { Types } from 'mongoose';
import bcrypt from 'bcrypt';

export type TUser = {
  name: string;
  email: string;
  password: string;
  _id?: Types.ObjectId;
};

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    minLength: 6,
  },
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
