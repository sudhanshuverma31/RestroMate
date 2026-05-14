export const GST_RATE = 0.05; // 5% GST on food items

export const calculateTax = (subtotal: number): number => {
  return Math.round(subtotal * GST_RATE * 100) / 100;
};

export const calculateTotal = (subtotal: number, tax: number, discount: number = 0): number => {
  return Math.round((subtotal + tax - discount) * 100) / 100;
};

export const getStartOfDay = (date: Date = new Date()): Date => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
};

export const getEndOfDay = (date: Date = new Date()): Date => {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end;
};

export const formatOrderId = (id: string): string => {
  return id.slice(-8).toUpperCase();
};
