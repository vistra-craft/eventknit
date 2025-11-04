import OrganizerEventCard from "./OrganizerEventCard";
import { useState } from "react";
import { Calendar, Sparkles, TrendingUp } from "lucide-react";
import type { EventData } from "@/types/event";

export const OrganizerEventGrid = () => {
  const events: EventData[] = []; // Placeholder - will be replaced with API data
  const [selectedFilter, setSelectedFilter] = useState("today");

  const timeFilters = [
    { id: "today", label: "Today" },
    { id: "weekend", label: "This Weekend" },
    { id: "month", label: "Next 30 Days" }
  ];

  return (
    <section className="py-16 bg-background relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-primary/5 rounded-full transform -translate-x-16 -translate-y-16"></div>
      <div className="absolute top-20 right-0 w-24 h-24 bg-primary/5 rounded-full transform translate-x-12 -translate-y-12"></div>
      <div className="absolute bottom-0 left-1/4 w-20 h-20 bg-primary/5 rounded-full transform -translate-y-10"></div>
      
      <div className="container mx-auto px-6 relative">
        <div className="mb-12">
          {/* Centered title */}
          <div className="text-center mb-6">
            <h2 className="text-4xl font-bold text-foreground">
              Discover Events
            </h2>
          </div>
          
          {/* Bottom row with filters and info */}
          <div className="flex items-center justify-between">
            {/* Left side - Time Filter Selector */}
            <div className="bg-muted/50 rounded-full p-1 flex gap-1 shadow-sm border border-border/50">
              {timeFilters.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setSelectedFilter(filter.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    selectedFilter === filter.id
                      ? 'bg-primary text-primary-foreground shadow-sm scale-105'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/70 hover:scale-105'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            
            {/* Right side - Calendar icon, live events text, and trending badge */}
            <div className="flex items-center gap-6">
              {/* Calendar icon and live events text */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center group">
                  <Calendar className="w-5 h-5 text-primary group-hover:scale-110 transition-transform duration-300" />
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                  <span className="text-sm text-muted-foreground">Live events happening now</span>
                </div>
              </div>
              
              {/* Trending badge */}
              <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                <TrendingUp className="w-4 h-4" />
                <span>Trending</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {events.map((event) => (
            <OrganizerEventCard 
              key={event.id} 
              event={{
                id: event.id,
                title: event.title,
                image: event.image,
                date: event.date,
                time: event.time,
                venue: event.venue,
                location: event.location,
                organizer: event.organizer,
                price: event.price.toString(),
                category: event.category,
                description: event.description,
                fullDescription: event.fullDescription,
                duration: event.duration,
                ageRestriction: event.ageRestriction || '',
              }} 
            />
          ))}
        </div>

        <div className="text-center mt-12">
          <button className="px-8 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-all duration-200">
            Load More Events
          </button>
        </div>
      </div>
    </section>
  );
};
