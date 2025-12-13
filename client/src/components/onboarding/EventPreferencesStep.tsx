import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

interface EventPreferencesStepProps {
  formData: {
    eventTypes: string[];
    organizationType: string;
    eventsPerYear: string;
    isRecurringSeries: boolean;
  };
  onUpdate: (data: Partial<EventPreferencesStepProps['formData']>) => void;
  error?: string;
}

const eventTypes = [
  'Music', 'Comedy', 'Food & Drink', 'Community & Culture', 
  'Hobbies & Special Interest', 'Performing & Visual Arts', 
  'Parties', 'Technology', 'Business', 'Sports', 'Education'
];

const organizationTypes = [
  'Music Nightlife & Parties',
  'Music Promoter', 
  'Music Artist or Performer',
  'Music Venue',
  'Music Festival',
  'Event Planning Company',
  'Corporate Events',
  'Non-Profit Organization',
  'Educational Institution',
  'Other'
];

export const EventPreferencesStep = ({ formData, onUpdate, error }: EventPreferencesStepProps) => {
  const handleEventTypeToggle = (eventType: string) => {
    const newEventTypes = formData.eventTypes.includes(eventType)
      ? formData.eventTypes.filter(type => type !== eventType)
      : [...formData.eventTypes, eventType];
    onUpdate({ eventTypes: newEventTypes });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Let's get to know you first!
        </h2>
        <p className="text-muted-foreground">
          Tell us what kind of events you want to host and we'll help make it happen.
        </p>
      </div>

      {/* Event Types */}
      <div className="space-y-4">
        <Label className="text-base font-medium">What type of events do you host? *</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {eventTypes.map((type) => (
            <Button
              key={type}
              type="button"
              variant={formData.eventTypes.includes(type) ? "default" : "outline"}
              onClick={() => handleEventTypeToggle(type)}
              className={`h-10 ${
                formData.eventTypes.includes(type)
                  ? 'bg-eventknit text-eventknit-foreground'
                  : 'border-border hover:bg-muted hover:border-border'
              }`}
            >
              {type}
            </Button>
          ))}
        </div>
      </div>

      {/* Organization Type */}
      <div className="space-y-2">
        <Label htmlFor="organizationType">Which best describes your organization? *</Label>
        <Select 
          value={formData.organizationType} 
          onValueChange={(value) => onUpdate({ organizationType: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select your organization type" />
          </SelectTrigger>
          <SelectContent>
            {organizationTypes.map((type) => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Events Per Year */}
      <div className="space-y-2">
        <Label htmlFor="eventsPerYear">How many events do you plan to organize in the next year? *</Label>
        <Select 
          value={formData.eventsPerYear} 
          onValueChange={(value) => onUpdate({ eventsPerYear: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Number of events" />
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

      {/* Recurring Series */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="isRecurringSeries"
          checked={formData.isRecurringSeries}
          onCheckedChange={(checked) => onUpdate({ isRecurringSeries: checked === true })}
        />
        <Label htmlFor="isRecurringSeries" className="cursor-pointer">
          My events are part of a recurring series
        </Label>
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
};

