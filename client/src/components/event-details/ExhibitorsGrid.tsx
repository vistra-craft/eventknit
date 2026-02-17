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

const INITIAL_COUNT = 6;

export function ExhibitorsGrid({ exhibitors }: ExhibitorsGridProps) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? exhibitors : exhibitors.slice(0, INITIAL_COUNT);
  const hasMore = exhibitors.length > INITIAL_COUNT;

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visible.map((exhibitor, i) => (
          <ExhibitorCard key={exhibitor.id || i} exhibitor={exhibitor} />
        ))}
      </div>
      {hasMore && !showAll && (
        <div className="flex justify-center mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAll(true)}
            className="border-border/40"
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
    <div className="rounded-xl border border-border/40 bg-card p-4 transition-all duration-200 hover:shadow-md">
      <div className="flex items-start gap-3">
        {exhibitor.logo ? (
          <img
            src={exhibitor.logo}
            alt={exhibitor.name}
            className="h-10 w-10 rounded-lg object-contain flex-shrink-0"
          />
        ) : (
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-primary">
              {exhibitor.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-foreground line-clamp-1">{exhibitor.name}</h4>
          {exhibitor.booth && (
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Booth {exhibitor.booth}</span>
            </div>
          )}
        </div>
      </div>

      {exhibitor.description && (
        <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
          {exhibitor.description}
        </p>
      )}

      {exhibitor.website && (
        <a
          href={exhibitor.website.startsWith("http") ? exhibitor.website : `https://${exhibitor.website}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
        >
          <ExternalLink className="h-3 w-3" />
          Visit website
        </a>
      )}
    </div>
  );
}
