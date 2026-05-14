import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Coupon } from '../models/Coupon';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

const couponSchema = z.object({
  code: z.string().min(3).max(20),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.number().min(0),
  minOrderAmount: z.number().min(0).optional().default(0),
  maxDiscount: z.number().min(0).optional().default(0),
  usageLimit: z.number().int().min(0).optional().default(0),
  validFrom: z.string().transform(s => new Date(s)),
  validUntil: z.string().transform(s => new Date(s)),
});

router.get('/', authenticate, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({ coupons });
  } catch (error) { res.status(500).json({ message: 'Server error', error }); }
});

router.post('/', authenticate, validate(couponSchema), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const existing = await Coupon.findOne({ code: req.body.code.toUpperCase() });
    if (existing) { res.status(400).json({ message: 'Coupon code already exists' }); return; }
    req.body.code = req.body.code.toUpperCase();
    const coupon = new Coupon(req.body);
    await coupon.save();
    res.status(201).json({ message: 'Coupon created', coupon });
  } catch (error) { res.status(500).json({ message: 'Server error', error }); }
});

router.put('/:couponId', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.couponId, req.body, { new: true });
    if (!coupon) { res.status(404).json({ message: 'Coupon not found' }); return; }
    res.json({ message: 'Coupon updated', coupon });
  } catch (error) { res.status(500).json({ message: 'Server error', error }); }
});

router.delete('/:couponId', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.couponId);
    if (!coupon) { res.status(404).json({ message: 'Coupon not found' }); return; }
    res.json({ message: 'Coupon deleted' });
  } catch (error) { res.status(500).json({ message: 'Server error', error }); }
});

router.post('/validate', async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, orderAmount } = req.body;
    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true, validFrom: { $lte: new Date() }, validUntil: { $gte: new Date() } });
    if (!coupon) { res.status(404).json({ message: 'Invalid or expired coupon' }); return; }
    if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) { res.status(400).json({ message: 'Coupon limit reached' }); return; }
    if (orderAmount < coupon.minOrderAmount) { res.status(400).json({ message: `Min order ₹${coupon.minOrderAmount}` }); return; }
    let discount = coupon.discountType === 'percentage' ? (orderAmount * coupon.discountValue) / 100 : coupon.discountValue;
    if (coupon.discountType === 'percentage' && coupon.maxDiscount > 0) discount = Math.min(discount, coupon.maxDiscount);
    res.json({ valid: true, discount: Math.round(discount * 100) / 100, coupon });
  } catch (error) { res.status(500).json({ message: 'Server error', error }); }
});

export default router;
