/**
 * SeatingConfigStep Component
 *
 * Step in event creation wizard for configuring seating
 * Only shown if hasSeatingMap is true
 *
 * Allows organizers to:
 * - Choose seating type (CUSTOMER_SELECTS, ORGANIZER_ASSIGNS, HYBRID)
 * - Configure seat map
 * - Set pricing overrides per section
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertCircle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Armchair, CheckCircle2, Plus } from 'lucide-react';

export interface SeatingConfigStepData {
  hasSeatingMap: boolean;
  seatingType: 'CUSTOMER_SELECTS' | 'ORGANIZER_ASSIGNS' | 'HYBRID' | '';
  seatMapRequired: boolean;
}

interface SeatingConfigStepProps {
  data: SeatingConfigStepData;
  onUpdate: (data: Partial<SeatingConfigStepData>) => void;
  onOpenSeatMapBuilder?: () => void;
  eventId?: string;
  isLoading?: boolean;
}

const SEATING_TYPE_INFO = {
  CUSTOMER_SELECTS: {
    title: 'Customers choose seats during purchase',
    description: 'Best for: Concerts, sports, festivals, theater, cinema',
    icon: '🎭',
    details: [
      'Customers select their preferred seats at checkout',
      'Requires seat map configured before event goes live',
      'Supports dynamic pricing per section',
      'Real-time seat availability updates',
    ],
  },
  ORGANIZER_ASSIGNS: {
    title: "I'll assign seats after purchase",
    description: 'Best for: Corporate events, premium experiences, theater',
    icon: '👤',
    details: [
      'You assign seats to customers after they purchase',
      'Customers can provide seating preferences',
      'Can be used without pre-configured seat map',
      'Full control over seat allocation',
    ],
  },
  HYBRID: {
    title: 'Different rules for different ticket types',
    description: 'Best for: Premium conferences, stadium events with VIP areas',
    icon: '⚙️',
    details: [
      'Different ticket types use different seating models',
      'E.g., VIP tier = customer selects, standard = organizer assigns',
      'Flexible and powerful for mixed events',
    ],
  },
};

export const SeatingConfigStep = ({
  data,
  onUpdate,
  onOpenSeatMapBuilder,
  isLoading = false,
}: SeatingConfigStepProps) => {
  const [selectedType, setSelectedType] = useState<string>(data.seatingType || '');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    setSelectedType(data.seatingType || '');
  }, [data.seatingType]);

  const handleSeatingTypeChange = (type: string) => {
    setSelectedType(type);
    setError('');

    onUpdate({
      seatingType: type as SeatingConfigStepData['seatingType'],
    });
  };

  const handleOpenBuilder = () => {
    if (onOpenSeatMapBuilder) {
      onOpenSeatMapBuilder();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Armchair className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-2xl font-semibold">Seating Configuration</h2>
          <p className="text-sm text-muted-foreground mt-1">
            How should customers book seats at your event?
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Seating Type Selection */}
      <div className="space-y-4">
        <Label className="text-base font-semibold">Choose your seating model</Label>

        <RadioGroup value={selectedType} onValueChange={handleSeatingTypeChange} disabled={isLoading}>
          {(
            [
              'CUSTOMER_SELECTS',
              'ORGANIZER_ASSIGNS',
              'HYBRID',
            ] as SeatingConfigStepProps['data']['seatingType'][]
          ).map((type) => {
            if (!type) return null;

            const info = SEATING_TYPE_INFO[type];

            return (
              <Card
                key={type}
                className={`cursor-pointer transition-all ${
                  selectedType === type
                    ? 'border-primary bg-primary/5'
                    : 'hover:border-muted-foreground/50'
                }`}
                onClick={() => handleSeatingTypeChange(type)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <RadioGroupItem value={type} id={`seating-${type}`} className="mt-1" />

                    <div className="flex-1">
                      <Label htmlFor={`seating-${type}`} className="flex items-center gap-2 cursor-pointer font-semibold">
                        <span>{info.icon}</span>
                        {info.title}
                      </Label>

                      <p className="text-sm text-muted-foreground mt-1">{info.description}</p>

                      {selectedType === type && (
                        <ul className="mt-3 space-y-2 text-sm">
                          {info.details.map((detail, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                              <span className="text-muted-foreground">{detail}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </RadioGroup>
      </div>

      {/* Seat Map Configuration Section */}
      {selectedType && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Armchair className="h-4 w-4" />
              Seat Map Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedType === 'CUSTOMER_SELECTS' && (
              <>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Required:</strong> You must configure a seat map before publishing this event.
                    Customers will not be able to purchase tickets without it.
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <Label className="text-sm font-medium">Add your seat map</Label>

                  <Button
                    onClick={handleOpenBuilder}
                    disabled={isLoading}
                    className="w-full"
                    variant="outline"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Open Seat Map Builder
                  </Button>

                  <div className="text-sm text-muted-foreground space-y-2 p-3 bg-white rounded border">
                    <p>• Define sections (VIP, General, Balcony, etc.)</p>
                    <p>• Set prices per section</p>
                    <p>• Upload venue image (optional)</p>
                    <p>• Configure seat restrictions</p>
                  </div>
                </div>
              </>
            )}

            {selectedType === 'ORGANIZER_ASSIGNS' && (
              <>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Optional: You can add a seat map now or configure seats later after event publication.
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <Label className="text-sm font-medium">Seat map (optional)</Label>

                  <Button
                    onClick={handleOpenBuilder}
                    disabled={isLoading}
                    className="w-full"
                    variant="outline"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Open Seat Map Builder
                  </Button>

                  <p className="text-xs text-muted-foreground">
                    You can skip this and add a seat map later in the organizer dashboard.
                  </p>
                </div>
              </>
            )}

            {selectedType === 'HYBRID' && (
              <>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    You'll configure which ticket types use which seating model in the next step.
                  </AlertDescription>
                </Alert>

                <Button
                  onClick={handleOpenBuilder}
                  disabled={isLoading}
                  className="w-full"
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Open Seat Map Builder
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Help Section */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-sm">Need help choosing?</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            <strong>Use CUSTOMER_SELECTS if:</strong> You want customers to pick their preferred seats, you have
            dynamic pricing, or you need maximum control over availability.
          </p>
          <p>
            <strong>Use ORGANIZER_ASSIGNS if:</strong> You want to control who sits where, you're managing premium
            events, or seating is part of your event curation.
          </p>
          <p>
            <strong>Use HYBRID if:</strong> Different ticket tiers need different seating rules (VIP picks, standard
            assigned).
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SeatingConfigStep;
