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

const TIER_ORDER = ["platinum", "gold", "silver", "bronze", "partners"];

const TIER_LOGO_HEIGHT: Record<string, string> = {
  platinum: "h-20",
  gold: "h-14",
  silver: "h-10",
  bronze: "h-10",
  partners: "h-10",
};

export function SponsorsShowcase({ sponsors }: SponsorsShowcaseProps) {
  // Group by level
  const grouped = new Map<string, Sponsor[]>();
  sponsors.forEach((s) => {
    const level = (s.level || "partners").toLowerCase();
    if (!grouped.has(level)) grouped.set(level, []);
    grouped.get(level)!.push(s);
  });

  // Sort tiers by predefined order
  const tiers = Array.from(grouped.keys()).sort((a, b) => {
    const ai = TIER_ORDER.indexOf(a);
    const bi = TIER_ORDER.indexOf(b);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  return (
    <div className="space-y-8">
      {tiers.map((tier) => {
        const items = grouped.get(tier)!;
        const heightClass = TIER_LOGO_HEIGHT[tier] || "h-10";

        return (
          <div key={tier}>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider text-center mb-4">
              {tier === "partners" ? "Partners" : `${tier.charAt(0).toUpperCase() + tier.slice(1)} Sponsors`}
            </p>
            <div className="flex flex-wrap justify-center items-center gap-8">
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
    <span className="inline-flex items-center px-4 py-2 rounded-full border border-border/40 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-border transition-colors">
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
