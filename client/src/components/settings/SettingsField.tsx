import { ReactNode } from "react";
import { Label } from "@/components/ui/label";

interface SettingsFieldProps {
  label: string;
  description?: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
  className?: string;
}

export const SettingsField = ({
  label,
  description,
  htmlFor,
  required = false,
  error,
  children,
  className = "",
}: SettingsFieldProps) => {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor} className={required ? "after:content-['*'] after:text-destructive after:ml-1" : ""}>
        {label}
      </Label>
      {description && (
        <p className="text-sm text-muted-foreground mt-1 mb-2">{description}</p>
      )}
      {children}
      {error && (
        <p className="text-sm text-destructive mt-1">{error}</p>
      )}
    </div>
  );
};


