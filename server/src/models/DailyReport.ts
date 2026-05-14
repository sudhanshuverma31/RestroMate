import mongoose, { Document, Schema } from 'mongoose';

export interface IDailyReportItem {
  itemId: mongoose.Types.ObjectId;
  name: string;
  quantity: number;
  revenue: number;
}

export interface IDailyReport extends Document {
  date: Date;
  totalOrders: number;
  totalUPIAmount: number;
  totalCashAmount: number;
  totalRevenue: number;
  totalTax: number;
  totalDiscount: number;
  itemsSold: IDailyReportItem[];
  peakHour: number;
  createdAt: Date;
}

const dailyReportSchema = new Schema<IDailyReport>({
  date: {
    type: Date,
    required: true,
    unique: true,
  },
  totalOrders: { type: Number, default: 0 },
  totalUPIAmount: { type: Number, default: 0 },
  totalCashAmount: { type: Number, default: 0 },
  totalRevenue: { type: Number, default: 0 },
  totalTax: { type: Number, default: 0 },
  totalDiscount: { type: Number, default: 0 },
  itemsSold: [{
    itemId: { type: Schema.Types.ObjectId, ref: 'MenuItem' },
    name: String,
    quantity: Number,
    revenue: Number,
  }],
  peakHour: { type: Number, default: 0 },
}, {
  timestamps: true,
});

export const DailyReport = mongoose.model<IDailyReport>('DailyReport', dailyReportSchema);
