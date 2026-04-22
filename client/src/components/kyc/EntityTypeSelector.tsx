import React, { useState, useMemo } from 'react';
import { Building2, User, Users, Briefcase, School, Heart, Globe, Search } from 'lucide-react';
import { OrganizerEntityType } from '@/lib/organizer-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface EntityTypeSelectorProps {
  selectedType?: OrganizerEntityType | null;
  onSelect: (type: OrganizerEntityType) => void;
  onNext?: () => void;
  disabled?: boolean;
}

// Entity type groups for better organization
const ENTITY_GROUPS = {
  individual: {
    label: 'Individual',
    icon: User,
    types: [OrganizerEntityType.INDIVIDUAL],
  },
  business: {
    label: 'Business',
    icon: Building2,
    types: [
      OrganizerEntityType.SOLE_PROPRIETOR,
      OrganizerEntityType.PARTNERSHIP,
      OrganizerEntityType.LIMITED_LIABILITY_COMPANY,
      OrganizerEntityType.LIMITED_LIABILITY_PARTNERSHIP,
      OrganizerEntityType.EMPLOYMENT_AGENCY_LLC,
      OrganizerEntityType.FOREIGN_COMPANY_COMPLIANCE,
      OrganizerEntityType.PARTNERSHIP_PROFESSIONAL,
    ],
  },
  healthcare: {
    label: 'Healthcare',
    icon: Heart,
    types: [
      OrganizerEntityType.PRIVATE_HOSPITAL_SOLE_PROPRIETOR,
      OrganizerEntityType.PRIVATE_HOSPITAL_LLC,
      OrganizerEntityType.PUBLIC_HOSPITAL,
    ],
  },
  education: {
    label: 'Education',
    icon: School,
    types: [
      OrganizerEntityType.PRIVATE_EDUCATION_SOLE_PROPRIETOR,
      OrganizerEntityType.PRIVATE_EDUCATION_LLC,
      OrganizerEntityType.INTERNATIONAL_EDUCATION_LLC,
      OrganizerEntityType.PUBLIC_EDUCATION,
    ],
  },
  organization: {
    label: 'Organizations',
    icon: Users,
    types: [
      OrganizerEntityType.COOPERATIVE_SOCIETY,
      OrganizerEntityType.NGO,
      OrganizerEntityType.DENOMINATIONAL_CHURCH,
      OrganizerEntityType.TRUST,
    ],
  },
  government: {
    label: 'Government & International',
    icon: Globe,
    types: [
      OrganizerEntityType.EMBASSY_UN_WORLD_BANK,
    ],
  },
  special: {
    label: 'Specialized',
    icon: Briefcase,
    types: [
      OrganizerEntityType.INSURANCE_REINSURANCE,
    ],
  },
  other: {
    label: 'Other',
    icon: Briefcase,
    types: [
      OrganizerEntityType.OTHER,
    ],
  },
};

// Display names for entity types
const ENTITY_DISPLAY_NAMES: Record<OrganizerEntityType, string> = {
  [OrganizerEntityType.INDIVIDUAL]: 'Individual',
  [OrganizerEntityType.SOLE_PROPRIETOR]: 'Sole Proprietor',
  [OrganizerEntityType.PARTNERSHIP]: 'Partnership',
  [OrganizerEntityType.LIMITED_LIABILITY_COMPANY]: 'Limited Liability Company',
  [OrganizerEntityType.LIMITED_LIABILITY_PARTNERSHIP]: 'Limited Liability Partnership',
  [OrganizerEntityType.EMPLOYMENT_AGENCY_LLC]: 'Employment Agency (LLC)',
  [OrganizerEntityType.FOREIGN_COMPANY_COMPLIANCE]: 'Foreign Company (Certificate of Compliance)',
  [OrganizerEntityType.PRIVATE_HOSPITAL_SOLE_PROPRIETOR]: 'Private Hospital (Sole Proprietor)',
  [OrganizerEntityType.PRIVATE_HOSPITAL_LLC]: 'Private Hospital (Limited Liability)',
  [OrganizerEntityType.PUBLIC_HOSPITAL]: 'Public Hospital',
  [OrganizerEntityType.PRIVATE_EDUCATION_SOLE_PROPRIETOR]: 'Private Education Institution (Sole Proprietor)',
  [OrganizerEntityType.PRIVATE_EDUCATION_LLC]: 'Private Education Institution (Limited Liability)',
  [OrganizerEntityType.INTERNATIONAL_EDUCATION_LLC]: 'International Education Institution (Limited Liability)',
  [OrganizerEntityType.PUBLIC_EDUCATION]: 'Public Education Institution',
  [OrganizerEntityType.COOPERATIVE_SOCIETY]: 'Co-operative Society',
  [OrganizerEntityType.INSURANCE_REINSURANCE]: 'Insurance/Reinsurance Company',
  [OrganizerEntityType.NGO]: 'Non-Governmental Organization (NGO)',
  [OrganizerEntityType.EMBASSY_UN_WORLD_BANK]: 'Embassy/UN/World Bank',
  [OrganizerEntityType.DENOMINATIONAL_CHURCH]: 'Denominational Church',
  [OrganizerEntityType.PARTNERSHIP_PROFESSIONAL]: 'Partnership (Professional)',
  [OrganizerEntityType.TRUST]: 'Trust',
  [OrganizerEntityType.OTHER]: 'Other',
};

export const EntityTypeSelector: React.FC<EntityTypeSelectorProps> = ({
  selectedType,
  onSelect,
  onNext,
  disabled = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['business'])); // Expand business by default

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
      }
      return next;
    });
  };

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) {
      return ENTITY_GROUPS;
    }

    const query = searchQuery.toLowerCase();
    const filtered: Record<string, typeof ENTITY_GROUPS[keyof typeof ENTITY_GROUPS]> = {};

    Object.entries(ENTITY_GROUPS).forEach(([key, group]) => {
      const matchingTypes = group.types.filter((type) =>
        ENTITY_DISPLAY_NAMES[type].toLowerCase().includes(query)
      );

      if (matchingTypes.length > 0 || group.label.toLowerCase().includes(query)) {
        filtered[key] = {
          ...group,
          types: matchingTypes.length > 0 ? matchingTypes : group.types,
        };
      }
    });

    return filtered;
  }, [searchQuery]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Select Your Entity Type</h2>
        <p className="text-muted-foreground">
          Choose the type of entity you're registering. This will determine the documents required for verification.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          type="text"
          placeholder="Search entity types..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="space-y-4">
        {Object.entries(filteredGroups).map(([groupKey, group]) => {
          const Icon = group.icon;
          const isExpanded = expandedGroups.has(groupKey);

          return (
            <Card key={groupKey}>
              <CardHeader
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => toggleGroup(groupKey)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-primary" />
                    <CardTitle className="text-lg">{group.label}</CardTitle>
                    <Badge variant="secondary">{group.types.length}</Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleGroup(groupKey);
                    }}
                  >
                    {isExpanded ? '−' : '+'}
                  </Button>
                </div>
              </CardHeader>
              {isExpanded && (
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {group.types.map((type) => {
                      const isSelected = selectedType === type;
                      return (
                        <button
                          key={type}
                          type="button"
                          disabled={disabled}
                          onClick={() => onSelect(type)}
                          className={`
                            p-4 rounded-lg border-2 text-left transition-all
                            ${isSelected
                              ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                              : 'border-border hover:border-primary/50 hover:bg-muted/50'
                            }
                            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                          `}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{ENTITY_DISPLAY_NAMES[type]}</span>
                            {isSelected && (
                              <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {selectedType && (
        <div className="flex justify-end">
          <Button onClick={onNext} disabled={disabled}>
            Continue
          </Button>
        </div>
      )}
    </div>
  );
};

