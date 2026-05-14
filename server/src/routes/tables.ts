import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Table } from '../models/Table';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { encryptTableId, decryptTableId, generateQRCode, generateQRBuffer } from '../utils/qrcode';
import { env } from '../config/env';

const router = Router();

const createTableSchema = z.object({
  tableNumber: z.number().int().min(1).max(50),
});

// Get all tables (admin)
router.get('/', authenticate, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tables = await Table.find().sort({ tableNumber: 1 });
    res.json({ tables });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Create table (admin)
router.post('/create', authenticate, validate(createTableSchema), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { tableNumber } = req.body;

    const existing = await Table.findOne({ tableNumber });
    if (existing) {
      res.status(400).json({ message: `Table ${tableNumber} already exists` });
      return;
    }

    const table = new Table({ tableNumber });
    await table.save();

    // Generate QR code
    const encryptedId = encryptTableId(table._id.toString());
    const qrUrl = `${env.CLIENT_URL}/table/${encryptedId}`;
    const qrCode = await generateQRCode(qrUrl);

    table.qrCode = qrCode;
    await table.save();

    res.status(201).json({ message: 'Table created', table });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Bulk create tables (admin)
router.post('/bulk-create', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { count } = req.body;
    if (!count || count < 1 || count > 50) {
      res.status(400).json({ message: 'Count must be between 1 and 50' });
      return;
    }

    const existingTables = await Table.find().select('tableNumber');
    const existingNumbers = new Set(existingTables.map(t => t.tableNumber));
    const created: any[] = [];

    for (let i = 1; i <= count; i++) {
      if (existingNumbers.has(i)) continue;

      const table = new Table({ tableNumber: i });
      await table.save();

      const encryptedId = encryptTableId(table._id.toString());
      const qrUrl = `${env.CLIENT_URL}/table/${encryptedId}`;
      const qrCode = await generateQRCode(qrUrl);

      table.qrCode = qrCode;
      await table.save();
      created.push(table);
    }

    res.status(201).json({ message: `${created.length} tables created`, tables: created });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Get QR code for table (admin)
router.get('/:tableId/qr', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const table = await Table.findById(req.params.tableId);
    if (!table) {
      res.status(404).json({ message: 'Table not found' });
      return;
    }

    if (!table.qrCode) {
      const encryptedId = encryptTableId(table._id.toString());
      const qrUrl = `${env.CLIENT_URL}/table/${encryptedId}`;
      table.qrCode = await generateQRCode(qrUrl);
      await table.save();
    }

    res.json({ qrCode: table.qrCode, tableNumber: table.tableNumber });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Download QR code as PNG
router.get('/:tableId/qr/download', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const table = await Table.findById(req.params.tableId);
    if (!table) {
      res.status(404).json({ message: 'Table not found' });
      return;
    }

    const encryptedId = encryptTableId(table._id.toString());
    const qrUrl = `${env.CLIENT_URL}/table/${encryptedId}`;
    const buffer = await generateQRBuffer(qrUrl);

    res.set({
      'Content-Type': 'image/png',
      'Content-Disposition': `attachment; filename=table-${table.tableNumber}-qr.png`,
    });
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Toggle table active status (admin)
router.put('/:tableId/toggle', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const table = await Table.findById(req.params.tableId);
    if (!table) {
      res.status(404).json({ message: 'Table not found' });
      return;
    }

    table.isActive = !table.isActive;
    await table.save();

    res.json({ message: `Table ${table.tableNumber} ${table.isActive ? 'enabled' : 'disabled'}`, table });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Verify table (customer - from QR scan)
router.get('/verify/:encryptedId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { encryptedId } = req.params;
    const tableId = decryptTableId(encryptedId);

    const table = await Table.findById(tableId);
    if (!table) {
      res.status(404).json({ message: 'Table not found' });
      return;
    }

    if (!table.isActive) {
      res.status(403).json({ message: 'This table is currently unavailable' });
      return;
    }

    res.json({ tableNumber: table.tableNumber, tableId: table._id });
  } catch (error) {
    res.status(400).json({ message: 'Invalid QR code' });
  }
});

// Delete table (admin)
router.delete('/:tableId', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const table = await Table.findByIdAndDelete(req.params.tableId);
    if (!table) {
      res.status(404).json({ message: 'Table not found' });
      return;
    }
    res.json({ message: `Table ${table.tableNumber} deleted` });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

export default router;
