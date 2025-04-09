import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  creditBalance: { type: Number, default: 7 },
  isVerified: { type: Boolean, default: false },
  verificationCode: { type: String, required: false },
  verificationCodeExpires: { type: Number, required: false }
});

export default mongoose.model('User', userSchema);
