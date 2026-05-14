import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Search, 
  Plus, 
  Minus, 
  Info,
  ChevronRight,
  UtensilsCrossed,
  Clock
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../utils/api';
import type { MenuItem, MenuCategory } from '../../types';
import { useCart } from '../../context/CartContext';

const CATEGORIES: MenuCategory[] = ['Starters', 'Main Course', 'Desserts', 'Drinks', 'Snacks', 'Breads', 'Rice', 'Combos'];

const CustomerMenu: React.FC = () => {
  const { tableId } = useParams<{ tableId: string }>();
  const navigate = useNavigate();
  const { addToCart, items: cartItems, updateQuantity } = useCart();
  
  const [activeCategory, setActiveCategory] = useState<MenuCategory | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [tableInfo, setTableInfo] = useState<{ tableNumber: number; id: string } | null>(null);

  // Verify Table
  useEffect(() => {
    const verifyTable = async () => {
      try {
        const res = await api.get(`/tables/verify/${tableId}`);
        setTableInfo({ tableNumber: res.data.tableNumber, id: res.data.tableId });
        localStorage.setItem('tableInfo', JSON.stringify({ tableNumber: res.data.tableNumber, id: res.data.tableId }));
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Invalid table');
        navigate('/');
      }
    };
    if (tableId) verifyTable();
  }, [tableId, navigate]);

  // Fetch Menu
  const { data: menuData, isLoading } = useQuery<{ items: MenuItem[] }>({
    queryKey: ['available-menu'],
    queryFn: async () => {
      const res = await api.get('/menu/available');
      return res.data;
    },
  });

  const filteredItems = menuData?.items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  }) || [];

  const getCartQuantity = (itemId: string) => {
    return cartItems.find(i => i.menuItem._id === itemId)?.quantity || 0;
  };

  if (isLoading || !tableInfo) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 dark:bg-dark-bg bg-light-bg">
        <div className="w-12 h-12 rounded-xl bg-brand-600 animate-spin flex items-center justify-center">
          <div className="w-6 h-6 bg-white rounded-sm"></div>
        </div>
        <p className="text-sm font-bold text-gold animate-pulse">Loading Menu...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in p-4 md:p-6 pb-32">
      {/* Header Info */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-gold">Table {tableInfo.tableNumber}</h1>
          <p className="text-xs text-brand-700 font-bold uppercase tracking-widest mt-1">Enjoy your meal</p>
        </div>
        <div className="px-4 py-2 rounded-xl glass border-brand-600/20 flex items-center gap-2">
          <Clock size={16} className="text-brand-600" />
          <span className="text-sm font-bold text-gold">15-20 min</span>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-700" size={18} />
        <input
          type="text"
          className="input pl-10 h-12 rounded-2xl"
          placeholder="Search for dishes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Categories */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mb-8 pb-2">
        <button 
          onClick={() => setActiveCategory('All')}
          className={`px-6 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${activeCategory === 'All' ? 'bg-brand-600 text-white shadow-gold' : 'glass text-brand-700'}`}
        >
          All Items
        </button>
        {CATEGORIES.map(cat => (
          <button 
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-6 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${activeCategory === cat ? 'bg-brand-600 text-white shadow-gold' : 'glass text-brand-700'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Menu Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filteredItems.map(item => {
          const quantity = getCartQuantity(item._id);
          return (
            <div key={item._id} className="card p-3 flex gap-4 hover:border-brand-600/50 transition-all group">
              <div className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 bg-brand-600/5">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-brand-600/40">
                    <UtensilsCrossed size={32} />
                  </div>
                )}
              </div>
              <div className="flex-1 flex flex-col">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-gold">{item.name}</h3>
                </div>
                <p className="text-[10px] text-brand-700 line-clamp-2 mt-1 leading-relaxed">{item.description}</p>
                <div className="mt-auto flex items-center justify-between">
                  <span className="text-sm font-bold text-emerald-500">₹{item.price}</span>
                  
                  {quantity > 0 ? (
                    <div className="flex items-center gap-3 bg-brand-600 text-white rounded-xl px-2 py-1 shadow-gold">
                      <button onClick={() => updateQuantity(item._id, -1)} className="p-1 hover:bg-white/20 rounded-lg">
                        <Minus size={14} />
                      </button>
                      <span className="text-sm font-bold w-4 text-center">{quantity}</span>
                      <button onClick={() => updateQuantity(item._id, 1)} className="p-1 hover:bg-white/20 rounded-lg">
                        <Plus size={14} />
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => {
                        addToCart(item);
                        toast.success(`Added ${item.name}`);
                      }} 
                      className="btn-secondary px-3 py-1.5 text-xs rounded-xl border-brand-600/30"
                    >
                      Add to Cart
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <div className="py-20 flex flex-col items-center text-center">
          <Info size={40} className="text-brand-700 mb-4" />
          <h3 className="text-lg font-bold text-gold">No items found</h3>
          <p className="text-sm text-brand-700 mt-1">Try a different category or search term.</p>
        </div>
      )}

      {/* Floating Cart Button */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-24 left-4 right-4 animate-slide-up z-40">
          <button 
            onClick={() => navigate('/cart')}
            className="w-full btn-primary h-14 rounded-2xl shadow-gold-lg flex items-center justify-between px-6"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center font-bold">
                {cartItems.reduce((acc, i) => acc + i.quantity, 0)}
              </div>
              <span className="font-bold">View Cart</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold">₹{cartItems.reduce((acc, i) => acc + i.menuItem.price * i.quantity, 0)}</span>
              <ChevronRight size={20} />
            </div>
          </button>
        </div>
      )}
    </div>
  );
};

export default CustomerMenu;
