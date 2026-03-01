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

// Avatar sizes by tier — compact, proportional
const TIER_AVATAR_SIZE: Record<string, string> = {
  title: "h-14 w-14",
  presenting: "h-12 w-12",
  diamond: "h-12 w-12",
  platinum: "h-11 w-11",
  gold: "h-10 w-10",
  silver: "h-9 w-9",
  bronze: "h-9 w-9",
  partner: "h-9 w-9",
  media: "h-9 w-9",
  technology: "h-9 w-9",
  community: "h-9 w-9",
  associate: "h-9 w-9",
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
    <div className="space-y-6">
      {tiers.map((tier) => {
        const items = grouped.get(tier)!;
        const avatarSize = TIER_AVATAR_SIZE[tier] || "h-9 w-9";
        const label = TIER_LABELS[tier] || `${tier.charAt(0).toUpperCase()}${tier.slice(1)} Sponsors`;

        return (
          <div key={tier}>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">
              {label}
            </p>
            <div className="flex flex-wrap items-center gap-5">
              {items.map((sponsor, i) => (
                <SponsorItem key={sponsor.id || i} sponsor={sponsor} avatarSize={avatarSize} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SponsorItem({ sponsor, avatarSize }: { sponsor: Sponsor; avatarSize: string }) {
  const content = (
    <div className="flex flex-col items-center gap-1.5 group w-[90px]">
      {sponsor.logo ? (
        <div className={`${avatarSize} rounded-full bg-muted overflow-hidden flex items-center justify-center p-1 transition-all duration-200 group-hover:shadow-sm`}>
          <img
            src={sponsor.logo}
            alt={sponsor.name}
            className="w-full h-full object-contain"
          />
        </div>
      ) : (
        <div className={`${avatarSize} rounded-full bg-primary/10 flex items-center justify-center transition-all duration-200 group-hover:shadow-sm`}>
          <span className="text-xs font-bold text-primary">
            {sponsor.name.charAt(0).toUpperCase()}
          </span>
        </div>
      )}
      <span className="text-[10px] text-muted-foreground font-medium group-hover:text-foreground transition-colors text-center line-clamp-1 w-full">
        {sponsor.name}
      </span>
    </div>
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
