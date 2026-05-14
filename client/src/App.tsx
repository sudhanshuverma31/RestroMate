import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { UtensilsCrossed, QrCode } from 'lucide-react';

// Layouts
import AdminLayout from './layouts/AdminLayout';
import CustomerLayout from './layouts/CustomerLayout';

// Admin Pages
import Login from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import MenuManagement from './pages/admin/MenuManagement';
import TableManagement from './pages/admin/TableManagement';
import LiveOrders from './pages/admin/LiveOrders';
import Reports from './pages/admin/Reports';
import Settings from './pages/admin/Settings';

// Customer Pages
import CustomerMenu from './pages/customer/CustomerMenu';
import Cart from './pages/customer/Cart';
import OrderStatus from './pages/customer/OrderStatus';
import OrderHistory from './pages/customer/OrderHistory';

const Home = () => (
  <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center animate-fade-in">
    <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 shadow-gold mb-8 flex items-center justify-center">
      <UtensilsCrossed size={48} className="text-white" />
    </div>
    <h1 className="text-4xl font-bold font-display text-gold mb-4">Welcome to RestroMate</h1>
    <p className="text-brand-700 max-w-xs mb-8 leading-relaxed">Please scan the QR code on your table to view our menu and place an order.</p>
    <div className="flex items-center gap-2 px-6 py-3 rounded-2xl glass text-brand-600 font-bold border-brand-600/20">
      <QrCode size={20} />
      <span>Scan Table QR</span>
    </div>
  </div>
);

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { token, isLoading } = useAuth();
  if (isLoading) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4 dark:bg-dark-bg bg-light-bg">
      <div className="w-12 h-12 rounded-xl bg-brand-600 animate-spin flex items-center justify-center">
        <div className="w-6 h-6 bg-white rounded-sm"></div>
      </div>
      <p className="text-sm font-bold text-gold animate-pulse">Initializing RestroMate...</p>
    </div>
  );
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth */}
        <Route path="/login" element={<Login />} />

        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="live-orders" element={<LiveOrders />} />
          <Route path="menu" element={<MenuManagement />} />
          <Route path="tables" element={<TableManagement />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Customer Routes */}
        <Route path="/" element={<CustomerLayout />}>
          <Route index element={<Home />} />
          <Route path="table/:tableId" element={<CustomerMenu />} />
          <Route path="cart" element={<Cart />} />
          <Route path="order/history" element={<OrderHistory />} />
          <Route path="order/:orderId" element={<OrderStatus />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
