import { useState, useEffect } from "react";
import { Search, MapPin, X, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
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
  const [showFilters, setShowFilters] = useState(false);

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
    <section className="py-8 bg-background">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="mb-3">
          <p className="text-xl font-bold text-foreground">
            Discover events around you
          </p>
        </div>
        <Card className="border-0 bg-primary/5 shadow-none rounded-2xl px-4 py-4 md:px-6 md:py-5">
          <div className="flex flex-col gap-4">
            {/* Top row: search + filter icon */}
            <div className="w-full flex items-center gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search events…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-10 text-sm rounded-full border-border"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowFilters((prev) => !prev)}
                className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-border bg-white text-muted-foreground hover:bg-gray-900 hover:text-white transition-colors"
              >
                <Filter className="w-4 h-4" />
              </button>
            </div>

            {/* Compact filter row */}
            {showFilters && (
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-1">
                  {/* Category */}
                  <Select
                    value={filters.category || "all"}
                    onValueChange={(value) =>
                      handleFilterChange("category", value as SearchFilters["category"])
                    }
                  >
                    <SelectTrigger className="h-9 text-xs rounded-full border-border">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Date Range */}
                  <Select
                    value={filters.dateRange || "anytime"}
                    onValueChange={(value) =>
                      handleFilterChange("dateRange", value as SearchFilters["dateRange"])
                    }
                  >
                    <SelectTrigger className="h-9 text-xs rounded-full border-border">
                      <SelectValue placeholder="Date" />
                    </SelectTrigger>
                    <SelectContent>
                      {dateRanges.map((range) => (
                        <SelectItem key={range.value} value={range.value}>
                          {range.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Price Range */}
                  <Select
                    value={filters.priceRange || "any"}
                    onValueChange={(value) =>
                      handleFilterChange("priceRange", value as SearchFilters["priceRange"])
                    }
                  >
                    <SelectTrigger className="h-9 text-xs rounded-full border-border">
                      <SelectValue placeholder="Price" />
                    </SelectTrigger>
                    <SelectContent>
                      {priceRanges.map((range) => (
                        <SelectItem key={range.value} value={range.value}>
                          {range.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Event Type */}
                  <Select
                    value={filters.eventType || "all"}
                    onValueChange={(value) =>
                      handleFilterChange("eventType", value as SearchFilters["eventType"])
                    }
                  >
                    <SelectTrigger className="h-9 text-xs rounded-full border-border">
                      <SelectValue placeholder="Format" />
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

                {/* Location + Clear */}
                <div className="flex flex-col gap-2 md:w-80">
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      type="text"
                      placeholder="City or venue"
                      value={filters.location || ""}
                      onChange={(e) => handleFilterChange("location", e.target.value)}
                      className="pl-9 h-9 text-xs rounded-full border-border"
                    />
                  </div>

                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={handleClearFilters}
                      className="inline-flex items-center justify-start gap-1 text-[11px] text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-3 h-3" />
                      <span>Clear all filters</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </section>
  );
};
