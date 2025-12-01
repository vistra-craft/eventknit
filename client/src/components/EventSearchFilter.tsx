import { useState, useEffect } from "react";
import { Search, MapPin, Calendar, DollarSign, Monitor, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";

export interface SearchFilters {
  search?: string;
  location?: string;
  category?: string;
  dateRange?: 'anytime' | 'today' | 'tomorrow' | 'this-week' | 'this-weekend' | 'next-week' | 'next-month';
  priceRange?: 'any' | 'free' | 'under-25' | '25-50' | '50-100' | '100-plus';
  eventType?: 'all' | 'in-person' | 'online' | 'hybrid';
}

interface EventSearchFilterProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
}

const categories = [
  { value: "all", label: "All Categories" },
  { value: "technology", label: "Technology" },
  { value: "business", label: "Business" },
  { value: "arts", label: "Arts" },
  { value: "music", label: "Music" },
  { value: "sports", label: "Sports" },
  { value: "education", label: "Education" },
  { value: "health", label: "Health" },
  { value: "food", label: "Food" },
  { value: "community", label: "Community" },
  { value: "charity", label: "Charity" },
];

const dateRanges = [
  { value: "anytime", label: "Anytime" },
  { value: "today", label: "Today" },
  { value: "tomorrow", label: "Tomorrow" },
  { value: "this-week", label: "This Week" },
  { value: "this-weekend", label: "This Weekend" },
  { value: "next-week", label: "Next Week" },
  { value: "next-month", label: "Next Month" },
];

const priceRanges = [
  { value: "any", label: "Any Price" },
  { value: "free", label: "Free" },
  { value: "under-25", label: "Under $25" },
  { value: "25-50", label: "$25 - $50" },
  { value: "50-100", label: "$50 - $100" },
  { value: "100-plus", label: "$100+" },
];

const eventTypes = [
  { value: "all", label: "All Types" },
  { value: "in-person", label: "In-Person" },
  { value: "online", label: "Online" },
  { value: "hybrid", label: "Hybrid" },
];

export const EventSearchFilter = ({ filters, onFiltersChange }: EventSearchFilterProps) => {
  const [searchTerm, setSearchTerm] = useState(filters.search || "");

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== filters.search) {
        onFiltersChange({ ...filters, search: searchTerm || undefined });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, filters, onFiltersChange]);

  const handleFilterChange = <K extends keyof SearchFilters>(
    key: K,
    value: SearchFilters[K]
  ) => {
    const newFilters: SearchFilters = { ...filters };

    // Treat these as "reset" sentinel values for select inputs
    if (value === 'all' || value === 'any' || value === 'anytime' || value === '') {
      delete newFilters[key];
    } else {
      newFilters[key] = value;
    }

    onFiltersChange(newFilters);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    onFiltersChange({});
  };

  const hasActiveFilters = 
    filters.search || 
    filters.location || 
    (filters.category && filters.category !== 'all') ||
    (filters.dateRange && filters.dateRange !== 'anytime') ||
    (filters.priceRange && filters.priceRange !== 'any') ||
    (filters.eventType && filters.eventType !== 'all');

  return (
    <section className="py-8 bg-muted/30 border-y border-border">
      <div className="container mx-auto px-4 sm:px-6">
        <Card className="p-6 shadow-lg">
          <div className="space-y-6">
            {/* Title */}
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Find Your Next Event
              </h2>
              <p className="text-sm text-muted-foreground">
                Search and filter events to find exactly what you're looking for
              </p>
            </div>

            {/* Search Bar - Full Width */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                type="text"
                placeholder="Search events by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 text-base"
              />
            </div>

            {/* Filter Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Category */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <span className="text-primary">📂</span> Category
                </label>
                <Select 
                  value={filters.category || "all"} 
                  onValueChange={(value) => handleFilterChange('category', value as SearchFilters['category'])}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" /> Date
                </label>
                <Select 
                  value={filters.dateRange || "anytime"} 
                  onValueChange={(value) => handleFilterChange('dateRange', value as SearchFilters['dateRange'])}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Anytime" />
                  </SelectTrigger>
                  <SelectContent>
                    {dateRanges.map((range) => (
                      <SelectItem key={range.value} value={range.value}>
                        {range.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Price Range */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-primary" /> Price
                </label>
                <Select 
                  value={filters.priceRange || "any"} 
                  onValueChange={(value) => handleFilterChange('priceRange', value as SearchFilters['priceRange'])}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Any Price" />
                  </SelectTrigger>
                  <SelectContent>
                    {priceRanges.map((range) => (
                      <SelectItem key={range.value} value={range.value}>
                        {range.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Event Type */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-primary" /> Format
                </label>
                <Select 
                  value={filters.eventType || "all"} 
                  onValueChange={(value) => handleFilterChange('eventType', value as SearchFilters['eventType'])}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    {eventTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Location - Secondary Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" /> Location
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="City or venue..."
                    value={filters.location || ""}
                    onChange={(e) => handleFilterChange('location', e.target.value)}
                    className="pl-10 h-11"
                  />
                </div>
              </div>

              {/* Clear Filters Button */}
              {hasActiveFilters && (
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={handleClearFilters}
                    className="w-full h-11 gap-2"
                  >
                    <X className="w-4 h-4" />
                    Clear All Filters
                  </Button>
                </div>
              )}
            </div>

            {/* Active Filters Count */}
            {hasActiveFilters && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  {Object.keys(filters).filter(k => filters[k as keyof SearchFilters]).length} filter(s) active
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </section>
  );
};
