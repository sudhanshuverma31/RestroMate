import mongoose, { Document, Schema } from 'mongoose';

export interface IShopSettings extends Document {
  isOpen: boolean;
  openingTime: string;
  closingTime: string;
  restaurantName: string;
  lastClosedAt?: Date;
  lastOpenedAt?: Date;
}

const shopSettingsSchema = new Schema<IShopSettings>({
  isOpen: {
    type: Boolean,
    default: false,
  },
  openingTime: {
    type: String,
    default: '09:00',
  },
  closingTime: {
    type: String,
    default: '23:00',
  },
  restaurantName: {
    type: String,
    default: 'RestroMate',
  },
  lastClosedAt: { type: Date },
  lastOpenedAt: { type: Date },
}, {
  timestamps: true,
});

export const ShopSettings = mongoose.model<IShopSettings>('ShopSettings', shopSettingsSchema);
