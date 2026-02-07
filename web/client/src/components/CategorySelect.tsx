/**
 * Category Select Component
 * A searchable dropdown for selecting event categories
 */

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, ChevronsUpDown, Search, X } from 'lucide-react';
import { EVENT_CATEGORIES, getCategoryLabel, type EventCategory } from '@/lib/event-categories';
import { cn } from '@/lib/utils';

interface CategorySelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  showCustomInput?: boolean; // Show input when "Other" is selected
  customValue?: string;
  onCustomValueChange?: (value: string) => void;
}

export function CategorySelect({
  value,
  onValueChange,
  placeholder = 'Select category...',
  label,
  required,
  showCustomInput = true,
  customValue = '',
  onCustomValueChange,
}: CategorySelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  // Filter categories based on search
  const filteredCategories = EVENT_CATEGORIES.filter(
    (category) =>
      category.label.toLowerCase().includes(search.toLowerCase()) ||
      category.value.toLowerCase().includes(search.toLowerCase())
  );

  // Group filtered categories
  const groupedCategories = {
    mice: filteredCategories.filter((c) => c.group === 'mice'),
    general: filteredCategories.filter((c) => c.group === 'general' && c.value !== 'other'),
    entertainment: filteredCategories.filter((c) => c.group === 'entertainment'),
    lifestyle: filteredCategories.filter((c) => c.group === 'lifestyle'),
    other: filteredCategories.filter((c) => c.value === 'other'),
  };

  const handleSelect = (categoryValue: string) => {
    onValueChange(categoryValue);
    setOpen(false);
    setSearch('');
  };

  const selectedLabel = value ? getCategoryLabel(value) : '';
  const isOtherSelected = value === 'other';

  return (
    <div className="space-y-2">
      {label && (
        <Label>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}

      <div ref={containerRef} className="relative">
        {/* Trigger Button */}
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
          onClick={() => setOpen(!open)}
        >
          <span className={cn(!value && 'text-muted-foreground')}>
            {selectedLabel || placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>

        {/* Dropdown */}
        {open && (
          <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
            {/* Search Input */}
            <div className="p-2 border-b">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={inputRef}
                  placeholder="Search categories..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-8"
                />
                {search && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                    onClick={() => setSearch('')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>

            {/* Categories List */}
            <div className="max-h-64 overflow-y-auto p-1">
              {filteredCategories.length === 0 ? (
                <div className="py-4 text-center text-sm text-muted-foreground">
                  No categories found
                </div>
              ) : (
                <>
                  {/* MICE / Professional */}
                  {groupedCategories.mice.length > 0 && (
                    <CategoryGroup
                      title="Professional / MICE"
                      categories={groupedCategories.mice}
                      selectedValue={value}
                      onSelect={handleSelect}
                    />
                  )}

                  {/* Entertainment */}
                  {groupedCategories.entertainment.length > 0 && (
                    <CategoryGroup
                      title="Entertainment"
                      categories={groupedCategories.entertainment}
                      selectedValue={value}
                      onSelect={handleSelect}
                    />
                  )}

                  {/* Lifestyle */}
                  {groupedCategories.lifestyle.length > 0 && (
                    <CategoryGroup
                      title="Lifestyle"
                      categories={groupedCategories.lifestyle}
                      selectedValue={value}
                      onSelect={handleSelect}
                    />
                  )}

                  {/* General */}
                  {groupedCategories.general.length > 0 && (
                    <CategoryGroup
                      title="General"
                      categories={groupedCategories.general}
                      selectedValue={value}
                      onSelect={handleSelect}
                    />
                  )}

                  {/* Other - always at the end */}
                  {groupedCategories.other.length > 0 && (
                    <div className="border-t mt-1 pt-1">
                      {groupedCategories.other.map((category) => (
                        <CategoryItem
                          key={category.value}
                          category={category}
                          isSelected={value === category.value}
                          onSelect={handleSelect}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Custom category input when "Other" is selected */}
      {showCustomInput && isOtherSelected && (
        <Input
          placeholder="Enter custom category..."
          value={customValue}
          onChange={(e) => onCustomValueChange?.(e.target.value)}
          className="mt-2"
        />
      )}
    </div>
  );
}

interface CategoryGroupProps {
  title: string;
  categories: EventCategory[];
  selectedValue: string;
  onSelect: (value: string) => void;
}

function CategoryGroup({ title, categories, selectedValue, onSelect }: CategoryGroupProps) {
  return (
    <div className="py-1">
      <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {title}
      </div>
      {categories.map((category) => (
        <CategoryItem
          key={category.value}
          category={category}
          isSelected={selectedValue === category.value}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

interface CategoryItemProps {
  category: EventCategory;
  isSelected: boolean;
  onSelect: (value: string) => void;
}

function CategoryItem({ category, isSelected, onSelect }: CategoryItemProps) {
  return (
    <button
      type="button"
      className={cn(
        'relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none',
        'hover:bg-accent hover:text-accent-foreground',
        isSelected && 'bg-accent'
      )}
      onClick={() => onSelect(category.value)}
    >
      <Check
        className={cn('mr-2 h-4 w-4', isSelected ? 'opacity-100' : 'opacity-0')}
      />
      {category.label}
    </button>
  );
}
