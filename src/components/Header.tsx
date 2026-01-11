

'use client';

import Link from 'next/link';
import Logo from './Logo';
import { useCart } from '@/context/CartContext';
import { useCustomerAuth } from '@/context/CustomerAuthContext';
import { useAuth } from '@/context/AuthContext';
import { Button, buttonVariants } from './ui/button';
import { ShoppingBag, User, Search, Settings } from 'lucide-react';
import { CartSheet } from './CartSheet';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { Input } from './ui/input';
import { usePathname, useRouter } from 'next/navigation';

export default function Header() {
  const { cartCount, headerSearch, setHeaderSearch } = useCart();
  const { customer } = useCustomerAuth();
  const { user: adminUser } = useAuth();
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if(pathname !== '/') {
        router.push('/');
    }
  };

  const customerLink = isClient && customer ? "/area-cliente/minha-conta" : "/area-cliente/login";

  return (
    <div className="bg-card/80 backdrop-blur-lg border-b sticky top-0 z-40">
      <div className="container mx-auto flex justify-between items-center p-4 gap-4">
        <Link href="/">
          <Logo />
        </Link>

        <div className="flex-grow max-w-md hidden md:block">
            <form onSubmit={handleSearch}>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar produtos..."
                        className="pl-10"
                        value={headerSearch}
                        onChange={(e) => setHeaderSearch(e.target.value)}
                    />
                </div>
            </form>
        </div>

        <div className="flex items-center gap-2">
            <Link href="/admin/pedidos" className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}>
                <Settings />
                <span className="sr-only">Painel Administrativo</span>
            </Link>
            <Link href={customerLink} className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "sm:w-auto sm:px-4")}>
                <User className="sm:mr-2" />
                <span className="hidden sm:inline">Área do Cliente</span>
            </Link>
            {isClient && (
              <CartSheet>
                  <Button variant="ghost" className="relative sm:w-auto sm:px-4">
                      <ShoppingBag className="sm:mr-2" />
                      <span className="hidden sm:inline">Carrinho</span>
                      {cartCount > 0 && (
                          <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold leading-none text-primary-foreground transform translate-x-1/2 -translate-y-1/2 bg-accent rounded-full">
                          {cartCount}
                          </span>
                      )}
                  </Button>
              </CartSheet>
            )}
        </div>
      </div>
    </div>
  );
}



