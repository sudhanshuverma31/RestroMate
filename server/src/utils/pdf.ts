import PDFDocument from 'pdfkit';
import { IOrder } from '../models/Order';

export const generateBillPDF = (order: IOrder): PDFKit.PDFDocument => {
  const doc = new PDFDocument({ size: [300, 600], margin: 20 });

  // Header
  doc.fontSize(18).font('Helvetica-Bold').text('RestroMate', { align: 'center' });
  doc.fontSize(10).font('Helvetica').text('Restaurant Management System', { align: 'center' });
  doc.moveDown(0.5);
  doc.text('─'.repeat(40), { align: 'center' });
  doc.moveDown(0.5);

  // Order info
  doc.fontSize(10);
  doc.text(`Order #: ${String(order._id).slice(-8).toUpperCase()}`);
  doc.text(`Table: ${order.tableNumber}`);
  doc.text(`Customer: ${order.customerName}`);
  doc.text(`Date: ${new Date(order.orderTime).toLocaleString()}`);
  doc.text(`Payment: ${order.paymentMethod}`);
  doc.moveDown(0.5);
  doc.text('─'.repeat(40), { align: 'center' });
  doc.moveDown(0.5);

  // Items header
  doc.font('Helvetica-Bold');
  doc.text('Item', 20, doc.y, { width: 120, continued: true });
  doc.text('Qty', { width: 40, align: 'center', continued: true });
  doc.text('Price', { width: 60, align: 'right' });
  doc.font('Helvetica');
  doc.moveDown(0.3);

  // Items
  for (const item of order.items) {
    doc.text(item.name, 20, doc.y, { width: 120, continued: true });
    doc.text(String(item.quantity), { width: 40, align: 'center', continued: true });
    doc.text(`₹${(item.price * item.quantity).toFixed(2)}`, { width: 60, align: 'right' });
    if (item.specialInstructions) {
      doc.fontSize(8).text(`  Note: ${item.specialInstructions}`, 20);
      doc.fontSize(10);
    }
  }

  doc.moveDown(0.5);
  doc.text('─'.repeat(40), { align: 'center' });
  doc.moveDown(0.3);

  // Totals
  doc.text(`Subtotal:`, 20, doc.y, { width: 160, continued: true });
  doc.text(`₹${order.subtotal.toFixed(2)}`, { width: 60, align: 'right' });

  doc.text(`GST (5%):`, 20, doc.y, { width: 160, continued: true });
  doc.text(`₹${order.tax.toFixed(2)}`, { width: 60, align: 'right' });

  if (order.discount > 0) {
    doc.text(`Discount:`, 20, doc.y, { width: 160, continued: true });
    doc.text(`-₹${order.discount.toFixed(2)}`, { width: 60, align: 'right' });
  }

  doc.moveDown(0.3);
  doc.font('Helvetica-Bold').fontSize(12);
  doc.text(`TOTAL:`, 20, doc.y, { width: 160, continued: true });
  doc.text(`₹${order.total.toFixed(2)}`, { width: 60, align: 'right' });

  doc.moveDown(1);
  doc.font('Helvetica').fontSize(9);
  doc.text('Thank you for dining with RestroMate!', { align: 'center' });
  doc.text('Visit again soon ❤️', { align: 'center' });

  return doc;
};

export const generateKOTPDF = (order: IOrder): PDFKit.PDFDocument => {
  const doc = new PDFDocument({ size: [300, 400], margin: 20 });

  // Header
  doc.fontSize(16).font('Helvetica-Bold').text('KITCHEN ORDER TICKET', { align: 'center' });
  doc.moveDown(0.3);
  doc.fontSize(10).font('Helvetica');
  doc.text('─'.repeat(40), { align: 'center' });
  doc.moveDown(0.3);

  // Order info
  doc.fontSize(12).font('Helvetica-Bold');
  doc.text(`TABLE ${order.tableNumber}`, { align: 'center' });
  doc.fontSize(10).font('Helvetica');
  doc.text(`Order #: ${String(order._id).slice(-8).toUpperCase()}`);
  doc.text(`Time: ${new Date(order.orderTime).toLocaleTimeString()}`);
  doc.moveDown(0.3);
  doc.text('─'.repeat(40), { align: 'center' });
  doc.moveDown(0.3);

  // Items
  doc.font('Helvetica-Bold').fontSize(11);
  for (const item of order.items) {
    doc.text(`${item.quantity}x  ${item.name}`);
    if (item.specialInstructions) {
      doc.font('Helvetica').fontSize(9);
      doc.text(`   ⚠ ${item.specialInstructions}`);
      doc.font('Helvetica-Bold').fontSize(11);
    }
    doc.moveDown(0.2);
  }

  doc.moveDown(0.5);
  doc.text('─'.repeat(40), { align: 'center' });
  doc.font('Helvetica').fontSize(9);
  doc.text(`Printed: ${new Date().toLocaleString()}`, { align: 'center' });

  return doc;
};
