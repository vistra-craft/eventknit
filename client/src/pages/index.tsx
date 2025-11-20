import { useState } from "react";
import { CategoryFilter } from "../components/CategoryFilter";
import { EventGrid } from "../components/EventGrid";
import { Hero } from "../components/Hero";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const Index = () => {
  const [searchFilters, setSearchFilters] = useState<{ search?: string; location?: string }>({});
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const handleSearch = (searchTerm: string, location: string) => {
    setSearchFilters({
      search: searchTerm || undefined,
      location: location || undefined,
    });
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar onSearch={handleSearch} />
      <Hero />
      <CategoryFilter selectedCategory={selectedCategory} onCategoryChange={handleCategoryChange} />
      <EventGrid searchFilters={searchFilters} categoryFilter={selectedCategory} />
      <Footer />
    </div>
  );
};

export default Index;