import { useState } from 'react';
import { Check, Pipette } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const PRESET_COLORS = [
  { label: 'Indigo',   value: '#6366f1' },
  { label: 'Blue',     value: '#3b82f6' },
  { label: 'Cyan',     value: '#06b6d4' },
  { label: 'Teal',     value: '#14b8a6' },
  { label: 'Emerald',  value: '#10b981' },
  { label: 'Violet',   value: '#8b5cf6' },
  { label: 'Pink',     value: '#ec4899' },
  { label: 'Rose',     value: '#f43f5e' },
  { label: 'Orange',   value: '#f97316' },
  { label: 'Amber',    value: '#f59e0b' },
  { label: 'Slate',    value: '#475569' },
  { label: 'Neutral',  value: '#525252' },
];

interface AccentColorPickerProps {
  value: string | undefined;
  onChange: (color: string | undefined) => void;
}

export function AccentColorPicker({ value, onChange }: AccentColorPickerProps) {
  const [customHex, setCustomHex] = useState(value ?? '');

  const handlePreset = (color: string) => {
    setCustomHex(color);
    onChange(color);
  };

  const handleCustomInput = (raw: string) => {
    setCustomHex(raw);
    const normalised = raw.startsWith('#') ? raw : `#${raw}`;
    if (/^#[0-9a-fA-F]{6}$/.test(normalised)) {
      onChange(normalised);
    }
  };

  const handleColorInput = (hex: string) => {
    setCustomHex(hex);
    onChange(hex);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {PRESET_COLORS.map((c) => (
          <button
            key={c.value}
            type="button"
            title={c.label}
            onClick={() => handlePreset(c.value)}
            className={cn(
              'w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-1',
              value === c.value ? 'border-foreground scale-110' : 'border-transparent',
            )}
            style={{ backgroundColor: c.value }}
          >
            {value === c.value && (
              <Check
                className="h-3.5 w-3.5 mx-auto"
                style={{ color: isLightColor(c.value) ? '#000' : '#fff' }}
              />
            )}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Pipette className="h-4 w-4 text-muted-foreground shrink-0" />
        <div className="relative">
          <input
            type="color"
            value={value ?? '#6366f1'}
            onChange={(e) => handleColorInput(e.target.value)}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
            aria-label="Pick custom colour"
          />
          <div
            className="w-7 h-7 rounded-md border border-border cursor-pointer"
            style={{ backgroundColor: value ?? '#6366f1' }}
          />
        </div>
        <Input
          value={customHex}
          onChange={(e) => handleCustomInput(e.target.value)}
          placeholder="#6366f1"
          className="h-8 w-28 font-mono text-xs"
          maxLength={7}
        />
        {value && (
          <button
            type="button"
            onClick={() => { setCustomHex(''); onChange(undefined); }}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Reset
          </button>
        )}
      </div>

      {value && (
        <div
          className="h-8 rounded-md flex items-center justify-center text-xs font-medium"
          style={{ backgroundColor: value, color: isLightColor(value) ? '#000' : '#fff' }}
        >
          Preview
        </div>
      )}
    </div>
  );
}

function isLightColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 128;
}
