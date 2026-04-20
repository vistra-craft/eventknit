import { useState, useCallback } from "react";
import { EventSearchFilter } from "@/components/events/EventSearchFilter";
import type { SearchFilters } from "@/components/events/EventSearchFilter";
import { EventGrid } from "@/components/events/EventGrid";
import { PopularThisWeek } from "@/components/events/PopularThisWeek";
import { Hero } from "@/components/layout/Hero";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const Index = () => {
  const [filters, setFilters] = useState<SearchFilters>({});

  const handleFiltersChange = useCallback((newFilters: SearchFilters) => {
    setFilters(newFilters);
  }, []);

  const handleSeeAllPopular = useCallback(() => {
    setFilters((prev) => ({ ...prev, dateRange: 'this-week' }));
    document.getElementById('search-section')?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar transparent />
      <main className="flex-1">
        <Hero />
        <div id="search-section">
          <EventSearchFilter filters={filters} onFiltersChange={handleFiltersChange} />
        </div>
        <PopularThisWeek onSeeAll={handleSeeAllPopular} />
        <EventGrid filters={filters} />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
