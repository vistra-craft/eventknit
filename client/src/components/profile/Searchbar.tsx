import { useState, useEffect } from "react";
import { MapPin, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLocation, getCapitalCity } from "@/hooks/useLocation";

interface SearchBarProps {
  onSearch?: (searchTerm: string, location: string) => void;
  initialSearch?: string;
  initialLocation?: string;
}

const SearchBar = ({ onSearch, initialSearch = "", initialLocation }: SearchBarProps) => {
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [location, setLocation] = useState(initialLocation || "Nairobi");
  const { location: detectedLocation, isLoading: isDetectingLocation } = useLocation();

  // Update location when detected
  useEffect(() => {
    if (detectedLocation && !initialLocation) {
      // Use detected city, or fallback to capital city of the country
      const city = detectedLocation.city || getCapitalCity(detectedLocation.countryCode, "Nairobi");
      setLocation(city);
    }
  }, [detectedLocation, initialLocation]);

  const handleSearch = () => {
    if (onSearch) {
      onSearch(searchTerm, location);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex items-center bg-card-surface rounded-lg shadow-card overflow-hidden border border-card-border">
        {/* Search Input */}
        <div className="flex-1 px-4 py-3">
          <Input
            type="text"
            placeholder="Find artist, genre, event, or venue"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
            className="border-0 bg-transparent text-base placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 h-auto p-0 text-foreground"
          />
        </div>
        
        {/* Divider */}
        <div className="w-px h-8 bg-border" />
        
        {/* Location Input */}
        <div className="flex items-center px-4 py-3 min-w-0 flex-shrink-0">
          <MapPin className="w-4 h-4 text-muted-foreground mr-2 flex-shrink-0" />
          <Input
            type="text"
            placeholder="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isDetectingLocation}
            className="border-0 bg-transparent text-base placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 h-auto p-0 w-24 text-foreground disabled:opacity-50"
            title={isDetectingLocation ? "Detecting your location..." : "Location"}
          />
        </div>
        
        {/* Search Button */}
        <Button 
          onClick={handleSearch}
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 h-auto rounded-none rounded-r-lg font-medium"
        >
          Search
          <Search className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default SearchBar;