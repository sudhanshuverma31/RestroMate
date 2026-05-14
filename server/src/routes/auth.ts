import { Router, Response } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../models/User';
import { env } from '../config/env';
import { authenticate, AuthRequest, requireSuperAdmin } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

const registerSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

// Register - first user becomes super-admin
router.post('/register', validate(registerSchema), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password, name } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: 'Email already registered' });
      return;
    }

    const userCount = await User.countDocuments();
    const role = userCount === 0 ? 'super-admin' : 'sub-admin';

    // If not first user, require auth
    if (userCount > 0) {
      res.status(403).json({ message: 'Registration closed. Contact super-admin.' });
      return;
    }

    const user = new User({ email, password, name, role });
    await user.save();

    const token = jwt.sign({ userId: user._id }, env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: { id: user._id, email: user.email, name: user.name, role: user.role },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Login
router.post('/login', validate(loginSchema), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign({ userId: user._id }, env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Login successful',
      token,
      user: { id: user._id, email: user.email, name: user.name, role: user.role },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Create sub-admin (super-admin only)
router.post('/create-sub-admin', authenticate, requireSuperAdmin, validate(registerSchema), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password, name } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: 'Email already registered' });
      return;
    }

    const user = new User({ email, password, name, role: 'sub-admin' });
    await user.save();

    res.status(201).json({
      message: 'Sub-admin created successfully',
      user: { id: user._id, email: user.email, name: user.name, role: user.role },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Get current user
router.get('/me', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  res.json({ user: req.user });
});

export default router;
