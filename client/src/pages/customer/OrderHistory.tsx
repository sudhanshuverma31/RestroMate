import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  History, 
  ChevronRight, 
  Clock, 
  UtensilsCrossed,
  ChevronLeft
} from 'lucide-react';
import api from '../../utils/api';
import type { Order } from '../../types';

const OrderHistory: React.FC = () => {
  const navigate = useNavigate();

  // In a real app, we'd use phone number or a guest ID in local storage
  // For now, let's just show recent orders if any are stored or fetch if we have a table ID
  const tableInfoStr = localStorage.getItem('tableInfo');
  const tableInfo = tableInfoStr ? JSON.parse(tableInfoStr) : null;

  const { data: ordersData, isLoading } = useQuery<{ orders: Order[] }>({
    queryKey: ['customer-orders'],
    queryFn: async () => {
      // For this demo, we'll fetch orders for the current table
      if (!tableInfo?.tableNumber) return { orders: [] };
      const res = await api.get(`/orders/admin/all?tableNumber=${tableInfo.tableNumber}&limit=10`);
      return res.data;
    },
    enabled: !!tableInfo,
  });

  if (isLoading) return <div className="p-10 text-center animate-pulse dark:bg-dark-bg bg-light-bg text-gold h-screen">Loading history...</div>;

  const orders = ordersData?.orders || [];

  return (
    <div className="animate-fade-in p-4 md:p-8 max-w-2xl mx-auto pb-32">
      <div className="mb-8 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl glass text-brand-600">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold font-display text-gold">Order History</h1>
      </div>

      {orders.length === 0 ? (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center animate-fade-in">
          <div className="w-20 h-20 rounded-3xl bg-dark-muted flex items-center justify-center text-brand-700 mb-6">
            <History size={40} />
          </div>
          <h1 className="text-xl font-bold font-display text-gold mb-2">No recent orders</h1>
          <p className="text-brand-700 mb-8 max-w-xs">You haven't placed any orders yet. Head to the menu to start your first order!</p>
          <button 
            onClick={() => navigate('/')}
            className="btn-primary px-8 py-4 rounded-2xl"
          >
            Go to Menu
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-brand-700 mb-4 px-1">Recent orders at Table {tableInfo?.tableNumber}</p>
          
          {orders.map((order) => (
            <div 
              key={order._id}
              onClick={() => navigate(`/order/${order._id}`)}
              className="card p-5 hover:border-brand-600/50 transition-all cursor-pointer group"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-gold flex items-center gap-2">
                    Order #{order._id.slice(-6).toUpperCase()}
                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase border ${
                      order.orderStatus === 'SERVED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-brand-600/10 text-brand-600 border-brand-600/20'
                    }`}>
                      {order.orderStatus}
                    </span>
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1 text-[10px] text-brand-700 font-bold">
                    <Clock size={10} />
                    {new Date(order.orderTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} • 
                    {new Date(order.orderTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <ChevronRight size={18} className="text-brand-700 group-hover:text-brand-600 transition-all group-hover:translate-x-1" />
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {order.items.slice(0, 3).map((item, i) => (
                  <span key={i} className="text-[9px] font-bold text-brand-700 bg-brand-600/5 px-2 py-0.5 rounded border border-brand-600/10">
                    {item.quantity}x {item.name}
                  </span>
                ))}
                {order.items.length > 3 && (
                  <span className="text-[9px] font-bold text-brand-700 bg-brand-600/5 px-2 py-0.5 rounded border border-brand-600/10">
                    +{order.items.length - 3} more
                  </span>
                )}
              </div>

              <div className="flex justify-between items-center pt-4 border-t dark:border-dark-border border-light-border">
                <span className="text-xs font-bold text-brand-700 uppercase tracking-wider">Total Paid</span>
                <span className="text-lg font-bold text-brand-600">₹{order.total}</span>
              </div>
            </div>
          ))}
          
          <div className="p-8 text-center">
            <UtensilsCrossed size={32} className="text-brand-700/20 mx-auto mb-2" />
            <p className="text-[10px] text-brand-700 font-bold uppercase tracking-widest leading-relaxed">
              Scan a different table QR to start a new dining session.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
