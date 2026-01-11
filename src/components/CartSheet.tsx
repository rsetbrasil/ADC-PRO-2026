
'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetTrigger,
  SheetClose
} from '@/components/ui/sheet';
import { Button } from './ui/button';
import { useCart } from '@/context/CartContext';
import { Minus, Plus, Trash2, ShoppingCart, AlertTriangle } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { useMemo } from 'react';
import { useData } from '@/context/DataContext';


const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
};

export function CartSheet({ children }: { children: React.ReactNode }) {
  const { cartItems, updateQuantity, removeFromCart, getCartTotal, cartCount, isCartOpen, setIsCartOpen } = useCart();
  const { products, isLoading } = useData();
  
  const cartItemsWithStock = useMemo(() => {
    if (isLoading) return [];
    return cartItems.map(item => {
      const productInfo = products.find(p => p.id === item.id);
      const stock = productInfo?.stock ?? 0;

      return {
        ...item,
        stock: stock,
        hasEnoughStock: stock >= item.quantity,
        imageUrl: item.imageUrl || 'https://placehold.co/100x100.png',
      };
    });
  }, [cartItems, products, isLoading]);

  const isCartValid = cartItemsWithStock.every(item => item.hasEnoughStock && item.quantity > 0);


  return (
    <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle className="text-2xl font-headline">Seu Carrinho ({cartCount})</SheetTitle>
        </SheetHeader>
        {cartItems.length > 0 ? (
          <>
            <ScrollArea className="flex-grow pr-4 -mr-6 my-4">
            {isLoading ? (
              <p>Carregando itens...</p>
            ) : (
              <div className="flex flex-col gap-6">
                {cartItemsWithStock.map((item) => (
                  <div key={item.id} className="flex items-start gap-4">
                    <div className="relative h-20 w-20 rounded-md overflow-hidden flex-shrink-0">
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-grow">
                      <p className="font-semibold text-md">{item.name}</p>
                      <p className="text-sm text-muted-foreground">{formatCurrency(item.price)}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span>{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= item.stock}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                       {!item.hasEnoughStock && (
                          <div className="flex items-center gap-1 text-xs text-destructive mt-2">
                              <AlertTriangle className="h-3 w-3" />
                              <span>Estoque: {item.stock}. Ajuste a quantidade.</span>
                          </div>
                       )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => removeFromCart(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            </ScrollArea>
            <SheetFooter className="mt-auto">
                <div className="w-full space-y-4">
                    <Separator />
                    <div className="flex justify-between items-center font-bold text-lg">
                        <span>Total:</span>
                        <span>{formatCurrency(getCartTotal())}</span>
                    </div>
                     <div className="space-y-2">
                        <SheetClose asChild>
                          <Link href="/checkout" className="w-full">
                            <Button size="lg" className="w-full bg-accent hover:bg-accent/90" disabled={!isCartValid || isLoading}>
                                Finalizar Compra
                            </Button>
                          </Link>
                        </SheetClose>
                        <SheetClose asChild>
                           <Button size="lg" variant="outline" className="w-full">
                                Continuar Comprando
                            </Button>
                        </SheetClose>
                    </div>
                </div>
            </SheetFooter>
          </>
        ) : (
          <div className="flex-grow flex flex-col items-center justify-center text-center">
            <ShoppingCart className="w-20 h-20 text-muted-foreground/50 mb-4" />
            <p className="text-lg font-semibold">Seu carrinho está vazio.</p>
            <p className="text-sm text-muted-foreground">Adicione produtos para continuar.</p>
             <SheetClose asChild>
                <Button variant="outline" className="mt-6">
                    Continuar comprando
                </Button>
            </SheetClose>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
