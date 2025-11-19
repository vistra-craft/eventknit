import { Moon, Sun, Monitor } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type Theme = "light" | "dark" | "system";

interface ThemeSelectorProps {
  value: Theme;
  onChange: (value: Theme) => void;
  label?: string;
  description?: string;
  className?: string;
}

export const ThemeSelector = ({
  value,
  onChange,
  label = "Color Theme",
  description,
  className = "",
}: ThemeSelectorProps) => {
  return (
    <div className={className}>
      <Label htmlFor="theme">{label}</Label>
      {description && (
        <p className="text-sm text-muted-foreground mt-1 mb-2">{description}</p>
      )}
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="theme">
          <SelectValue placeholder="Select theme" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="light">
            <div className="flex items-center">
              <Sun className="h-4 w-4 mr-2" />
              Light
            </div>
          </SelectItem>
          <SelectItem value="dark">
            <div className="flex items-center">
              <Moon className="h-4 w-4 mr-2" />
              Dark
            </div>
          </SelectItem>
          <SelectItem value="system">
            <div className="flex items-center">
              <Monitor className="h-4 w-4 mr-2" />
              System
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

