
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { CartItem, Order, Product } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useData } from './DataContext';

const saveDataToLocalStorage = (key: string, data: any) => {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.error(`Failed to save ${key} to localStorage`, error);
    }
};

const loadDataFromLocalStorage = (key: string) => {
    if (typeof window === 'undefined') return null;
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error(`Failed to load ${key} from localStorage`, error);
        return null;
    }
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  cartCount: number;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  isFilterSheetOpen: boolean;
  setIsFilterSheetOpen: (isOpen: boolean) => void;
  selectedCategoryForSheet: string | null;
  setSelectedCategoryForSheet: (category: string | null) => void;
  lastOrder: Order | null;
  setLastOrder: (order: Order) => void;
  headerSearch: string;
  setHeaderSearch: (search: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [selectedCategoryForSheet, setSelectedCategoryForSheet] = useState<string | null>(null);
  const [lastOrder, setLastOrderState] = useState<Order | null>(null);
  const [headerSearch, setHeaderSearch] = useState('');
  const { toast } = useToast();
  const { products } = useData();

  useEffect(() => {
    const storedCart = loadDataFromLocalStorage('cartItems');
    if (storedCart) setCartItems(storedCart);

    const storedLastOrder = loadDataFromLocalStorage('lastOrder');
    if(storedLastOrder) setLastOrderState(storedLastOrder);
    
  }, []);

  const addToCart = (product: Product) => {
    if (product.stock < 1) {
      toast({ title: "Produto Esgotado", description: "Este produto está fora de estoque.", variant: "destructive" });
      return;
    }

    const updatedCart = [...cartItems];
    const existingItemIndex = updatedCart.findIndex(item => item.id === product.id);

    if (existingItemIndex > -1) {
      const existingItem = updatedCart[existingItemIndex];
      if (existingItem.quantity < product.stock) {
        existingItem.quantity += 1;
      } else {
        toast({ title: "Limite de Estoque Atingido", description: `Você já tem a quantidade máxima (${product.stock}) deste item no carrinho.` });
        return;
      }
    } else {
      updatedCart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        imageUrl: product.imageUrls?.[0] || 'https://placehold.co/100x100.png',
      });
    }

    setCartItems(updatedCart);
    saveDataToLocalStorage('cartItems', updatedCart);
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string) => {
    const newCartItems = cartItems.filter(item => item.id !== productId);
    setCartItems(newCartItems);
    saveDataToLocalStorage('cartItems', newCartItems);
  };
  
  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(productId);
      return;
    }

    const productInCatalog = products.find(p => p.id === productId);
    const stockLimit = productInCatalog?.stock ?? 0;

    if (quantity > stockLimit) {
      toast({ title: "Limite de Estoque Atingido", description: `A quantidade máxima para este item é ${stockLimit}.` });
      quantity = stockLimit;
    }

    const newCartItems = cartItems.map(item =>
      (item.id === productId)
        ? { ...item, quantity }
        : item
    );
    setCartItems(newCartItems);
    saveDataToLocalStorage('cartItems', newCartItems);
  };

  const clearCart = () => {
    setCartItems([]);
    saveDataToLocalStorage('cartItems', []);
  };

  const getCartTotal = () => cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);

  const setLastOrder = (order: Order) => {
      setLastOrderState(order);
      saveDataToLocalStorage('lastOrder', order);
  }

  return (
    <CartContext.Provider
      value={{
        cartItems, addToCart, removeFromCart, updateQuantity, clearCart, getCartTotal, cartCount, 
        isCartOpen, setIsCartOpen, 
        isFilterSheetOpen, setIsFilterSheetOpen,
        selectedCategoryForSheet, setSelectedCategoryForSheet,
        lastOrder, setLastOrder,
        headerSearch, setHeaderSearch,
      }}
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
