import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Timezone {
  value: string;
  label: string;
  group: string;
}

const TIMEZONES: Timezone[] = [
  // Americas
  { value: "America/New_York", label: "Eastern Time (ET)", group: "Americas" },
  { value: "America/Chicago", label: "Central Time (CT)", group: "Americas" },
  { value: "America/Denver", label: "Mountain Time (MT)", group: "Americas" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)", group: "Americas" },
  { value: "America/Phoenix", label: "Arizona (MST)", group: "Americas" },
  { value: "America/Anchorage", label: "Alaska Time (AKT)", group: "Americas" },
  { value: "America/Toronto", label: "Toronto (ET)", group: "Americas" },
  { value: "America/Vancouver", label: "Vancouver (PT)", group: "Americas" },
  { value: "America/Mexico_City", label: "Mexico City (CST)", group: "Americas" },
  { value: "America/Sao_Paulo", label: "São Paulo (BRT)", group: "Americas" },
  // Europe
  { value: "Europe/London", label: "London (GMT)", group: "Europe" },
  { value: "Europe/Paris", label: "Paris (CET)", group: "Europe" },
  { value: "Europe/Berlin", label: "Berlin (CET)", group: "Europe" },
  { value: "Europe/Rome", label: "Rome (CET)", group: "Europe" },
  { value: "Europe/Madrid", label: "Madrid (CET)", group: "Europe" },
  { value: "Europe/Amsterdam", label: "Amsterdam (CET)", group: "Europe" },
  { value: "Europe/Moscow", label: "Moscow (MSK)", group: "Europe" },
  // Asia
  { value: "Asia/Dubai", label: "Dubai (GST)", group: "Asia" },
  { value: "Asia/Kolkata", label: "Mumbai/New Delhi (IST)", group: "Asia" },
  { value: "Asia/Shanghai", label: "Shanghai (CST)", group: "Asia" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)", group: "Asia" },
  { value: "Asia/Seoul", label: "Seoul (KST)", group: "Asia" },
  { value: "Asia/Hong_Kong", label: "Hong Kong (HKT)", group: "Asia" },
  { value: "Asia/Singapore", label: "Singapore (SGT)", group: "Asia" },
  // Oceania
  { value: "Australia/Sydney", label: "Sydney (AEDT)", group: "Oceania" },
  { value: "Australia/Melbourne", label: "Melbourne (AEDT)", group: "Oceania" },
  { value: "Pacific/Auckland", label: "Auckland (NZDT)", group: "Oceania" },
  // UTC
  { value: "UTC", label: "UTC (Coordinated Universal Time)", group: "UTC" },
];

interface TimezoneSelectorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  description?: string;
  className?: string;
}

export const TimezoneSelector = ({
  value,
  onChange,
  label = "Timezone",
  description,
  className = "",
}: TimezoneSelectorProps) => {
  const groupedTimezones = TIMEZONES.reduce((acc, tz) => {
    if (!acc[tz.group]) {
      acc[tz.group] = [];
    }
    acc[tz.group].push(tz);
    return acc;
  }, {} as Record<string, Timezone[]>);

  return (
    <div className={className}>
      <Label htmlFor="timezone">{label}</Label>
      {description && (
        <p className="text-sm text-muted-foreground mt-1 mb-2">{description}</p>
      )}
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="timezone">
          <SelectValue placeholder="Select timezone" />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(groupedTimezones).map(([group, timezones]) => (
            <div key={group}>
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                {group}
              </div>
              {timezones.map((tz) => (
                <SelectItem key={tz.value} value={tz.value}>
                  {tz.label}
                </SelectItem>
              ))}
            </div>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

