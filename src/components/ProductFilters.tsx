

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { Category } from '@/lib/types';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface ProductFiltersProps {
  onFilterChange: (filters: {
    category?: string;
    subcategory?: string;
  }) => void;
  categories: Category[];
  currentFilters: {
      category: string;
      subcategory: string;
      search: string;
      sort: string;
  }
}

export default function ProductFilters({ onFilterChange, categories, currentFilters }: ProductFiltersProps) {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const handleCategoryClick = (category: Category) => {
    // If it's already selected, filter by it (main category). If it has no subcategories, also filter.
    if (selectedCategory?.id === category.id || category.subcategories.length === 0) {
      setSelectedCategory(null);
      onFilterChange({ category: category.name, subcategory: 'all' });
    } else {
      setSelectedCategory(category);
      onFilterChange({ category: category.name, subcategory: 'all' });
    }
  };

  const handleSubcategoryClick = (subcategory: string) => {
    if (selectedCategory) {
      onFilterChange({ category: selectedCategory.name, subcategory: subcategory });
    }
  }
  
  const handleShowAll = () => {
    setSelectedCategory(null);
    onFilterChange({ category: 'all', subcategory: 'all' });
  }

  return (
    <div className="bg-card p-4 rounded-lg shadow-sm mb-8">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 items-stretch gap-2">
        <Button
            variant={currentFilters.category === 'all' ? 'default' : 'outline'}
            onClick={handleShowAll}
            className="text-xs px-2 h-auto py-2 flex items-center justify-center text-center"
        >
            Todas
        </Button>
        {categories.map((cat) => (
            <Button
                key={cat.id}
                variant={currentFilters.category === cat.name ? 'default' : 'outline'}
                onClick={() => handleCategoryClick(cat)}
                className="text-xs px-2 h-auto py-2 flex items-center justify-center text-center capitalize"
            >
                {cat.name}
            </Button>
        ))}
      </div>
       <AnimatePresence>
        {selectedCategory && selectedCategory.subcategories.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="mt-4 pt-4 border-t">
              <h3 className="text-sm font-semibold mb-2 text-muted-foreground capitalize">Subcategorias de {selectedCategory.name}</h3>
              <div className="flex flex-wrap gap-2">
                {selectedCategory.subcategories.map((sub) => (
                  <Button
                    key={sub}
                    variant={currentFilters.subcategory === sub ? 'secondary' : 'ghost'}
                    onClick={() => handleSubcategoryClick(sub)}
                    className="text-xs px-3 h-8 capitalize"
                  >
                    {sub}
                  </Button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
