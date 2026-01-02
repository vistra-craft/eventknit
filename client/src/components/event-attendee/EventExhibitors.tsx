import React, { useState, useMemo } from "react";
import { Building2, MapPin, Globe, Mail, X, Phone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { Exhibitor, Sponsor } from "./EventAttendeeView";

interface EventExhibitorsProps {
  exhibitors: Exhibitor[];
  sponsors?: Sponsor[];
}

// Extended exhibitor type for modal
interface ExtendedExhibitor extends Exhibitor {
  phone?: string;
  products?: string[];
  representatives?: {
    name: string;
    position: string;
    avatar?: string;
  }[];
}

// Sponsor tier colors
const sponsorTierColors: Record<string, string> = {
  title: 'bg-gradient-to-r from-amber-500 to-amber-600 text-white',
  presenting: 'bg-gradient-to-r from-purple-500 to-purple-600 text-white',
  platinum: 'bg-gradient-to-r from-slate-400 to-slate-500 text-white',
  gold: 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white',
  silver: 'bg-gradient-to-r from-gray-400 to-gray-500 text-white',
  bronze: 'bg-gradient-to-r from-orange-600 to-orange-700 text-white',
  associate: 'bg-blue-100 text-blue-800',
  community: 'bg-green-100 text-green-800',
};

// Exhibitor Card
const ExhibitorCard: React.FC<{
  exhibitor: Exhibitor;
  onClick: () => void;
}> = ({ exhibitor, onClick }) => {
  return (
    <Card
      className="group cursor-pointer border-0 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1"
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {/* Logo */}
          <div className="w-14 h-14 bg-muted rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
            {exhibitor.logo ? (
              <img
                src={exhibitor.logo}
                alt={exhibitor.name}
                className="w-full h-full object-contain p-1"
              />
            ) : (
              <Building2 className="w-7 h-7 text-muted-foreground" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
              {exhibitor.name}
            </h3>

            {exhibitor.category && (
              <Badge variant="secondary" className="mt-1 text-xs">
                {exhibitor.category}
              </Badge>
            )}

            {exhibitor.description && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                {exhibitor.description}
              </p>
            )}

            {exhibitor.booth && (
              <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3" />
                <span>Booth {exhibitor.booth}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Exhibitor Modal
const ExhibitorModal: React.FC<{
  exhibitor: ExtendedExhibitor;
  onClose: () => void;
}> = ({ exhibitor, onClose }) => {
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-muted rounded-xl flex items-center justify-center overflow-hidden">
                {exhibitor.logo ? (
                  <img
                    src={exhibitor.logo}
                    alt={exhibitor.name}
                    className="w-full h-full object-contain p-2"
                  />
                ) : (
                  <Building2 className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">{exhibitor.name}</h2>
                {exhibitor.category && (
                  <Badge variant="secondary" className="mt-1">
                    {exhibitor.category}
                  </Badge>
                )}
                {exhibitor.booth && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Booth {exhibitor.booth}
                  </p>
                )}
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Divider */}
          <div className="border-t border-border mb-6" />

          {/* Description */}
          {exhibitor.description && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-foreground mb-2 uppercase tracking-wide">About</h3>
              <p className="text-muted-foreground leading-relaxed">
                {exhibitor.description}
              </p>
            </div>
          )}

          {/* Products/Services */}
          {exhibitor.products && exhibitor.products.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">Products & Services</h3>
              <div className="flex flex-wrap gap-2">
                {exhibitor.products.map((product, idx) => (
                  <Badge key={idx} variant="outline">
                    {product}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Contact */}
          {(exhibitor.website || exhibitor.contactEmail || exhibitor.phone) && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">Contact</h3>
              <div className="flex flex-wrap gap-2">
                {exhibitor.website && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={exhibitor.website} target="_blank" rel="noopener noreferrer">
                      <Globe className="w-4 h-4 mr-2" />
                      Website
                    </a>
                  </Button>
                )}
                {exhibitor.contactEmail && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={`mailto:${exhibitor.contactEmail}`}>
                      <Mail className="w-4 h-4 mr-2" />
                      Email
                    </a>
                  </Button>
                )}
                {exhibitor.phone && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={`tel:${exhibitor.phone}`}>
                      <Phone className="w-4 h-4 mr-2" />
                      Call
                    </a>
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Representatives */}
          {exhibitor.representatives && exhibitor.representatives.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">Team</h3>
              <div className="grid grid-cols-2 gap-3">
                {exhibitor.representatives.map((rep, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                      {rep.avatar ? (
                        <img src={rep.avatar} alt={rep.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span className="text-sm font-medium text-muted-foreground">
                          {rep.name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">{rep.name}</p>
                      <p className="text-xs text-muted-foreground">{rep.position}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Sponsor Section
const SponsorSection: React.FC<{ sponsors: Sponsor[] }> = ({ sponsors }) => {
  const sponsorsByTier = useMemo(() => {
    const grouped: Record<string, Sponsor[]> = {};
    sponsors.forEach(sponsor => {
      const tier = sponsor.level || 'associate';
      if (!grouped[tier]) grouped[tier] = [];
      grouped[tier].push(sponsor);
    });
    return grouped;
  }, [sponsors]);

  const tierOrder: Sponsor['level'][] = [
    'title', 'presenting', 'platinum', 'gold', 'silver', 'bronze', 'associate', 'community'
  ];

  const tierLabels: Record<string, string> = {
    title: 'Title Sponsors',
    presenting: 'Presenting Sponsors',
    platinum: 'Platinum Sponsors',
    gold: 'Gold Sponsors',
    silver: 'Silver Sponsors',
    bronze: 'Bronze Sponsors',
    associate: 'Associate Sponsors',
    community: 'Community Partners',
  };

  return (
    <div className="mb-12">
      <h2 className="text-xl font-bold text-foreground mb-6">Sponsors</h2>
      <div className="space-y-8">
        {tierOrder.map(tier => {
          const tierSponsors = sponsorsByTier[tier];
          if (!tierSponsors || tierSponsors.length === 0) return null;

          return (
            <div key={tier}>
              <Badge className={`${sponsorTierColors[tier]} mb-4`}>
                {tierLabels[tier]}
              </Badge>
              <div className="flex flex-wrap items-center gap-6">
                {tierSponsors.map((sponsor, idx) => (
                  <a
                    key={sponsor.id || idx}
                    href={sponsor.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block hover:opacity-80 transition-opacity"
                  >
                    {sponsor.logo ? (
                      <img
                        src={sponsor.logo}
                        alt={sponsor.name}
                        className="h-12 w-auto object-contain"
                      />
                    ) : (
                      <div className="h-12 px-4 bg-muted rounded flex items-center justify-center">
                        <span className="font-medium text-muted-foreground">
                          {sponsor.name}
                        </span>
                      </div>
                    )}
                  </a>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const EventExhibitors: React.FC<EventExhibitorsProps> = ({ exhibitors, sponsors }) => {
  const [selectedExhibitor, setSelectedExhibitor] = useState<ExtendedExhibitor | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredExhibitors = useMemo(() => {
    if (!searchTerm) return exhibitors;
    const term = searchTerm.toLowerCase();
    return exhibitors.filter(e =>
      e.name.toLowerCase().includes(term) ||
      e.category?.toLowerCase().includes(term) ||
      e.description?.toLowerCase().includes(term)
    );
  }, [exhibitors, searchTerm]);

  const hasExhibitors = exhibitors && exhibitors.length > 0;
  const hasSponsors = sponsors && sponsors.length > 0;

  if (!hasExhibitors && !hasSponsors) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-12">
        <div className="text-center max-w-md mx-auto">
          <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Coming Soon</h2>
          <p className="text-muted-foreground">
            Exhibitor and sponsor information will be available soon.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8">
      {/* Sponsors Section */}
      {hasSponsors && <SponsorSection sponsors={sponsors} />}

      {/* Exhibitors Section */}
      {hasExhibitors && (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-foreground">Exhibitors</h2>
              <p className="text-sm text-muted-foreground">
                {filteredExhibitors.length} {filteredExhibitors.length === 1 ? 'exhibitor' : 'exhibitors'}
              </p>
            </div>
            <Input
              placeholder="Search exhibitors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredExhibitors.map((exhibitor, index) => (
              <ExhibitorCard
                key={exhibitor.id || index}
                exhibitor={exhibitor}
                onClick={() => setSelectedExhibitor(exhibitor as ExtendedExhibitor)}
              />
            ))}
          </div>

          {filteredExhibitors.length === 0 && searchTerm && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No exhibitors found matching "{searchTerm}"</p>
            </div>
          )}
        </>
      )}

      {/* Exhibitor Modal */}
      {selectedExhibitor && (
        <ExhibitorModal
          exhibitor={selectedExhibitor}
          onClose={() => setSelectedExhibitor(null)}
        />
      )}
    </div>
  );
};

export default EventExhibitors;
