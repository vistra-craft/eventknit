import { useState } from "react";
import { EventSearchFilter } from "../components/EventSearchFilter";
import type { SearchFilters } from "../components/EventSearchFilter";
import { EventGrid } from "../components/EventGrid";
import { Hero } from "../components/Hero";
import PublicLayout from "../components/PublicLayout";

const Index = () => {
  const [filters, setFilters] = useState<SearchFilters>({});

  const handleFiltersChange = (newFilters: SearchFilters) => {
    setFilters(newFilters);
  };

  return (
    <PublicLayout className="text-foreground">
      <div className="pt-16">
        <Hero />
        <EventSearchFilter filters={filters} onFiltersChange={handleFiltersChange} />
        <EventGrid filters={filters} />
      </div>
    </PublicLayout>
  );
};

export default Index;