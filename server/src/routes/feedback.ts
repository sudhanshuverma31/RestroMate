import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Feedback } from '../models/Feedback';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

const feedbackSchema = z.object({
  orderId: z.string(),
  tableNumber: z.number().int().min(1),
  customerName: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional().default(''),
});

router.post('/', validate(feedbackSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const existing = await Feedback.findOne({ orderId: req.body.orderId });
    if (existing) { res.status(400).json({ message: 'Feedback already submitted for this order' }); return; }
    const feedback = new Feedback(req.body);
    await feedback.save();
    res.status(201).json({ message: 'Feedback submitted', feedback });
  } catch (error) { res.status(500).json({ message: 'Server error', error }); }
});

router.get('/all', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const feedbacks = await Feedback.find().sort({ createdAt: -1 }).limit(100);
    const avg = await Feedback.aggregate([{ $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }]);
    res.json({ feedbacks, stats: avg[0] || { avgRating: 0, count: 0 } });
  } catch (error) { res.status(500).json({ message: 'Server error', error }); }
});

export default router;
