import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Clock, 
  ChefHat, 
  Utensils, 
  CheckCircle2, 
  ChevronLeft, 
  Phone,
  RefreshCw
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import api from '../../utils/api';
import type { Order, OrderStatus } from '../../types';
import FeedbackModal from '../../components/FeedbackModal';

const OrderStatusPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [liveStatus, setLiveStatus] = useState<OrderStatus | null>(null);
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const { data: orderData, isLoading, refetch } = useQuery<{ order: Order }>({
    queryKey: ['order-status', orderId],
    queryFn: async () => {
      const res = await api.get(`/orders/${orderId}/track`);
      return res.data;
    },
    enabled: !!orderId,
  });

  useEffect(() => {
    if (orderData?.order) {
      setLiveStatus(orderData.order.orderStatus);
      setEstimatedTime(orderData.order.estimatedTime || null);
      if (orderData.order.orderStatus === 'SERVED') {
        setShowFeedback(true);
      }
    }
  }, [orderData]);

  // Socket.io for real-time status updates
  useEffect(() => {
    if (!orderId) return;

    const socket: Socket = io('/', { path: '/socket.io' });

    socket.on('connect', () => {
      socket.emit('join-order', orderId);
    });

    socket.on('order-status-update', (data: { status: OrderStatus; estimatedTime?: number }) => {
      setLiveStatus(data.status);
      if (data.estimatedTime) setEstimatedTime(data.estimatedTime);
      if (data.status === 'SERVED') {
        setShowFeedback(true);
      }
      refetch();
    });

    return () => {
      socket.disconnect();
    };
  }, [orderId, refetch]);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center dark:bg-dark-bg bg-light-bg text-gold">Loading tracking...</div>;

  const order = orderData?.order;
  if (!order) return <div className="p-10 text-center">Order not found</div>;

  const currentStatus = liveStatus || order.orderStatus;

  const statusSteps = [
    { key: 'PENDING', label: 'Order Placed', icon: Clock, desc: 'Waiting for kitchen to accept' },
    { key: 'PREPARING', label: 'Preparing', icon: ChefHat, desc: 'Chef is working their magic' },
    { key: 'READY', label: 'Ready', icon: Utensils, desc: 'Your food is ready to serve' },
    { key: 'SERVED', label: 'Served', icon: CheckCircle2, desc: 'Hope you enjoy your meal!' },
  ];

  const currentStepIndex = statusSteps.findIndex(s => s.key === currentStatus);

  return (
    <div className="animate-fade-in p-4 md:p-8 max-w-lg mx-auto">
      <div className="mb-8 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl glass text-brand-600">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold font-display text-gold">Track Order</h1>
      </div>

      {/* Main Status Card */}
      <div className="card p-8 text-center mb-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-dark-border">
          <div 
            className="h-full bg-brand-600 transition-all duration-1000" 
            style={{ width: `${((currentStepIndex + 1) / statusSteps.length) * 100}%` }}
          />
        </div>

        <div className="mb-6 inline-flex p-5 rounded-3xl bg-brand-600/10 text-brand-600 border border-brand-600/20 shadow-gold">
          {currentStatus === 'PENDING' && <Clock size={40} className="animate-pulse" />}
          {currentStatus === 'PREPARING' && <ChefHat size={40} className="animate-bounce" />}
          {currentStatus === 'READY' && <Utensils size={40} className="animate-bounce-light" />}
          {currentStatus === 'SERVED' && <CheckCircle2 size={40} />}
        </div>

        <h2 className="text-2xl font-bold text-gold font-display mb-2">{statusSteps[currentStepIndex].label}</h2>
        <p className="text-brand-700 text-sm mb-6">{statusSteps[currentStepIndex].desc}</p>

        {currentStatus === 'PREPARING' && estimatedTime && (
          <div className="bg-brand-600/5 rounded-2xl p-4 border border-brand-600/10 flex flex-col items-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-brand-700 mb-1">Estimated Wait</span>
            <span className="text-2xl font-bold text-brand-600">{estimatedTime} Min</span>
          </div>
        )}
      </div>

      {/* Progress Stepper */}
      <div className="space-y-8 px-4 mb-10">
        {statusSteps.map((step, i) => {
          const isCompleted = i < currentStepIndex;
          const isCurrent = i === currentStepIndex;
          
          return (
            <div key={step.key} className="flex gap-6 relative">
              {i !== statusSteps.length - 1 && (
                <div className={`absolute left-5 top-10 w-0.5 h-10 ${isCompleted ? 'bg-brand-600' : 'bg-dark-border'}`} />
              )}
              
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 border-2 transition-all ${isCompleted || isCurrent ? 'bg-brand-600 border-brand-600 text-white shadow-gold' : 'bg-dark-muted border-dark-border text-brand-700'}`}>
                {isCompleted ? <CheckCircle2 size={20} /> : <step.icon size={20} />}
              </div>
              
              <div className="pt-1">
                <h3 className={`font-bold text-sm ${isCurrent ? 'text-gold' : isCompleted ? 'text-brand-600' : 'text-brand-700'}`}>
                  {step.label}
                </h3>
                <p className="text-[10px] text-brand-700 font-medium uppercase tracking-wider mt-0.5">{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Order Details */}
      <div className="card p-6 mb-8">
        <h3 className="text-sm font-bold text-gold uppercase tracking-widest mb-6 pb-2 border-b dark:border-dark-border border-light-border">Order Details</h3>
        <div className="space-y-4">
          {order.items.map((item, i) => (
            <div key={i} className="flex justify-between items-center">
              <div className="flex gap-3 items-center">
                <span className="w-6 h-6 rounded bg-brand-600/10 text-brand-600 text-xs font-bold flex items-center justify-center">{item.quantity}</span>
                <span className="text-sm font-semibold text-brand-700">{item.name}</span>
              </div>
              <span className="text-sm font-bold text-gold">₹{item.price * item.quantity}</span>
            </div>
          ))}
          <div className="divider mt-2"></div>
          <div className="flex justify-between items-center pt-2">
            <span className="font-bold text-gold">Total Amount</span>
            <span className="text-xl font-bold text-brand-600">₹{order.total}</span>
          </div>
        </div>
      </div>

      {/* Help Card */}
      <div className="glass p-6 rounded-3xl flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-brand-600/10 flex items-center justify-center text-brand-600">
            <Phone size={20} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-gold">Need Help?</h4>
            <p className="text-[10px] text-brand-700 uppercase font-bold">Call Table Assistant</p>
          </div>
        </div>
        <button className="btn-secondary px-6 py-2 rounded-xl text-xs">Call</button>
      </div>
      
      <button 
        onClick={() => refetch()}
        className="w-full mt-10 py-4 flex items-center justify-center gap-2 text-xs font-bold text-brand-700 uppercase tracking-widest hover:text-brand-600 transition-all"
      >
        <RefreshCw size={14} /> Refresh Tracking
      </button>

      {showFeedback && order && (
        <FeedbackModal 
          orderId={order._id} 
          tableNumber={order.tableNumber} 
          onClose={() => setShowFeedback(false)} 
        />
      )}
    </div>
  );
};

export default OrderStatusPage;
