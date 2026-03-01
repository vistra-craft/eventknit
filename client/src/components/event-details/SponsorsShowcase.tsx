import { useState } from "react";
import { ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Sponsor {
  id?: string;
  name: string;
  level?: string;
  logo?: string;
  website?: string;
  description?: string;
}

interface SponsorsShowcaseProps {
  sponsors: Sponsor[];
}

// Full tier ordering (highest to lowest prominence)
const TIER_ORDER = [
  "title",
  "presenting",
  "diamond",
  "platinum",
  "gold",
  "silver",
  "bronze",
  "partner",
  "media",
  "technology",
  "community",
  "associate",
];

const TIER_LABELS: Record<string, string> = {
  title: "Title Sponsor",
  presenting: "Presenting Sponsor",
  diamond: "Diamond Sponsors",
  platinum: "Platinum Sponsors",
  gold: "Gold Sponsors",
  silver: "Silver Sponsors",
  bronze: "Bronze Sponsors",
  partner: "Partners",
  media: "Media Partners",
  technology: "Technology Partners",
  community: "Community Partners",
  associate: "Associate Sponsors",
};

const TIER_COLORS: Record<string, string> = {
  title: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  presenting: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  diamond: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300",
  platinum: "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300",
  gold: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  silver: "bg-gray-100 text-gray-700 dark:bg-gray-800/30 dark:text-gray-300",
  bronze: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
};

export function SponsorsShowcase({ sponsors }: SponsorsShowcaseProps) {
  const [selectedSponsor, setSelectedSponsor] = useState<{ sponsor: Sponsor; tier: string } | null>(null);

  // Group by level
  const grouped = new Map<string, Sponsor[]>();
  sponsors.forEach((s) => {
    const level = (s.level || "associate").toLowerCase();
    if (!grouped.has(level)) grouped.set(level, []);
    grouped.get(level)!.push(s);
  });

  // Sort tiers by predefined order; unknown tiers fall to end
  const tiers = Array.from(grouped.keys()).sort((a, b) => {
    const ai = TIER_ORDER.indexOf(a);
    const bi = TIER_ORDER.indexOf(b);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  return (
    <>
      <div className="space-y-6">
        {tiers.map((tier) => {
          const items = grouped.get(tier)!;
          const label = TIER_LABELS[tier] || `${tier.charAt(0).toUpperCase()}${tier.slice(1)} Sponsors`;

          return (
            <div key={tier}>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                {label}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {items.map((sponsor, i) => (
                  <SponsorCard
                    key={sponsor.id || i}
                    sponsor={sponsor}
                    tier={tier}
                    onSeeMore={() => setSelectedSponsor({ sponsor, tier })}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <SponsorDialog
        sponsor={selectedSponsor?.sponsor ?? null}
        tier={selectedSponsor?.tier ?? ""}
        open={!!selectedSponsor}
        onOpenChange={(open) => !open && setSelectedSponsor(null)}
      />
    </>
  );
}

function SponsorCard({ sponsor, tier, onSeeMore }: { sponsor: Sponsor; tier: string; onSeeMore: () => void }) {
  const tierColor = TIER_COLORS[tier] || "bg-muted text-muted-foreground";
  const tierLabel = TIER_LABELS[tier]?.replace(/ Sponsors?$| Partners?$/, "") || tier;
  const hasLongDescription = sponsor.description && sponsor.description.length > 100;

  return (
    <div className="flex gap-4 p-4 rounded-xl border border-border/40 bg-card hover:shadow-sm transition-shadow">
      {sponsor.logo ? (
        <div className="h-12 w-12 rounded-full bg-muted overflow-hidden flex items-center justify-center p-1 flex-shrink-0">
          <img
            src={sponsor.logo}
            alt={sponsor.name}
            className="w-full h-full object-contain"
          />
        </div>
      ) : (
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-bold text-primary">
            {sponsor.name.charAt(0).toUpperCase()}
          </span>
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold text-foreground truncate">{sponsor.name}</h4>
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${tierColor}`}>
            {tierLabel}
          </span>
        </div>
        {sponsor.description && (
          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed line-clamp-2">
            {sponsor.description}
          </p>
        )}
        {sponsor.website && (
          <div className="mt-2">
            <a
              href={sponsor.website.startsWith("http") ? sponsor.website : `https://${sponsor.website}`}
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

function SponsorDialog({
  sponsor,
  tier,
  open,
  onOpenChange,
}: {
  sponsor: Sponsor | null;
  tier: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!sponsor) return null;
  const tierColor = TIER_COLORS[tier] || "bg-muted text-muted-foreground";
  const tierLabel = TIER_LABELS[tier]?.replace(/ Sponsors?$| Partners?$/, "") || tier;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{sponsor.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex justify-center">
            {sponsor.logo ? (
              <div className="h-16 w-16 rounded-full bg-muted overflow-hidden flex items-center justify-center p-1">
                <img
                  src={sponsor.logo}
                  alt={sponsor.name}
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-lg font-bold text-primary">
                  {sponsor.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <div className="flex justify-center">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${tierColor}`}>
              {tierLabel} Sponsor
            </span>
          </div>
          {sponsor.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">{sponsor.description}</p>
          )}
          {sponsor.website && (
            <div className="flex justify-center">
              <a
                href={sponsor.website.startsWith("http") ? sponsor.website : `https://${sponsor.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Visit Website
              </a>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
