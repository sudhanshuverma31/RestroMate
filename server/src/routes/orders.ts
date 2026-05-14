import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Order } from '../models/Order';
import { MenuItem } from '../models/MenuItem';
import { Coupon } from '../models/Coupon';
import { ShopSettings } from '../models/ShopSettings';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { calculateTax, calculateTotal, getStartOfDay, getEndOfDay } from '../utils/helpers';
import { generateBillPDF, generateKOTPDF } from '../utils/pdf';
import { getIO } from '../config/socket';

const router = Router();

const createOrderSchema = z.object({
  tableNumber: z.number().int().min(1),
  customerName: z.string().min(1),
  items: z.array(z.object({
    itemId: z.string(),
    quantity: z.number().int().min(1),
    specialInstructions: z.string().optional().default(''),
  })).min(1),
  paymentMethod: z.enum(['UPI', 'CASH']),
  couponCode: z.string().optional(),
});

router.post('/create', validate(createOrderSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const settings = await ShopSettings.findOne();
    if (settings && !settings.isOpen) {
      res.status(403).json({ message: 'Restaurant is currently closed' });
      return;
    }
    const { tableNumber, customerName, items, paymentMethod, couponCode } = req.body;
    const orderItems = [];
    let subtotal = 0;
    for (const item of items) {
      const menuItem = await MenuItem.findById(item.itemId);
      if (!menuItem) { res.status(404).json({ message: `Item not found` }); return; }
      if (!menuItem.isAvailable) { res.status(400).json({ message: `${menuItem.name} is unavailable` }); return; }
      if (menuItem.stock !== -1 && menuItem.stock < item.quantity) { res.status(400).json({ message: `${menuItem.name} - only ${menuItem.stock} left` }); return; }
      orderItems.push({ itemId: menuItem._id, name: menuItem.name, quantity: item.quantity, price: menuItem.price, specialInstructions: item.specialInstructions || '' });
      subtotal += menuItem.price * item.quantity;
      if (menuItem.stock !== -1) { menuItem.stock -= item.quantity; if (menuItem.stock === 0) menuItem.isAvailable = false; await menuItem.save(); }
    }
    const tax = calculateTax(subtotal);
    let discount = 0;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true, validFrom: { $lte: new Date() }, validUntil: { $gte: new Date() } });
      if (coupon) {
        if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) { res.status(400).json({ message: 'Coupon limit reached' }); return; }
        if (subtotal < coupon.minOrderAmount) { res.status(400).json({ message: `Min order ₹${coupon.minOrderAmount}` }); return; }
        discount = coupon.discountType === 'percentage' ? (subtotal * coupon.discountValue) / 100 : coupon.discountValue;
        if (coupon.discountType === 'percentage' && coupon.maxDiscount > 0) discount = Math.min(discount, coupon.maxDiscount);
        coupon.usedCount += 1; await coupon.save();
      }
    }
    const total = calculateTotal(subtotal, tax, discount);
    const order = new Order({ tableNumber, customerName, items: orderItems, subtotal, tax, discount, total, paymentMethod, paymentStatus: paymentMethod === 'CASH' ? 'PENDING' : 'COMPLETED', couponCode: couponCode || '' });
    await order.save();
    try { const io = getIO(); io.to('admin-room').emit('new-order', { order, message: `New order from Table ${tableNumber}!` }); } catch {}
    res.status(201).json({ message: 'Order placed', order, orderId: order._id });
  } catch (error) { res.status(500).json({ message: 'Server error', error }); }
});

router.get('/:orderId/track', async (req: Request, res: Response): Promise<void> => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) { res.status(404).json({ message: 'Order not found' }); return; }
    res.json({ order });
  } catch (error) { res.status(500).json({ message: 'Server error', error }); }
});

router.get('/admin/all', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, date, tableNumber, page = '1', limit = '50' } = req.query;
    const filter: any = {};
    if (status) filter.orderStatus = status;
    if (tableNumber) filter.tableNumber = Number(tableNumber);
    if (date) { const d = new Date(date as string); filter.orderTime = { $gte: getStartOfDay(d), $lte: getEndOfDay(d) }; }
    const skip = (Number(page) - 1) * Number(limit);
    const orders = await Order.find(filter).sort({ orderTime: -1 }).skip(skip).limit(Number(limit));
    const total = await Order.countDocuments(filter);
    res.json({ orders, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (error) { res.status(500).json({ message: 'Server error', error }); }
});

router.get('/admin/live', authenticate, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const orders = await Order.find({ orderStatus: { $ne: 'SERVED' } }).sort({ orderTime: 1 });
    res.json({ orders });
  } catch (error) { res.status(500).json({ message: 'Server error', error }); }
});

router.put('/admin/:orderId/status', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, estimatedTime } = req.body;
    const order = await Order.findById(req.params.orderId);
    if (!order) { res.status(404).json({ message: 'Order not found' }); return; }
    const valid: Record<string, string[]> = { 'PENDING': ['PREPARING'], 'PREPARING': ['READY'], 'READY': ['SERVED'] };
    if (!valid[order.orderStatus]?.includes(status)) { res.status(400).json({ message: `Cannot transition from ${order.orderStatus} to ${status}` }); return; }
    order.orderStatus = status;
    if (status === 'PREPARING') { order.preparingTime = new Date(); if (estimatedTime) order.estimatedTime = estimatedTime; }
    else if (status === 'READY') order.readyTime = new Date();
    else if (status === 'SERVED') { order.servedTime = new Date(); order.paymentStatus = 'COMPLETED'; }
    await order.save();
    try { const io = getIO(); io.to(`order-${order._id}`).emit('order-status-update', { orderId: order._id, status: order.orderStatus, estimatedTime: order.estimatedTime }); io.to('admin-room').emit('order-updated', { order }); } catch {}
    res.json({ message: `Status updated to ${status}`, order });
  } catch (error) { res.status(500).json({ message: 'Server error', error }); }
});

router.get('/admin/:orderId/bill', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) { res.status(404).json({ message: 'Order not found' }); return; }
    const doc = generateBillPDF(order);
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename=bill-${order._id}.pdf` });
    doc.pipe(res); doc.end();
  } catch (error) { res.status(500).json({ message: 'Server error', error }); }
});

router.get('/admin/:orderId/kot', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) { res.status(404).json({ message: 'Order not found' }); return; }
    const doc = generateKOTPDF(order);
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename=kot-${order._id}.pdf` });
    doc.pipe(res); doc.end();
  } catch (error) { res.status(500).json({ message: 'Server error', error }); }
});

export default router;
