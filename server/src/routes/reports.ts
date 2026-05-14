import { Router, Response } from 'express';
import ExcelJS from 'exceljs';
import { Order } from '../models/Order';
import { DailyReport } from '../models/DailyReport';
import { authenticate, AuthRequest } from '../middleware/auth';
import { getStartOfDay, getEndOfDay } from '../utils/helpers';

const router = Router();

router.get('/daily', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const dateParam = req.query.date ? new Date(req.query.date as string) : new Date();
    const start = getStartOfDay(dateParam);
    const end = getEndOfDay(dateParam);
    const orders = await Order.find({ orderTime: { $gte: start, $lte: end } });
    let totalUPI = 0, totalCash = 0, totalTax = 0, totalDiscount = 0;
    const itemMap = new Map<string, { name: string; quantity: number; revenue: number }>();
    const hourCounts: number[] = new Array(24).fill(0);
    orders.forEach(order => {
      if (order.paymentMethod === 'UPI') totalUPI += order.total;
      else totalCash += order.total;
      totalTax += order.tax;
      totalDiscount += order.discount;
      const hour = new Date(order.orderTime).getHours();
      hourCounts[hour]++;
      order.items.forEach(item => {
        const key = item.itemId.toString();
        const existing = itemMap.get(key);
        if (existing) { existing.quantity += item.quantity; existing.revenue += item.price * item.quantity; }
        else itemMap.set(key, { name: item.name, quantity: item.quantity, revenue: item.price * item.quantity });
      });
    });
    const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
    const itemsSold = Array.from(itemMap.entries()).map(([itemId, data]) => ({ itemId, ...data })).sort((a, b) => b.quantity - a.quantity);
    res.json({
      date: start, totalOrders: orders.length, totalUPIAmount: totalUPI, totalCashAmount: totalCash,
      totalRevenue: totalUPI + totalCash, totalTax, totalDiscount, itemsSold, peakHour, hourlyData: hourCounts,
    });
  } catch (error) { res.status(500).json({ message: 'Server error', error }); }
});

router.get('/history', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, period = 'day' } = req.query;
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();
    const orders = await Order.find({ orderTime: { $gte: getStartOfDay(start), $lte: getEndOfDay(end) } }).sort({ orderTime: 1 });
    const dailyMap = new Map<string, { orders: number; upi: number; cash: number; revenue: number }>();
    orders.forEach(order => {
      const key = new Date(order.orderTime).toISOString().split('T')[0];
      const existing = dailyMap.get(key) || { orders: 0, upi: 0, cash: 0, revenue: 0 };
      existing.orders++;
      if (order.paymentMethod === 'UPI') existing.upi += order.total;
      else existing.cash += order.total;
      existing.revenue += order.total;
      dailyMap.set(key, existing);
    });
    const history = Array.from(dailyMap.entries()).map(([date, data]) => ({ date, ...data }));
    res.json({ history, totalDays: history.length });
  } catch (error) { res.status(500).json({ message: 'Server error', error }); }
});

router.get('/export', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const dateParam = req.query.date ? new Date(req.query.date as string) : new Date();
    const start = getStartOfDay(dateParam);
    const end = getEndOfDay(dateParam);
    const orders = await Order.find({ orderTime: { $gte: start, $lte: end } }).sort({ orderTime: 1 });
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Daily Report');
    sheet.columns = [
      { header: 'Order ID', key: 'id', width: 15 },
      { header: 'Table', key: 'table', width: 8 },
      { header: 'Customer', key: 'customer', width: 20 },
      { header: 'Items', key: 'items', width: 40 },
      { header: 'Subtotal', key: 'subtotal', width: 12 },
      { header: 'Tax', key: 'tax', width: 10 },
      { header: 'Total', key: 'total', width: 12 },
      { header: 'Payment', key: 'payment', width: 10 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Time', key: 'time', width: 20 },
    ];
    orders.forEach(order => {
      sheet.addRow({
        id: String(order._id).slice(-8).toUpperCase(),
        table: order.tableNumber, customer: order.customerName,
        items: order.items.map(i => `${i.quantity}x ${i.name}`).join(', '),
        subtotal: order.subtotal, tax: order.tax, total: order.total,
        payment: order.paymentMethod, status: order.orderStatus,
        time: new Date(order.orderTime).toLocaleString(),
      });
    });
    res.set({ 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': `attachment; filename=report-${dateParam.toISOString().split('T')[0]}.xlsx` });
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) { res.status(500).json({ message: 'Server error', error }); }
});

export default router;
