
'use client';

import { Button } from '@/components/ui/button';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export default function ScrollButtons() {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const checkScrollPosition = () => {
      const isScrolled = window.scrollY > 300;
      setShowScrollTop(isScrolled);
    };

    window.addEventListener('scroll', checkScrollPosition);
    checkScrollPosition(); // Check on mount

    return () => window.removeEventListener('scroll', checkScrollPosition);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="fixed bottom-24 right-6 z-50 flex flex-col gap-2 print-hidden">
        <Button
            onClick={scrollToTop}
            className={cn(
                'h-12 w-12 rounded-full bg-primary/80 backdrop-blur-sm text-primary-foreground shadow-lg transition-all hover:bg-primary',
                showScrollTop ? 'opacity-100 scale-100' : 'opacity-0 scale-0 pointer-events-none'
            )}
            aria-label="Ir para o topo da página"
        >
            <ArrowUp className="h-6 w-6" />
        </Button>
    </div>
  );
}
