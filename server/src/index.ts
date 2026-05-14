import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import http from 'http';
import fs from 'fs';

import { env } from './config/env';
import { connectDB } from './config/db';
import { initSocket } from './config/socket';

import authRoutes from './routes/auth';
import tableRoutes from './routes/tables';
import menuRoutes from './routes/menu';
import orderRoutes from './routes/orders';
import shopRoutes from './routes/shop';
import reportRoutes from './routes/reports';
import feedbackRoutes from './routes/feedback';
import couponRoutes from './routes/coupons';

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(cors({
  origin: env.CLIENT_URL,
  credentials: true,
}));
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests, please try again later.',
});
app.use('/api/', limiter);

// Static files for uploads
app.use('/uploads', express.static(uploadsDir));

// Routes
app.use('/api/admin', authRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/admin/reports', reportRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/coupons', couponRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), name: 'RestroMate API' });
});

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
  });
});

// Start server
const PORT = parseInt(env.PORT);

const startServer = async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`🚀 RestroMate server running on port ${PORT}`);
    console.log(`📡 API: http://localhost:${PORT}/api/health`);
  });
};

startServer().catch(console.error);
