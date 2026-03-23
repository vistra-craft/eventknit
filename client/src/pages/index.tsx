import { useState } from "react";
import { EventSearchFilter } from '@/components/events/EventSearchFilter';
import type { SearchFilters } from '@/components/events/EventSearchFilter';
import { EventGrid } from '@/components/events/EventGrid';
import { Hero } from '@/components/layout/Hero';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const Index = () => {
  const [filters, setFilters] = useState<SearchFilters>({});

  const handleFiltersChange = (newFilters: SearchFilters) => {
    setFilters(newFilters);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1 pt-16">
        <Hero />
        <EventSearchFilter filters={filters} onFiltersChange={handleFiltersChange} />
        <EventGrid filters={filters} />
      </main>
      <Footer />
    </div>
  );
};

export default Index;