import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Trash2, 
  Plus, 
  Minus, 
  ChevronLeft, 
  CreditCard, 
  Banknote,
  Ticket,
  ArrowRight,
  Loader2,
  CheckCircle2,
  UtensilsCrossed
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useCart } from '../../context/CartContext';
import api from '../../utils/api';

const Cart: React.FC = () => {
  const { items, updateQuantity, removeFromCart, subtotal, clearCart } = useCart();
  const navigate = useNavigate();
  
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CASH'>('UPI');
  const [customerName, setCustomerName] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);

  const tableInfoStr = localStorage.getItem('tableInfo');
  const tableInfo = tableInfoStr ? JSON.parse(tableInfoStr) : null;

  useEffect(() => {
    if (!tableInfo && !orderSuccess) {
      toast.error('Please scan a QR code first');
      navigate('/');
    }
  }, [tableInfo, navigate, orderSuccess]);

  const handlePlaceOrder = async () => {
    if (!customerName.trim()) {
      toast.error('Please enter your name');
      return;
    }

    setIsOrdering(true);
    try {
      const orderData = {
        tableNumber: tableInfo.tableNumber,
        customerName,
        items: items.map(i => ({
          itemId: i.menuItem._id,
          quantity: i.quantity,
          specialInstructions: i.specialInstructions
        })),
        paymentMethod,
        couponCode: couponCode || undefined
      };

      const res = await api.post('/orders/create', orderData);
      setOrderSuccess(res.data.orderId);
      clearCart();
      toast.success('Order placed successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally {
      setIsOrdering(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center animate-fade-in">
        <div className="w-24 h-24 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-8 border-4 border-emerald-500/20">
          <CheckCircle2 size={48} className="animate-bounce-light" />
        </div>
        <h1 className="text-3xl font-bold font-display text-gold mb-2">Order Confirmed!</h1>
        <p className="text-brand-700 mb-8">Your order has been sent to the kitchen. You can track its status below.</p>
        
        <div className="card p-6 w-full max-w-sm mb-8 border-dashed border-brand-600/30">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-700">Order ID</span>
            <span className="font-mono font-bold text-gold">{orderSuccess.slice(-8).toUpperCase()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-700">Table Number</span>
            <span className="font-bold text-gold">{tableInfo?.tableNumber}</span>
          </div>
        </div>

        <div className="flex flex-col w-full max-w-sm gap-4">
          <button 
            onClick={() => navigate(`/order/${orderSuccess}`)}
            className="btn-primary py-4 rounded-2xl"
          >
            Track Your Order
          </button>
          <button 
            onClick={() => navigate(`/table/${tableInfo?.id || ''}`)}
            className="btn-secondary py-4 rounded-2xl"
          >
            Order More Items
          </button>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center animate-fade-in">
        <div className="w-20 h-20 rounded-3xl bg-dark-muted flex items-center justify-center text-brand-700 mb-6">
          <UtensilsCrossed size={40} />
        </div>
        <h1 className="text-2xl font-bold font-display text-gold mb-2">Your cart is empty</h1>
        <p className="text-brand-700 mb-8">Add some delicious items from the menu to get started.</p>
        <button 
          onClick={() => navigate(-1)}
          className="btn-primary px-8 py-4 rounded-2xl"
        >
          Browse Menu
        </button>
      </div>
    );
  }

  const tax = subtotal * 0.05; // 5% GST
  const total = subtotal + tax;

  return (
    <div className="animate-fade-in p-4 md:p-6 pb-32 max-w-2xl mx-auto">
      <div className="mb-8 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl glass text-brand-600">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold font-display text-gold">Review Order</h1>
      </div>

      {/* Cart Items */}
      <div className="space-y-4 mb-8">
        {items.map(item => (
          <div key={item.menuItem._id} className="card p-4 flex gap-4 animate-slide-up">
            <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-brand-600/5">
              {item.menuItem.imageUrl ? (
                <img src={item.menuItem.imageUrl} alt={item.menuItem.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-brand-600/40">
                  <UtensilsCrossed size={24} />
                </div>
              )}
            </div>
            <div className="flex-1 flex flex-col">
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-gold">{item.menuItem.name}</h3>
                <button onClick={() => removeFromCart(item.menuItem._id)} className="text-brand-700 hover:text-red-500 transition-all">
                  <Trash2 size={16} />
                </button>
              </div>
              <p className="text-[10px] text-brand-700 line-clamp-1 mt-1 mb-2 italic">"{item.specialInstructions || 'No instructions'}"</p>
              <div className="mt-auto flex items-center justify-between">
                <span className="text-sm font-bold text-brand-600">₹{item.menuItem.price * item.quantity}</span>
                <div className="flex items-center gap-3 bg-brand-600/10 text-brand-600 rounded-xl px-2 py-1">
                  <button onClick={() => updateQuantity(item.menuItem._id, -1)} className="p-1 hover:bg-brand-600/10 rounded-lg">
                    <Minus size={14} />
                  </button>
                  <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.menuItem._id, 1)} className="p-1 hover:bg-brand-600/10 rounded-lg">
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Details Form */}
      <div className="space-y-6 mb-8">
        <div>
          <label className="label">Your Name</label>
          <input 
            className="input h-14 rounded-2xl border-brand-600/20" 
            placeholder="Enter your name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />
        </div>

        <div>
          <label className="label">Payment Method</label>
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => setPaymentMethod('UPI')}
              className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all ${paymentMethod === 'UPI' ? 'border-brand-600 bg-brand-600/10 shadow-gold' : 'border-brand-600/10 glass'}`}
            >
              <CreditCard size={24} className={paymentMethod === 'UPI' ? 'text-brand-600' : 'text-brand-700'} />
              <span className={`text-xs font-bold ${paymentMethod === 'UPI' ? 'text-brand-600' : 'text-brand-700'}`}>UPI Payment</span>
            </button>
            <button 
              onClick={() => setPaymentMethod('CASH')}
              className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all ${paymentMethod === 'CASH' ? 'border-brand-600 bg-brand-600/10 shadow-gold' : 'border-brand-600/10 glass'}`}
            >
              <Banknote size={24} className={paymentMethod === 'CASH' ? 'text-brand-600' : 'text-brand-700'} />
              <span className={`text-xs font-bold ${paymentMethod === 'CASH' ? 'text-brand-600' : 'text-brand-700'}`}>Cash on Counter</span>
            </button>
          </div>
        </div>

        <div>
          <label className="label">Discount Coupon</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-700" size={18} />
              <input 
                className="input pl-10 h-12 rounded-xl" 
                placeholder="Enter code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              />
            </div>
            <button className="btn-secondary h-12 px-6 rounded-xl border-brand-600/30">Apply</button>
          </div>
        </div>
      </div>

      {/* Bill Summary */}
      <div className="card p-6 space-y-3 mb-8 bg-dark-muted/30">
        <div className="flex justify-between text-sm">
          <span className="text-brand-700">Subtotal</span>
          <span className="font-bold text-gold">₹{subtotal}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-brand-700">GST (5%)</span>
          <span className="font-bold text-gold">₹{tax.toFixed(2)}</span>
        </div>
        <div className="divider my-2"></div>
        <div className="flex justify-between items-center">
          <span className="font-bold text-gold">To Pay</span>
          <span className="text-2xl font-bold text-brand-600">₹{total.toFixed(2)}</span>
        </div>
      </div>

      {/* Place Order Button */}
      <button 
        onClick={handlePlaceOrder}
        disabled={isOrdering}
        className="w-full btn-primary h-16 rounded-2xl text-lg flex items-center justify-center gap-3 group"
      >
        {isOrdering ? <Loader2 size={24} className="animate-spin" /> : (
          <>
            Place Order
            <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
          </>
        )}
      </button>
    </div>
  );
};

export default Cart;
