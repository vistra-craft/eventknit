import { Star } from "lucide-react";

export const EmptyFeaturedState = () => {
  return (
    <div className="container mx-auto px-6 py-6">
      {/* Empty state container */}
      <div className="relative rounded-2xl overflow-hidden h-[400px] lg:h-[450px] bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center border border-border/50">
        {/* Content */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-4 rounded-full bg-primary/10">
              <Star className="w-8 h-8 text-primary/60" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-foreground">
              No Featured Events Yet
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Check back soon for featured events and special highlights
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
