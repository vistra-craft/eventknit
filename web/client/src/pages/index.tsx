import { useState } from "react";
import { EventSearchFilter } from "../components/EventSearchFilter";
import type { SearchFilters } from "../components/EventSearchFilter";
import { EventGrid } from "../components/EventGrid";
import { Hero } from "../components/Hero";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

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