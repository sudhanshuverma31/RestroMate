import QRCode from 'qrcode';
import crypto from 'crypto';
import { env } from '../config/env';

const ALGORITHM = 'aes-256-cbc';

function getKeyAndIV() {
  const key = crypto.createHash('sha256').update(env.QR_ENCRYPTION_KEY).digest();
  const iv = crypto.createHash('md5').update(env.QR_ENCRYPTION_KEY).digest();
  return { key, iv };
}

export const encryptTableId = (tableId: string): string => {
  const { key, iv } = getKeyAndIV();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(tableId, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
};

export const decryptTableId = (encrypted: string): string => {
  const { key, iv } = getKeyAndIV();
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

export const generateQRCode = async (data: string): Promise<string> => {
  try {
    const qrDataUrl = await QRCode.toDataURL(data, {
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
    return qrDataUrl;
  } catch (error) {
    throw new Error('Failed to generate QR code');
  }
};

export const generateQRBuffer = async (data: string): Promise<Buffer> => {
  try {
    const buffer = await QRCode.toBuffer(data, {
      width: 400,
      margin: 2,
    });
    return buffer;
  } catch (error) {
    throw new Error('Failed to generate QR code buffer');
  }
};
