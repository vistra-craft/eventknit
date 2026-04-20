/**
 * SeatingConfigurationSection Component
 *
 * Section within TicketsStep to configure seating
 * Allows organizers to enable seating and select model
 */


import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Armchair, Info } from 'lucide-react';

export interface SeatingConfig {
  hasSeatingMap: boolean;
  seatingType: 'CUSTOMER_SELECTS' | 'ORGANIZER_ASSIGNS' | 'HYBRID' | '';
  seatMapRequired: boolean;
}

interface SeatingConfigurationSectionProps {
  config: SeatingConfig;
  onConfigChange: (config: Partial<SeatingConfig>) => void;
  isLoading?: boolean;
}

const SEATING_HELP_TEXT = {
  CUSTOMER_SELECTS:
    'Customers choose their preferred seats during checkout. Requires a seat map before going live.',
  ORGANIZER_ASSIGNS:
    'You assign seats to customers after they purchase. Provides full control over seat allocation.',
  HYBRID:
    'Different ticket types use different seating models. E.g., VIP customers choose, Standard assigned by you.',
};

export const SeatingConfigurationSection = ({
  config,
  onConfigChange,
  isLoading = false,
}: SeatingConfigurationSectionProps) => {
  const handleToggleSeating = (enabled: boolean) => {
    onConfigChange({
      hasSeatingMap: enabled,
      seatingType: enabled ? (config.seatingType || 'CUSTOMER_SELECTS') : '',
      seatMapRequired: enabled ? config.seatMapRequired : false,
    });
  };

  const handleSeatingTypeChange = (type: string) => {
    onConfigChange({
      seatingType: type as SeatingConfig['seatingType'],
    });
  };

  return (
    <div className="border-t pt-8 mt-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Armchair className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Seating Configuration</h3>
      </div>

      {/* Enable Seating Toggle */}
      <div className="flex items-center gap-3 p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
        onClick={() => handleToggleSeating(!config.hasSeatingMap)}>
        <Checkbox
          checked={config.hasSeatingMap}
          onCheckedChange={(checked) => handleToggleSeating(checked === true)}
          disabled={isLoading}
          className="cursor-pointer"
        />
        <div>
          <Label className="cursor-pointer font-medium">
            This event has assigned seating
          </Label>
          <p className="text-sm text-muted-foreground">
            Enable seat selection or assignment for your event
          </p>
        </div>
      </div>

      {/* Seating Type Selection */}
      {config.hasSeatingMap && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Label className="font-semibold">How should seats be allocated?</Label>
            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
          </div>

          <RadioGroup value={config.seatingType} onValueChange={handleSeatingTypeChange} disabled={isLoading}>
            {(
              [
                { value: 'CUSTOMER_SELECTS', label: 'Customers choose seats during purchase' },
                { value: 'ORGANIZER_ASSIGNS', label: "I'll assign seats after purchase" },
                { value: 'HYBRID', label: 'Different rules for different ticket types' },
              ] as const
            ).map(({ value, label }) => (
              <div key={value} className="space-y-2">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value={value} id={`seating-${value}`} />
                  <Label htmlFor={`seating-${value}`} className="font-medium cursor-pointer">
                    {label}
                  </Label>
                </div>
                {config.seatingType === value && (
                  <p className="text-sm text-muted-foreground ml-6">
                    {SEATING_HELP_TEXT[value]}
                  </p>
                )}
              </div>
            ))}
          </RadioGroup>

          {/* Info Alert */}
          <Alert className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {config.seatingType === 'CUSTOMER_SELECTS' && (
                <>
                  <strong>Next step:</strong> You'll configure your seat map (sections, rows, pricing) in the
                  Seating step. This is required before publishing.
                </>
              )}
              {config.seatingType === 'ORGANIZER_ASSIGNS' && (
                <>
                  <strong>Next step:</strong> You can configure seat assignments after event publication. Customers
                  can provide seating preferences.
                </>
              )}
              {config.seatingType === 'HYBRID' && (
                <>
                  <strong>Next step:</strong> Configure which ticket types use customer selection vs organizer
                  assignment per ticket type.
                </>
              )}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Help Text */}
      {!config.hasSeatingMap && (
        <Alert className="bg-primary/10 border-primary/20">
          <Info className="h-4 w-4 text-primary" />
          <AlertDescription className="text-foreground">
            <strong>General admission?</strong> Keep seating disabled for festivals, general admission, or
            unreserved events. You can always enable it later.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default SeatingConfigurationSection;
