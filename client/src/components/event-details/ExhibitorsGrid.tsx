import { useState } from "react";
import { ExternalLink, MapPin } from "lucide-react";
import { stripHtml } from "@/lib/utils";
import { RichTextContent } from "@/components/ui/RichTextContent";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const [selectedExhibitor, setSelectedExhibitor] = useState<Exhibitor | null>(null);
  const visible = showAll ? exhibitors : exhibitors.slice(0, INITIAL_COUNT);
  const hasMore = exhibitors.length > INITIAL_COUNT;

  return (
    <>
      <div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {visible.map((exhibitor, i) => (
            <ExhibitorCard
              key={exhibitor.id || i}
              exhibitor={exhibitor}
              onSeeMore={() => setSelectedExhibitor(exhibitor)}
            />
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
      <ExhibitorDialog
        exhibitor={selectedExhibitor}
        open={!!selectedExhibitor}
        onOpenChange={(open) => !open && setSelectedExhibitor(null)}
      />
    </>
  );
}

function ExhibitorCard({ exhibitor, onSeeMore }: { exhibitor: Exhibitor; onSeeMore: () => void }) {
  const hasLongDescription = exhibitor.description && exhibitor.description.length > 100;

  return (
    <div className="flex gap-4 p-4 rounded-xl border border-border/40 bg-card hover:shadow-sm transition-shadow">
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
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold text-foreground truncate">{exhibitor.name}</h4>
          {exhibitor.category && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary flex-shrink-0">
              {exhibitor.category}
            </span>
          )}
        </div>
        {exhibitor.booth && (
          <div className="flex items-center gap-1 mt-0.5">
            <MapPin className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Booth {exhibitor.booth}</span>
          </div>
        )}
        {exhibitor.description && (
          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed line-clamp-2">
            {stripHtml(exhibitor.description || '')}
          </p>
        )}
        {exhibitor.website && (
          <div className="mt-2">
            <a
              href={exhibitor.website.startsWith("http") ? exhibitor.website : `https://${exhibitor.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              Website
            </a>
          </div>
        )}
        {hasLongDescription && (
          <div className="mt-1">
            <button
              onClick={onSeeMore}
              className="text-xs text-primary hover:underline font-medium"
            >
              See more
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ExhibitorDialog({
  exhibitor,
  open,
  onOpenChange,
}: {
  exhibitor: Exhibitor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!exhibitor) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{exhibitor.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex justify-center">
            {exhibitor.logo ? (
              <div className="h-16 w-16 rounded-full bg-muted overflow-hidden flex items-center justify-center p-1">
                <img
                  src={exhibitor.logo}
                  alt={exhibitor.name}
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-lg font-bold text-primary">
                  {exhibitor.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <div className="flex justify-center gap-2">
            {exhibitor.category && (
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                {exhibitor.category}
              </span>
            )}
            {exhibitor.booth && (
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                Booth {exhibitor.booth}
              </span>
            )}
          </div>
          {exhibitor.description && (
            <RichTextContent content={exhibitor.description || ''} className="text-sm text-muted-foreground leading-relaxed" />
          )}
          {exhibitor.website && (
            <div className="flex justify-center">
              <a
                href={exhibitor.website.startsWith("http") ? exhibitor.website : `https://${exhibitor.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Visit Website
              </a>
            </div>
          )}
          {exhibitor.contactEmail && (
            <div className="flex justify-center">
              <a
                href={`mailto:${exhibitor.contactEmail}`}
                className="text-sm text-primary hover:underline"
              >
                {exhibitor.contactEmail}
              </a>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
