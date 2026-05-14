import React, { createContext, useContext, useState, useEffect } from 'react';
import type { CartItem, MenuItem } from '../types';

interface CartContextType {
  items: CartItem[];
  addToCart: (item: MenuItem, instructions?: string) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, delta: number) => void;
  clearCart: () => void;
  subtotal: number;
  totalItems: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (menuItem: MenuItem, specialInstructions: string = '') => {
    setItems((prev) => {
      const existing = prev.find((i) => i.menuItem._id === menuItem._id);
      if (existing) {
        return prev.map((i) =>
          i.menuItem._id === menuItem._id
            ? { ...i, quantity: i.quantity + 1, specialInstructions: specialInstructions || i.specialInstructions }
            : i
        );
      }
      return [...prev, { menuItem, quantity: 1, specialInstructions }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setItems((prev) => prev.filter((i) => i.menuItem._id !== itemId));
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((i) => (i.menuItem._id === itemId ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i))
        .filter((i) => i.quantity > 0)
    );
  };

  const clearCart = () => setItems([]);

  const subtotal = items.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, subtotal, totalItems }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
