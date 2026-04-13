import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { getCategoriesByGroup } from "@/lib/event-categories";
import { EASE } from "@/lib/animation-constants";

export interface SearchFilters {
  search?: string;
  location?: string;
  category?: string;
  tags?: string[];
  dateRange?: "anytime" | "today" | "tomorrow" | "this-week" | "this-weekend" | "next-week" | "next-month";
  priceRange?: "any" | "free" | "paid";
  eventType?: "all" | "in-person" | "online" | "hybrid";
}

interface EventSearchFilterProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
}

const categoryGroups = getCategoriesByGroup();

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
  { value: "paid", label: "Paid" },
];

const eventTypes = [
  { value: "all", label: "All Formats" },
  { value: "in-person", label: "In-Person" },
  { value: "online", label: "Online" },
  { value: "hybrid", label: "Hybrid" },
];

const filterLabels: Record<string, Record<string, string>> = {
  category: Object.fromEntries(
    [...categoryGroups.mice, ...categoryGroups.entertainment, ...categoryGroups.lifestyle, ...categoryGroups.general].map((c) => [c.value, c.label])
  ),
  dateRange: Object.fromEntries(dateRanges.map((d) => [d.value, d.label])),
  priceRange: Object.fromEntries(priceRanges.map((p) => [p.value, p.label])),
  eventType: Object.fromEntries(eventTypes.map((t) => [t.value, t.label])),
};

export const EventSearchFilter = ({ filters, onFiltersChange }: EventSearchFilterProps) => {
  const [searchTerm, setSearchTerm] = useState(filters.search || "");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== filters.search) {
        onFiltersChange({ ...filters, search: searchTerm || undefined });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, filters, onFiltersChange]);

  const handleFilterChange = <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => {
    const newFilters: SearchFilters = { ...filters };
    if (value === "all" || value === "any" || value === "anytime" || value === "") {
      delete newFilters[key];
    } else {
      newFilters[key] = value;
    }
    onFiltersChange(newFilters);
  };

  const removeFilter = (key: keyof SearchFilters) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    if (key === "search") setSearchTerm("");
    onFiltersChange(newFilters);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    onFiltersChange({});
  };

  // Active filter tags
  const activeTags: { key: keyof SearchFilters; label: string }[] = [];
  if (filters.category && filters.category !== "all") {
    activeTags.push({ key: "category", label: filterLabels.category?.[filters.category] || filters.category });
  }
  if (filters.dateRange && filters.dateRange !== "anytime") {
    activeTags.push({ key: "dateRange", label: filterLabels.dateRange?.[filters.dateRange] || filters.dateRange });
  }
  if (filters.priceRange && filters.priceRange !== "any") {
    activeTags.push({ key: "priceRange", label: filterLabels.priceRange?.[filters.priceRange] || filters.priceRange });
  }
  if (filters.eventType && filters.eventType !== "all") {
    activeTags.push({ key: "eventType", label: filterLabels.eventType?.[filters.eventType] || filters.eventType });
  }
  if (filters.location) {
    activeTags.push({ key: "location", label: filters.location });
  }

  const activeCount = activeTags.length;

  return (
    <section id="search-section" className="relative z-20 -mt-6 pb-6 bg-transparent">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="bg-background/80 dark:bg-background/90 backdrop-blur-xl border border-border/50 dark:border-foreground/10 rounded-2xl shadow-lg dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)] p-4 sm:p-5">
          {/* Search row */}
          <div className="flex items-center gap-2">
            <div className="flex-1 relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 group-focus-within:text-primary transition-colors" />
              <Input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11 text-sm rounded-xl border-border bg-background focus-visible:shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.2)]"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowFilters((prev) => !prev)}
              className={`relative inline-flex items-center justify-center w-11 h-11 rounded-xl border transition-colors ${
                showFilters
                  ? "border-primary/30 bg-primary/5 text-primary"
                  : "border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              {activeCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-white text-[9px] font-bold flex items-center justify-center">
                  {activeCount}
                </span>
              )}
            </button>
          </div>

          {/* Active filter tags */}
          <AnimatePresence>
            {activeTags.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: EASE }}
                className="overflow-hidden"
              >
                <div className="flex flex-wrap items-center gap-1.5 pt-3">
                  {activeTags.map((tag) => (
                    <motion.button
                      key={tag.key}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.2 }}
                      onClick={() => removeFilter(tag.key)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted text-foreground text-[11px] font-medium hover:bg-muted/80 transition-colors"
                    >
                      {tag.label}
                      <X className="w-2.5 h-2.5 text-muted-foreground" />
                    </motion.button>
                  ))}
                  <button
                    onClick={handleClearFilters}
                    className="text-[11px] text-muted-foreground hover:text-foreground transition-colors pl-1"
                  >
                    Clear all
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Filter panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: EASE }}
                className="overflow-hidden"
              >
                <div className="pt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {/* Category */}
                  <Select
                    value={filters.category || "all"}
                    onValueChange={(value) => handleFilterChange("category", value as SearchFilters["category"])}
                  >
                    <SelectTrigger className="h-9 text-xs rounded-xl border-border">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectGroup>
                        <SelectLabel>Professional</SelectLabel>
                        {categoryGroups.mice.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                        ))}
                      </SelectGroup>
                      <SelectGroup>
                        <SelectLabel>Entertainment</SelectLabel>
                        {categoryGroups.entertainment.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                        ))}
                      </SelectGroup>
                      <SelectGroup>
                        <SelectLabel>Lifestyle</SelectLabel>
                        {categoryGroups.lifestyle.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                        ))}
                      </SelectGroup>
                      <SelectGroup>
                        <SelectLabel>General</SelectLabel>
                        {categoryGroups.general.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>

                  {/* Date Range */}
                  <Select
                    value={filters.dateRange || "anytime"}
                    onValueChange={(value) => handleFilterChange("dateRange", value as SearchFilters["dateRange"])}
                  >
                    <SelectTrigger className="h-9 text-xs rounded-xl border-border">
                      <SelectValue placeholder="When" />
                    </SelectTrigger>
                    <SelectContent>
                      {dateRanges.map((range) => (
                        <SelectItem key={range.value} value={range.value}>{range.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Price */}
                  <Select
                    value={filters.priceRange || "any"}
                    onValueChange={(value) => handleFilterChange("priceRange", value as SearchFilters["priceRange"])}
                  >
                    <SelectTrigger className="h-9 text-xs rounded-xl border-border">
                      <SelectValue placeholder="Price" />
                    </SelectTrigger>
                    <SelectContent>
                      {priceRanges.map((range) => (
                        <SelectItem key={range.value} value={range.value}>{range.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Event Type */}
                  <Select
                    value={filters.eventType || "all"}
                    onValueChange={(value) => handleFilterChange("eventType", value as SearchFilters["eventType"])}
                  >
                    <SelectTrigger className="h-9 text-xs rounded-xl border-border">
                      <SelectValue placeholder="Format" />
                    </SelectTrigger>
                    <SelectContent>
                      {eventTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Location */}
                  <Input
                    type="text"
                    placeholder="City or venue"
                    value={filters.location || ""}
                    onChange={(e) => handleFilterChange("location", e.target.value)}
                    className="h-9 text-xs rounded-xl border-border col-span-2 sm:col-span-1"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};
