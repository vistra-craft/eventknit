import { useState } from "react";
import { ExternalLink, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Exhibitor {
  id?: string;
  name: string;
  description?: string;
  logo?: string;
  contactEmail?: string;
  booth?: string;
  website?: string;
  category?: string;
}

interface ExhibitorsGridProps {
  exhibitors: Exhibitor[];
}

const INITIAL_COUNT = 12;

export function ExhibitorsGrid({ exhibitors }: ExhibitorsGridProps) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? exhibitors : exhibitors.slice(0, INITIAL_COUNT);
  const hasMore = exhibitors.length > INITIAL_COUNT;

  return (
    <div>
      <div className="flex flex-wrap gap-5">
        {visible.map((exhibitor, i) => (
          <ExhibitorCard key={exhibitor.id || i} exhibitor={exhibitor} />
        ))}
      </div>
      {hasMore && !showAll && (
        <div className="flex justify-center mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAll(true)}
            className="border-border/40 text-xs"
          >
            View all {exhibitors.length} exhibitors
          </Button>
        </div>
      )}
    </div>
  );
}

function ExhibitorCard({ exhibitor }: { exhibitor: Exhibitor }) {
  return (
    <div className="flex flex-col items-center text-center w-[100px] group">
      {exhibitor.logo ? (
        <div className="h-12 w-12 rounded-full bg-muted overflow-hidden flex items-center justify-center flex-shrink-0 p-1">
          <img
            src={exhibitor.logo}
            alt={exhibitor.name}
            className="w-full h-full object-contain"
          />
        </div>
      ) : (
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-bold text-primary">
            {exhibitor.name.charAt(0).toUpperCase()}
          </span>
        </div>
      )}

      <h4 className="text-xs font-semibold text-foreground line-clamp-1 mt-1.5 w-full">{exhibitor.name}</h4>
      {exhibitor.booth && (
        <div className="flex items-center gap-0.5 mt-0.5">
          <MapPin className="h-2.5 w-2.5 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground">Booth {exhibitor.booth}</span>
        </div>
      )}

      {exhibitor.website && (
        <a
          href={exhibitor.website.startsWith("http") ? exhibitor.website : `https://${exhibitor.website}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-0.5 text-[10px] text-primary hover:underline mt-1"
        >
          <ExternalLink className="h-2.5 w-2.5" />
          Website
        </a>
      )}
    </div>
  );
}
