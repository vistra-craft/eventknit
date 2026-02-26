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

// Logo display height scales with tier prominence
const TIER_LOGO_HEIGHT: Record<string, string> = {
  title: "h-20",
  presenting: "h-16",
  diamond: "h-16",
  platinum: "h-14",
  gold: "h-12",
  silver: "h-10",
  bronze: "h-8",
  partner: "h-8",
  media: "h-8",
  technology: "h-8",
  community: "h-8",
  associate: "h-8",
};

export function SponsorsShowcase({ sponsors }: SponsorsShowcaseProps) {
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
    <div className="space-y-10">
      {tiers.map((tier) => {
        const items = grouped.get(tier)!;
        const heightClass = TIER_LOGO_HEIGHT[tier] || "h-8";
        const label = TIER_LABELS[tier] || `${tier.charAt(0).toUpperCase()}${tier.slice(1)} Sponsors`;

        return (
          <div key={tier}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest text-center mb-5">
              {label}
            </p>
            <div className="flex flex-wrap justify-center items-center gap-10">
              {items.map((sponsor, i) => (
                <SponsorItem key={sponsor.id || i} sponsor={sponsor} heightClass={heightClass} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SponsorItem({ sponsor, heightClass }: { sponsor: Sponsor; heightClass: string }) {
  const content = sponsor.logo ? (
    <img
      src={sponsor.logo}
      alt={sponsor.name}
      className={`${heightClass} w-auto object-contain grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300`}
    />
  ) : (
    <span className="inline-flex items-center px-5 py-2.5 rounded-full border border-border/40 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-border transition-colors">
      {sponsor.name}
    </span>
  );

  if (sponsor.website) {
    return (
      <a
        href={sponsor.website.startsWith("http") ? sponsor.website : `https://${sponsor.website}`}
        target="_blank"
        rel="noopener noreferrer"
        title={sponsor.name}
      >
        {content}
      </a>
    );
  }

  return <div title={sponsor.name}>{content}</div>;
}
