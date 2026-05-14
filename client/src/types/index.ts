// ============================================================
//  SHARED TYPESCRIPT TYPES
// ============================================================

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'super-admin' | 'sub-admin';
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

// ---------- Menu ----------

export type MenuCategory =
  | 'Starters'
  | 'Main Course'
  | 'Desserts'
  | 'Drinks'
  | 'Snacks'
  | 'Breads'
  | 'Rice'
  | 'Combos';

export interface MenuItem {
  _id: string;
  name: string;
  price: number;
  category: MenuCategory;
  description: string;
  imageUrl: string;
  isAvailable: boolean;
  stock: number;
  createdAt: string;
}

// ---------- Table ----------

export interface Table {
  _id: string;
  tableNumber: number;
  qrCode: string;
  isActive: boolean;
  currentOrderId?: string;
}

// ---------- Order ----------

export type PaymentMethod = 'UPI' | 'CASH';
export type PaymentStatus = 'PENDING' | 'COMPLETED';
export type OrderStatus = 'PENDING' | 'PREPARING' | 'READY' | 'SERVED';

export interface OrderItem {
  itemId: string;
  name: string;
  quantity: number;
  price: number;
  specialInstructions: string;
}

export interface Order {
  _id: string;
  tableNumber: number;
  customerName: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  couponCode?: string;
  estimatedTime?: number;
  orderTime: string;
  preparingTime?: string;
  readyTime?: string;
  servedTime?: string;
}

// ---------- Shop ----------

export interface ShopSettings {
  _id: string;
  isOpen: boolean;
  openingTime: string;
  closingTime: string;
  restaurantName: string;
  lastOpenedAt?: string;
  lastClosedAt?: string;
}

// ---------- Cart ----------

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  specialInstructions: string;
}

// ---------- Reports ----------

export interface DailySummary {
  date: string;
  totalOrders: number;
  totalUPIAmount: number;
  totalCashAmount: number;
  totalRevenue: number;
  totalTax: number;
  totalDiscount: number;
  itemsSold: { itemId: string; name: string; quantity: number; revenue: number }[];
  peakHour: number;
  hourlyData: number[];
}

export interface HistoryEntry {
  date: string;
  orders: number;
  upi: number;
  cash: number;
  revenue: number;
}

// ---------- Coupon ----------

export interface Coupon {
  _id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  maxDiscount: number;
  usageLimit: number;
  usedCount: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
}

// ---------- Feedback ----------

export interface Feedback {
  _id: string;
  orderId: string;
  tableNumber: number;
  rating: number;
  comment: string;
  createdAt: string;
}
