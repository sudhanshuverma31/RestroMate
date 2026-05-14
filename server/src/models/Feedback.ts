import mongoose, { Document, Schema } from 'mongoose';

export interface IFeedback extends Document {
  orderId: mongoose.Types.ObjectId;
  tableNumber: number;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

const feedbackSchema = new Schema<IFeedback>({
  orderId: {
    type: Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
  },
  tableNumber: { type: Number, required: true },
  customerName: { type: String, required: true },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    default: '',
    trim: true,
  },
}, {
  timestamps: true,
});

export const Feedback = mongoose.model<IFeedback>('Feedback', feedbackSchema);
