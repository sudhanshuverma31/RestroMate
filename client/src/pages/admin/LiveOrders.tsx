import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Clock, 
  CheckCircle2, 
  Printer, 
  Play, 
  Check, 
  ChefHat,
  ChevronDown,
  ChevronUp,
  MessageSquare
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { io, Socket } from 'socket.io-client';
import api from '../../utils/api';
import type { Order, OrderStatus } from '../../types';

const LiveOrders: React.FC = () => {
  const queryClient = useQueryClient();
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  // Fetch Live Orders
  const { data: ordersData, isLoading } = useQuery<{ orders: Order[] }>({
    queryKey: ['live-orders'],
    queryFn: async () => {
      const res = await api.get('/orders/admin/live');
      return res.data;
    },
    refetchInterval: 10000, // Fallback polling
  });

  // Socket.io for real-time updates
  useEffect(() => {
    const socket: Socket = io('/', { path: '/socket.io' });

    socket.on('connect', () => {
      socket.emit('join-admin');
    });

    socket.on('new-order', (data: { order: Order; message: string }) => {
      queryClient.setQueryData(['live-orders'], (prev: any) => ({
        ...prev,
        orders: [data.order, ...(prev?.orders || [])]
      }));
      toast.success(data.message, { duration: 5000, icon: '🔔' });
      // Play notification sound
      const audio = new Audio('/notification.mp3');
      audio.play().catch(() => {});
    });

    socket.on('order-updated', () => {
      queryClient.invalidateQueries({ queryKey: ['live-orders'] });
    });

    return () => {
      socket.disconnect();
    };
  }, [queryClient]);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, estimatedTime }: { id: string; status: OrderStatus; estimatedTime?: number }) => {
      return api.put(`/orders/admin/${id}/status`, { status, estimatedTime });
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['live-orders'] });
      toast.success(res.data.message);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Update failed');
    },
  });

  const toggleExpand = (id: string) => {
    setExpandedOrders(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'PREPARING': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'READY': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      default: return 'text-brand-700 bg-dark-muted border-dark-border';
    }
  };

  const handlePrintKOT = (id: string) => {
    window.open(`/api/orders/admin/${id}/kot`, '_blank');
  };

  const handlePrintBill = (id: string) => {
    window.open(`/api/orders/admin/${id}/bill`, '_blank');
  };

  if (isLoading) return <div className="p-10 text-center animate-pulse">Loading live orders...</div>;

  const orders = ordersData?.orders || [];

  return (
    <div className="animate-fade-in">
      <div className="page-header flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Live Orders</h1>
          <p className="page-subtitle">Manage active orders in real-time from the kitchen to the table.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-xs font-bold uppercase tracking-wider">Live View</span>
          </div>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="card p-20 flex flex-col items-center justify-center text-center">
          <ChefHat size={60} className="text-brand-600/20 mb-4" />
          <h3 className="text-xl font-bold text-gold">No active orders</h3>
          <p className="text-brand-700 mt-1">Sit back and relax, or check your history.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {orders.map(order => (
            <div key={order._id} className="card overflow-hidden animate-slide-up group border-l-4 border-l-brand-600">
              {/* Header */}
              <div className="p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-dark-muted/30">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-brand-600/10 flex items-center justify-center text-brand-600 font-bold text-xl border border-brand-600/20 shadow-sm">
                    {order.tableNumber}
                  </div>
                  <div>
                    <h3 className="font-bold text-gold text-lg flex items-center gap-2">
                      {order.customerName}
                      <span className="text-[10px] font-mono dark:text-brand-700 text-brand-600 px-2 py-0.5 rounded bg-dark-muted border border-dark-border">
                        #{order._id.slice(-6).toUpperCase()}
                      </span>
                    </h3>
                    <p className="text-xs text-brand-700 flex items-center gap-1.5 mt-0.5">
                      <Clock size={12} />
                      {new Date(order.orderTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      <span className="mx-1">•</span>
                      <span className="capitalize">{order.paymentMethod}</span> Payment
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <span className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase border tracking-widest ${getStatusColor(order.orderStatus)}`}>
                    {order.orderStatus}
                  </span>
                  
                  <div className="flex items-center gap-2">
                    {order.orderStatus === 'PENDING' && (
                      <button 
                        onClick={() => updateStatusMutation.mutate({ id: order._id, status: 'PREPARING', estimatedTime: 15 })}
                        className="btn-primary py-2 px-4 text-xs"
                      >
                        <Play size={14} /> Start Preparing
                      </button>
                    )}
                    {order.orderStatus === 'PREPARING' && (
                      <button 
                        onClick={() => updateStatusMutation.mutate({ id: order._id, status: 'READY' })}
                        className="btn-success py-2 px-4 text-xs"
                      >
                        <Check size={14} /> Mark Ready
                      </button>
                    )}
                    {order.orderStatus === 'READY' && (
                      <button 
                        onClick={() => updateStatusMutation.mutate({ id: order._id, status: 'SERVED' })}
                        className="btn-primary py-2 px-4 text-xs"
                      >
                        <CheckCircle2 size={14} /> Mark Served
                      </button>
                    )}
                    
                    <div className="h-8 w-[1px] bg-dark-border mx-1"></div>
                    
                    <button onClick={() => handlePrintKOT(order._id)} className="p-2 rounded-lg glass text-brand-600 hover:bg-brand-600 hover:text-white transition-all" title="Print KOT">
                      <Printer size={16} />
                    </button>
                    <button onClick={() => toggleExpand(order._id)} className="p-2 rounded-lg glass text-brand-700">
                      {expandedOrders.has(order._id) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div className={`transition-all duration-300 ${expandedOrders.has(order._id) ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
                <div className="p-6 border-t dark:border-dark-border border-light-border bg-dark-bg/50">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs uppercase tracking-wider text-brand-700 border-b border-dark-border">
                        <th className="text-left py-3 font-semibold">Item Details</th>
                        <th className="text-center py-3 font-semibold">Qty</th>
                        <th className="text-right py-3 font-semibold">Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-border/50">
                      {order.items.map((item, i) => (
                        <tr key={i} className="group/row">
                          <td className="py-4">
                            <p className="font-bold text-gold">{item.name}</p>
                            {item.specialInstructions && (
                              <p className="text-[10px] text-brand-600 flex items-center gap-1 mt-1 bg-brand-600/5 px-2 py-1 rounded inline-flex">
                                <MessageSquare size={10} />
                                {item.specialInstructions}
                              </p>
                            )}
                          </td>
                          <td className="py-4 text-center">
                            <span className="w-8 h-8 rounded-lg bg-dark-muted flex items-center justify-center mx-auto font-bold text-brand-500 border border-dark-border">
                              {item.quantity}
                            </span>
                          </td>
                          <td className="py-4 text-right font-bold text-brand-600">
                            ₹{item.price * item.quantity}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-dark-border">
                        <td colSpan={2} className="py-4 text-right text-brand-700 font-bold uppercase text-[10px] tracking-widest">Grand Total</td>
                        <td className="py-4 text-right font-bold text-xl text-emerald-500">₹{order.total}</td>
                      </tr>
                    </tfoot>
                  </table>
                  
                  <div className="mt-6 flex justify-end gap-3">
                    <button onClick={() => handlePrintBill(order._id)} className="btn-secondary py-2 px-6 text-xs rounded-xl">
                      <Printer size={14} /> Print Bill
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Collapsed View Summary */}
              {!expandedOrders.has(order._id) && (
                <div className="px-6 py-3 flex items-center gap-2 border-t dark:border-dark-border border-light-border overflow-x-auto no-scrollbar">
                  {order.items.map((item, i) => (
                    <span key={i} className="text-[10px] font-bold text-brand-700 bg-brand-600/5 px-2 py-0.5 rounded whitespace-nowrap">
                      {item.quantity}x {item.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LiveOrders;
