import { useState } from "react";
import { CategoryFilter } from "../components/CategoryFilter";
import { EventGrid } from "../components/EventGrid";
import { Hero } from "../components/Hero";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const Index = () => {
  const [searchFilters, setSearchFilters] = useState<{ search?: string; location?: string }>({});

  const handleSearch = (searchTerm: string, location: string) => {
    setSearchFilters({
      search: searchTerm || undefined,
      location: location || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar onSearch={handleSearch} />
      <Hero />
      <CategoryFilter />
      <EventGrid searchFilters={searchFilters} />
      <Footer />
    </div>
  );
};

export default Index;