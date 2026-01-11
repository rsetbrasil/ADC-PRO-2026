
'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from './ui/button';
import { useCart } from '@/context/CartContext';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import type { Category } from '@/lib/types';
import { useEffect, useState } from 'react';

interface FilterSheetProps {
    categories: Category[];
    onFilterChange: (filters: {
        category?: string;
        subcategory?: string;
    }) => void;
    currentFilters: {
        category: string;
        subcategory: string;
    }
}

export default function FilterSheet({ categories, onFilterChange, currentFilters }: FilterSheetProps) {
  const { isFilterSheetOpen, setIsFilterSheetOpen, selectedCategoryForSheet } = useCart();
  const [openAccordion, setOpenAccordion] = useState<string | undefined>();

  useEffect(() => {
    if (isFilterSheetOpen && selectedCategoryForSheet) {
      const category = categories.find(c => c.name === selectedCategoryForSheet);
      if (category && category.subcategories.length > 0) {
        setOpenAccordion(category.id);
      } else {
        setOpenAccordion(undefined);
      }
    }
  }, [isFilterSheetOpen, selectedCategoryForSheet, categories]);
  
  const handleFilterClick = (category: string, subcategory = 'all') => {
    onFilterChange({ category, subcategory });
    setIsFilterSheetOpen(false);
  }

  return (
    <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
      <SheetContent side="left" className="flex flex-col">
        <SheetHeader>
          <SheetTitle className="text-2xl font-headline">Filtros</SheetTitle>
        </SheetHeader>
        <div className="flex-grow mt-4">
            <Accordion type="single" collapsible className="w-full" value={openAccordion} onValueChange={setOpenAccordion}>
                <Button 
                    variant={currentFilters.category === 'all' ? 'secondary' : 'ghost'} 
                    onClick={() => handleFilterClick('all')} 
                    className="w-full justify-start mb-2 text-left h-auto py-3"
                >
                    Todas as Categorias
                </Button>

                {categories.map((cat) => (
                    <AccordionItem value={cat.id} key={cat.id} className="border-none">
                        <AccordionTrigger 
                            className="py-3 hover:no-underline hover:bg-muted/50 rounded-md px-3 text-md capitalize"
                            onClick={() => {
                                if (cat.subcategories.length === 0) {
                                    handleFilterClick(cat.name);
                                } else {
                                    // Accordion behavior will open it
                                    onFilterChange({ category: cat.name, subcategory: 'all' });
                                }
                            }}
                        >
                            {cat.name}
                        </AccordionTrigger>
                        {cat.subcategories && cat.subcategories.length > 0 && (
                            <AccordionContent className="pt-2 pl-4">
                                <Button 
                                    variant={currentFilters.category === cat.name && currentFilters.subcategory === 'all' ? 'secondary' : 'ghost'} 
                                    onClick={() => handleFilterClick(cat.name, 'all')} 
                                    className="w-full justify-start mb-1 text-left h-auto py-2"
                                >
                                    Tudo em {cat.name}
                                </Button>
                                {cat.subcategories.map(sub => (
                                    <Button
                                        key={sub}
                                        variant={currentFilters.subcategory === sub ? 'secondary' : 'ghost'}
                                        onClick={() => handleFilterClick(cat.name, sub)}
                                        className="w-full justify-start text-left h-auto py-2 capitalize"
                                    >
                                        {sub}
                                    </Button>
                                ))}
                            </AccordionContent>
                        )}
                    </AccordionItem>
                ))}
            </Accordion>
        </div>
      </SheetContent>
    </Sheet>
  );
}
