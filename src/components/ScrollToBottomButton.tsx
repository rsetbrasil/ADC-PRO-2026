'use client';

import { Button } from '@/components/ui/button';
import { ArrowDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export default function ScrollToBottomButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      // Show button if user has scrolled down a bit, but not to the very bottom
      const isScrolled = window.scrollY > 300;
      const isAtBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 150;
      
      if (isScrolled && !isAtBottom) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    
    // Check on mount as well
    toggleVisibility();

    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToBottom = () => {
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: 'smooth',
    });
  };

  return (
    <div className="fixed bottom-24 right-6 z-50 print-hidden">
        <Button
            onClick={scrollToBottom}
            className={cn(
                'h-14 w-14 rounded-full bg-primary/80 backdrop-blur-sm text-primary-foreground shadow-lg transition-opacity hover:bg-primary',
                isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
            )}
            aria-label="Ir para o final da página"
        >
            <ArrowDown className="h-6 w-6" />
        </Button>
    </div>
  );
}
