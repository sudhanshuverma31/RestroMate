import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Utensils, History } from 'lucide-react';
import { useCart } from '../context/CartContext';


const CustomerLayout: React.FC = () => {
  const { totalItems } = useCart();

  const location = useLocation();

  const isCartPage = location.pathname === '/cart';


  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 dark:bg-dark-bg bg-light-bg`}>
      {/* Header */}
      <header className="h-16 sticky top-0 z-50 glass border-b dark:border-dark-border border-light-border px-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center shadow-gold">
            <Utensils size={16} className="text-white" />
          </div>
          <span className="text-lg font-bold font-display text-gold">RestroMate</span>
        </Link>

        <div className="flex items-center gap-3">
          {!isCartPage && (
            <Link to="/cart" className="relative p-2 rounded-xl bg-brand-600/10 text-brand-600 hover:bg-brand-600/20 transition-all">
              <ShoppingCart size={20} />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 dark:border-dark-bg border-white">
                  {totalItems}
                </span>
              )}
            </Link>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-auto pb-24">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-20 glass border-t dark:border-dark-border border-light-border px-6 flex items-center justify-around z-50 pb-2">
        <Link to="/" className={`flex flex-col items-center gap-1 p-2 transition-all ${location.pathname === '/' ? 'text-brand-600' : 'text-brand-700/60 dark:text-brand-500/60'}`}>
          <Utensils size={24} className={location.pathname === '/' ? 'scale-110' : ''} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Menu</span>
        </Link>
        
        <Link to="/cart" className={`flex flex-col items-center gap-1 p-2 transition-all ${isCartPage ? 'text-brand-600' : 'text-brand-700/60 dark:text-brand-500/60'}`}>
          <div className="relative">
            <ShoppingCart size={24} className={isCartPage ? 'scale-110' : ''} />
            {totalItems > 0 && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-brand-600 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                {totalItems}
              </div>
            )}
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider">Cart</span>
        </Link>

        <Link to="/order/history" className={`flex flex-col items-center gap-1 p-2 transition-all ${location.pathname === '/order/history' ? 'text-brand-600' : 'text-brand-700/60 dark:text-brand-500/60'}`}>
          <History size={24} className={location.pathname === '/order/history' ? 'scale-110' : ''} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Orders</span>
        </Link>
      </nav>
    </div>
  );
};

export default CustomerLayout;
