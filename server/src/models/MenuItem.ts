import mongoose, { Document, Schema } from 'mongoose';

export interface IMenuItem extends Document {
  name: string;
  price: number;
  category: string;
  description: string;
  imageUrl: string;
  isAvailable: boolean;
  stock: number;
  createdAt: Date;
}

const menuItemSchema = new Schema<IMenuItem>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  category: {
    type: String,
    required: true,
    enum: ['Starters', 'Main Course', 'Desserts', 'Drinks', 'Snacks', 'Breads', 'Rice', 'Combos'],
    trim: true,
  },
  description: {
    type: String,
    default: '',
    trim: true,
  },
  imageUrl: {
    type: String,
    default: '',
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  stock: {
    type: Number,
    default: -1, // -1 means unlimited
    min: -1,
  },
}, {
  timestamps: true,
});

export const MenuItem = mongoose.model<IMenuItem>('MenuItem', menuItemSchema);
