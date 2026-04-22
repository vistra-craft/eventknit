import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Check } from 'lucide-react';

interface EventPreferencesStepProps {
  formData: {
    eventTypes: string[];
    organizationType: string;
    eventsPerYear: string;
    isRecurringSeries: boolean;
  };
  onUpdate: (data: Partial<EventPreferencesStepProps['formData']>) => void;
  error?: string;
  showHeader?: boolean;
}

const EVENT_TYPES = [
  'Music',
  'Comedy',
  'Food & Drink',
  'Community & Culture',
  'Hobbies & Special Interest',
  'Performing & Visual Arts',
  'Parties',
  'Technology',
  'Business',
  'Sports',
  'Education',
];

const ORGANIZATION_TYPES = [
  'Music Nightlife & Parties',
  'Music Promoter',
  'Music Artist or Performer',
  'Music Venue',
  'Music Festival',
  'Event Planning Company',
  'Corporate Events',
  'Non-Profit Organization',
  'Educational Institution',
  'Other',
];

export const EventPreferencesStep = ({ formData, onUpdate, error, showHeader = true }: EventPreferencesStepProps) => {
  const toggle = (label: string) => {
    const next = formData.eventTypes.includes(label)
      ? formData.eventTypes.filter((t) => t !== label)
      : [...formData.eventTypes, label];
    onUpdate({ eventTypes: next });
  };

  return (
    <div className="space-y-7">
      {showHeader && (
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-1">Tell us about your events</h2>
          <p className="text-sm text-muted-foreground">
            This helps us personalize your experience. You can always change it later.
          </p>
        </div>
      )}

      {/* Event type chips */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-foreground">
          What type of events do you host? <span className="text-destructive">*</span>
        </Label>
        <div className="flex flex-wrap gap-2">
          {EVENT_TYPES.map((label) => {
            const selected = formData.eventTypes.includes(label);
            return (
              <button
                key={label}
                type="button"
                onClick={() => toggle(label)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-150 ${
                  selected
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-transparent text-foreground border-border hover:border-primary/40 hover:bg-muted/40'
                }`}
              >
                {label}
                {selected && <Check className="w-3 h-3 shrink-0" />}
              </button>
            );
          })}
        </div>
        {formData.eventTypes.length > 0 && (
          <p className="text-xs text-muted-foreground">{formData.eventTypes.length} selected</p>
        )}
      </div>

      {/* Organization type */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-foreground">
          Which best describes your organization? <span className="text-destructive">*</span>
        </Label>
        <Select value={formData.organizationType} onValueChange={(v) => onUpdate({ organizationType: v })}>
          <SelectTrigger className="h-11">
            <SelectValue placeholder="Select your organization type" />
          </SelectTrigger>
          <SelectContent>
            {ORGANIZATION_TYPES.map((type) => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Events per year */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-foreground">
          How many events do you plan to organize this year? <span className="text-destructive">*</span>
        </Label>
        <Select value={formData.eventsPerYear} onValueChange={(v) => onUpdate({ eventsPerYear: v })}>
          <SelectTrigger className="h-11">
            <SelectValue placeholder="Select a range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1-2">1-2 events</SelectItem>
            <SelectItem value="3-5">3-5 events</SelectItem>
            <SelectItem value="5-10">5-10 events</SelectItem>
            <SelectItem value="10-20">10-20 events</SelectItem>
            <SelectItem value="20+">20+ events</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Recurring series */}
      <label className="flex items-center gap-3 cursor-pointer group">
        <Checkbox
          id="isRecurringSeries"
          checked={formData.isRecurringSeries}
          onCheckedChange={(checked) => onUpdate({ isRecurringSeries: checked === true })}
        />
        <span className="text-sm text-foreground group-hover:text-foreground/80 select-none">
          My events are part of a recurring series
        </span>
      </label>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
};
