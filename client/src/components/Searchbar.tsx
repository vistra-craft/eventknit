import { MapPin, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const SearchBar = () => {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex items-center bg-card-surface rounded-lg shadow-card overflow-hidden border border-card-border">
        {/* Search Input */}
        <div className="flex-1 px-4 py-3">
          <Input
            type="text"
            placeholder="Find artist, genre, event, or venue"
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
            defaultValue="Nairobi"
            className="border-0 bg-transparent text-base placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 h-auto p-0 w-24 text-foreground"
          />
        </div>
        
        {/* Search Button */}
        <Button 
          className="bg-eventknit hover:bg-eventknit/90 text-eventknit-foreground px-6 py-3 h-auto rounded-none rounded-r-lg font-medium"
        >
          Search
          <Search className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default SearchBar;