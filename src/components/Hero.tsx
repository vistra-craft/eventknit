import { Search, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Hero = () => {
  return (
    <section className="relative bg-gradient-hero min-h-[80vh] flex items-center justify-center overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent-neon/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-accent-electric/20 rounded-full blur-2xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 container mx-auto px-6 text-center">
        {/* Hero Content */}
        <div className="max-w-4xl mx-auto">
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent leading-tight">
            Discover Epic
            <br />
            <span className="text-accent-electric">Events</span>
          </h1>
          <p className="text-xl md:text-2xl text-foreground/80 mb-12 max-w-2xl mx-auto leading-relaxed">
            Find and book tickets for the most amazing concerts, festivals, comedy shows, and sporting events near you
          </p>

          {/* Search Section */}
          <div className="bg-glass-bg backdrop-blur-xl border border-glass-border rounded-2xl p-8 shadow-elevated">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  placeholder="Search for events, artists, or venues..."
                  className="pl-12 h-14 bg-card-surface/50 border-card-border text-lg placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary"
                />
              </div>
              <div className="relative w-full md:w-64">
                <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  placeholder="Location"
                  className="pl-12 h-14 bg-card-surface/50 border-card-border text-lg placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary"
                />
              </div>
              <Button variant="hero" size="lg" className="h-14 px-8 w-full md:w-auto">
                Find Events
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 mt-16">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-glow">50K+</div>
              <div className="text-muted-foreground">Events</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-accent-electric">2M+</div>
              <div className="text-muted-foreground">Happy Customers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-accent-neon">500+</div>
              <div className="text-muted-foreground">Cities</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};