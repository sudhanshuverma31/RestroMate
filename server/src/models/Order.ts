import mongoose, { Document, Schema } from 'mongoose';

export interface IOrderItem {
  itemId: mongoose.Types.ObjectId;
  name: string;
  quantity: number;
  price: number;
  specialInstructions: string;
}

export interface IOrder extends Document {
  tableNumber: number;
  customerName: string;
  items: IOrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: 'UPI' | 'CASH';
  paymentStatus: 'PENDING' | 'COMPLETED';
  orderStatus: 'PENDING' | 'PREPARING' | 'READY' | 'SERVED';
  estimatedTime: number;
  couponCode?: string;
  orderTime: Date;
  preparingTime?: Date;
  readyTime?: Date;
  servedTime?: Date;
}

const orderItemSchema = new Schema<IOrderItem>({
  itemId: {
    type: Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: true,
  },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
  specialInstructions: { type: String, default: '' },
}, { _id: false });

const orderSchema = new Schema<IOrder>({
  tableNumber: {
    type: Number,
    required: true,
  },
  customerName: {
    type: String,
    required: true,
    trim: true,
  },
  items: {
    type: [orderItemSchema],
    required: true,
    validate: [(v: IOrderItem[]) => v.length > 0, 'Order must have at least one item'],
  },
  subtotal: { type: Number, required: true, min: 0 },
  tax: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0, min: 0 },
  total: { type: Number, required: true, min: 0 },
  paymentMethod: {
    type: String,
    enum: ['UPI', 'CASH'],
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ['PENDING', 'COMPLETED'],
    default: 'PENDING',
  },
  orderStatus: {
    type: String,
    enum: ['PENDING', 'PREPARING', 'READY', 'SERVED'],
    default: 'PENDING',
  },
  estimatedTime: { type: Number, default: 0 },
  couponCode: { type: String, default: '' },
  orderTime: { type: Date, default: Date.now },
  preparingTime: { type: Date },
  readyTime: { type: Date },
  servedTime: { type: Date },
}, {
  timestamps: true,
});

export const Order = mongoose.model<IOrder>('Order', orderSchema);
