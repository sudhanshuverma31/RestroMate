import mongoose, { Document, Schema } from 'mongoose';

export interface ITable extends Document {
  tableNumber: number;
  qrCode: string;
  isActive: boolean;
  currentOrderId?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const tableSchema = new Schema<ITable>({
  tableNumber: {
    type: Number,
    required: true,
    unique: true,
    min: 1,
    max: 50,
  },
  qrCode: {
    type: String,
    default: '',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  currentOrderId: {
    type: Schema.Types.ObjectId,
    ref: 'Order',
    default: null,
  },
}, {
  timestamps: true,
});

export const Table = mongoose.model<ITable>('Table', tableSchema);
