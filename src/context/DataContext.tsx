

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { getClientFirebase } from '@/lib/firebase-client';
import type { Product, Category, Order, CommissionPayment, StockAudit, Avaria, CustomerInfo, ChatSession } from '@/lib/types';

// This context now only handles PUBLIC data.
// Admin-related data has been moved to AdminContext for performance optimization.
interface DataContextType {
  products: Product[];
  categories: Category[];
  isLoading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  useEffect(() => {
    const { db } = getClientFirebase();
    const productsUnsubscribe = onSnapshot(query(collection(db, 'products'), orderBy('createdAt', 'asc')), (snapshot) => {
      const fetchedProducts = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Product));
      setProducts(fetchedProducts);
      setProductsLoading(false);
    }, (error) => {
        console.error("Error fetching products:", error);
        setProductsLoading(false);
    });

    const categoriesUnsubscribe = onSnapshot(query(collection(db, 'categories'), orderBy('order')), (snapshot) => {
      setCategories(snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Category)));
      setCategoriesLoading(false);
    }, (error) => {
        console.error("Error fetching categories:", error);
        setCategoriesLoading(false);
    });
    
    return () => {
      productsUnsubscribe();
      categoriesUnsubscribe();
    };
  }, []);

  const isLoading = productsLoading || categoriesLoading;

  const value = useMemo(() => ({
    products, 
    categories, 
    isLoading,
  }), [
    products, 
    categories, 
    isLoading,
  ]);

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
