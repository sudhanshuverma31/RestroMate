import { Router, Request, Response } from 'express';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import { MenuItem } from '../models/MenuItem';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

// Multer setup for image uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

const menuItemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  price: z.number().min(0, 'Price must be positive'),
  category: z.enum(['Starters', 'Main Course', 'Desserts', 'Drinks', 'Snacks', 'Breads', 'Rice', 'Combos']),
  description: z.string().optional().default(''),
  isAvailable: z.boolean().optional().default(true),
  stock: z.number().int().min(-1).optional().default(-1),
});

// Get all menu items (public)
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const items = await MenuItem.find().sort({ category: 1, name: 1 });
    res.json({ items });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Get available menu items (customer)
router.get('/available', async (_req: Request, res: Response): Promise<void> => {
  try {
    const items = await MenuItem.find({ isAvailable: true }).sort({ category: 1, name: 1 });
    res.json({ items });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Get menu by category
router.get('/category/:category', async (req: Request, res: Response): Promise<void> => {
  try {
    const items = await MenuItem.find({
      category: req.params.category,
      isAvailable: true,
    }).sort({ name: 1 });
    res.json({ items });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Add menu item (admin)
router.post('/add', authenticate, upload.single('image'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const body = {
      ...req.body,
      price: Number(req.body.price),
      stock: req.body.stock ? Number(req.body.stock) : -1,
      isAvailable: req.body.isAvailable === 'true' || req.body.isAvailable === true,
    };

    const parsed = menuItemSchema.safeParse(body);
    if (!parsed.success) {
      res.status(400).json({ message: 'Validation failed', errors: parsed.error.flatten().fieldErrors });
      return;
    }

    const itemData: any = parsed.data;
    if (req.file) {
      itemData.imageUrl = `/uploads/${req.file.filename}`;
    }

    const item = new MenuItem(itemData);
    await item.save();

    res.status(201).json({ message: 'Menu item added', item });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Update menu item (admin)
router.put('/:itemId', authenticate, upload.single('image'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const updates: any = { ...req.body };
    if (updates.price) updates.price = Number(updates.price);
    if (updates.stock) updates.stock = Number(updates.stock);
    if (updates.isAvailable !== undefined) {
      updates.isAvailable = updates.isAvailable === 'true' || updates.isAvailable === true;
    }
    if (req.file) {
      updates.imageUrl = `/uploads/${req.file.filename}`;
    }

    const item = await MenuItem.findByIdAndUpdate(req.params.itemId, updates, { new: true });
    if (!item) {
      res.status(404).json({ message: 'Item not found' });
      return;
    }

    res.json({ message: 'Item updated', item });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Delete menu item (admin)
router.delete('/:itemId', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const item = await MenuItem.findByIdAndDelete(req.params.itemId);
    if (!item) {
      res.status(404).json({ message: 'Item not found' });
      return;
    }
    res.json({ message: 'Item deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Toggle availability (admin)
router.patch('/:itemId/availability', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const item = await MenuItem.findById(req.params.itemId);
    if (!item) {
      res.status(404).json({ message: 'Item not found' });
      return;
    }

    item.isAvailable = !item.isAvailable;
    await item.save();

    res.json({ message: `${item.name} is now ${item.isAvailable ? 'available' : 'unavailable'}`, item });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

export default router;
