import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Language {
  code: string;
  name: string;
  nativeName?: string;
}

const LANGUAGES: Language[] = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "es", name: "Spanish", nativeName: "Español" },
  { code: "fr", name: "French", nativeName: "Français" },
  { code: "de", name: "German", nativeName: "Deutsch" },
  { code: "it", name: "Italian", nativeName: "Italiano" },
  { code: "pt", name: "Portuguese", nativeName: "Português" },
  { code: "zh", name: "Chinese", nativeName: "中文" },
  { code: "ja", name: "Japanese", nativeName: "日本語" },
  { code: "ko", name: "Korean", nativeName: "한국어" },
  { code: "ar", name: "Arabic", nativeName: "العربية" },
];

interface LanguageSelectorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  description?: string;
  className?: string;
}

export const LanguageSelector = ({
  value,
  onChange,
  label = "Language",
  description,
  className = "",
}: LanguageSelectorProps) => {
  return (
    <div className={className}>
      <Label htmlFor="language">{label}</Label>
      {description && (
        <p className="text-sm text-muted-foreground mt-1 mb-2">{description}</p>
      )}
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="language">
          <SelectValue placeholder="Select language" />
        </SelectTrigger>
        <SelectContent>
          {LANGUAGES.map((lang) => (
            <SelectItem key={lang.code} value={lang.code}>
              {lang.nativeName || lang.name} ({lang.name})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};


