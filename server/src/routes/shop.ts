import { Router, Response } from 'express';
import { ShopSettings } from '../models/ShopSettings';
import { authenticate, AuthRequest } from '../middleware/auth';
import { getIO } from '../config/socket';

const router = Router();

router.get('/status', async (_req, res: Response): Promise<void> => {
  try {
    let settings = await ShopSettings.findOne();
    if (!settings) {
      settings = new ShopSettings({ isOpen: false, restaurantName: 'RestroMate' });
      await settings.save();
    }
    res.json({ settings });
  } catch (error) { res.status(500).json({ message: 'Server error', error }); }
});

router.put('/toggle', authenticate, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    let settings = await ShopSettings.findOne();
    if (!settings) { settings = new ShopSettings(); }
    settings.isOpen = !settings.isOpen;
    if (settings.isOpen) settings.lastOpenedAt = new Date();
    else settings.lastClosedAt = new Date();
    await settings.save();
    try { const io = getIO(); io.emit('shop-status-change', { isOpen: settings.isOpen }); } catch {}
    res.json({ message: `Shop ${settings.isOpen ? 'opened' : 'closed'}`, settings });
  } catch (error) { res.status(500).json({ message: 'Server error', error }); }
});

router.put('/timing', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { openingTime, closingTime } = req.body;
    let settings = await ShopSettings.findOne();
    if (!settings) settings = new ShopSettings();
    if (openingTime) settings.openingTime = openingTime;
    if (closingTime) settings.closingTime = closingTime;
    await settings.save();
    res.json({ message: 'Timing updated', settings });
  } catch (error) { res.status(500).json({ message: 'Server error', error }); }
});

export default router;
