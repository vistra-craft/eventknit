import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DateFormat {
  value: string;
  label: string;
  example: string;
}

const DATE_FORMATS: DateFormat[] = [
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY", example: "12/31/2024" },
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY", example: "31/12/2024" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD", example: "2024-12-31" },
  { value: "DD-MM-YYYY", label: "DD-MM-YYYY", example: "31-12-2024" },
  { value: "MMM DD, YYYY", label: "MMM DD, YYYY", example: "Dec 31, 2024" },
  { value: "DD MMM YYYY", label: "DD MMM YYYY", example: "31 Dec 2024" },
  { value: "MMMM DD, YYYY", label: "MMMM DD, YYYY", example: "December 31, 2024" },
  { value: "DD MMMM YYYY", label: "DD MMMM YYYY", example: "31 December 2024" },
];

interface DateFormatSelectorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  description?: string;
  className?: string;
}

export const DateFormatSelector = ({
  value,
  onChange,
  label = "Date Format",
  description,
  className = "",
}: DateFormatSelectorProps) => {
  return (
    <div className={className}>
      <Label htmlFor="dateFormat">{label}</Label>
      {description && (
        <p className="text-sm text-muted-foreground mt-1 mb-2">{description}</p>
      )}
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="dateFormat">
          <SelectValue placeholder="Select date format" />
        </SelectTrigger>
        <SelectContent>
          {DATE_FORMATS.map((format) => (
            <SelectItem key={format.value} value={format.value}>
              <div className="flex items-center justify-between w-full">
                <span>{format.label}</span>
                <span className="text-xs text-muted-foreground ml-4">
                  {format.example}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};


