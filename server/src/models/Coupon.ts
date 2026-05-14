import mongoose, { Document, Schema } from 'mongoose';

export interface ICoupon extends Document {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  maxDiscount: number;
  isActive: boolean;
  usageLimit: number;
  usedCount: number;
  validFrom: Date;
  validUntil: Date;
  createdAt: Date;
}

const couponSchema = new Schema<ICoupon>({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true,
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0,
  },
  minOrderAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  maxDiscount: {
    type: Number,
    default: 0, // 0 = no cap
    min: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  usageLimit: {
    type: Number,
    default: 0, // 0 = unlimited
    min: 0,
  },
  usedCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  validFrom: {
    type: Date,
    required: true,
  },
  validUntil: {
    type: Date,
    required: true,
  },
}, {
  timestamps: true,
});

export const Coupon = mongoose.model<ICoupon>('Coupon', couponSchema);
