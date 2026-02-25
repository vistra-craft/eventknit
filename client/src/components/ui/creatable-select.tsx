import React, { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface CreatableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  customLabel?: string;
}

const CUSTOM_SENTINEL = '__custom__';

export const CreatableSelect: React.FC<CreatableSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  customLabel = 'Custom...',
}) => {
  const isCustomValue = value !== '' && !options.some((o) => o.value === value);
  const [isCustomMode, setIsCustomMode] = useState(isCustomValue);

  // When user picks from dropdown
  const handleSelectChange = (selected: string) => {
    if (selected === CUSTOM_SENTINEL) {
      setIsCustomMode(true);
      onChange('');
    } else {
      setIsCustomMode(false);
      onChange(selected);
    }
  };

  // Custom text input mode
  if (isCustomMode || isCustomValue) {
    return (
      <div className="flex gap-1.5">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type custom value..."
          className="flex-1"
          autoFocus={!isCustomValue}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0 h-9 w-9 text-muted-foreground hover:text-foreground"
          onClick={() => {
            setIsCustomMode(false);
            onChange(options[0]?.value || '');
          }}
          title="Switch to dropdown"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Select value={value || undefined} onValueChange={handleSelectChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
        <SelectItem value={CUSTOM_SENTINEL} className="text-muted-foreground border-t mt-1 pt-1">
          {customLabel}
        </SelectItem>
      </SelectContent>
    </Select>
  );
};
