import { Music, Mic, Trophy, Palette, Theater, Calendar, Users, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const categories = [
  { id: "all", name: "All Events", icon: Calendar, color: "primary" },
  { id: "music", name: "Music", icon: Music, color: "accent-electric" },
  { id: "comedy", name: "Comedy", icon: Mic, color: "accent-coral" },
  { id: "sports", name: "Sports", icon: Trophy, color: "accent-neon" },
  { id: "arts", name: "Arts", icon: Palette, color: "primary" },
  { id: "theater", name: "Theater", icon: Theater, color: "accent-electric" },
  { id: "community", name: "Community", icon: Users, color: "accent-coral" },
  { id: "featured", name: "Featured", icon: Sparkles, color: "accent-neon" },
];

interface CategoryFilterProps {
  selectedCategory?: string;
  onCategoryChange?: (categoryId: string) => void;
}

export const CategoryFilter = ({ selectedCategory = "all", onCategoryChange }: CategoryFilterProps) => {
  const handleCategoryClick = (categoryId: string) => {
    if (onCategoryChange) {
      onCategoryChange(categoryId);
    }
  };

  return (
    <section className="py-12 bg-surface/50 border-b border-card-border">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl font-bold text-center mb-8 text-foreground">
          Explore by Category
        </h2>
        <div className="flex flex-wrap justify-center gap-4">
          {categories.map((category) => {
            const IconComponent = category.icon;
            const isSelected = selectedCategory === category.id;
            return (
              <Button
                key={category.id}
                variant="category"
                size="lg"
                onClick={() => handleCategoryClick(category.id)}
                className={`flex items-center gap-3 px-6 py-3 group transition-all ${
                  isSelected 
                    ? 'bg-primary text-primary-foreground shadow-md scale-105' 
                    : 'hover:scale-105'
                }`}
              >
                <IconComponent className="w-5 h-5 group-hover:scale-105 transition-transform duration-200" />
                <span>{category.name}</span>
              </Button>
            );
          })}
        </div>
      </div>
    </section>
  );
};