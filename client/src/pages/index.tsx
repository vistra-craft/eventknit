import { CategoryFilter } from "../components/CategoryFilter";
import { EventGrid } from "../components/EventGrid";
import { Hero } from "../components/Hero";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <Hero />
      <CategoryFilter />
      <EventGrid />
      <Footer />
    </div>
  );
};

export default Index;