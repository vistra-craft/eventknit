import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Globe, Calendar, X, MapPin, Clock } from 'lucide-react';
import type { StepComponentProps } from './types';
import { TIMEZONES, getCurrentTimezone, getTimezoneLabel } from './types';

interface DateLocationStepProps extends StepComponentProps {
  eventType: string;
  timezone: string;
  setTimezone: (tz: string) => void;
}

// Time Picker Component
function TimePicker({ value, onChange, id }: { value: string; onChange: (val: string) => void; id: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));

  const [selectedHour, selectedMinute] = value ? value.split(':') : ['00', '00'];

  const handleTimeSelect = (hour: string, minute: string) => {
    const newTime = `${hour}:${minute}`;
    onChange(newTime);
    setIsOpen(false);
  };

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Input
            id={id}
            type="time"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-12 pr-10 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-inner-spin-button]:hidden"
            placeholder="HH:MM"
          />
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <Clock className="h-4 w-4" />
          </button>
        </div>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-muted"
            onClick={() => onChange("")}
          >
            <X className="h-4 w-4 text-muted-foreground" />
            <span className="sr-only">Clear time</span>
          </Button>
        )}
      </div>

      {/* Time Picker Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-popover border border-border rounded-lg shadow-lg p-3 z-50 w-64">
          <div className="grid grid-cols-2 gap-3">
            {/* Hours */}
            <div>
              <Label className="text-xs font-semibold text-muted-foreground mb-2 block">Hour</Label>
              <div className="border border-border rounded-lg h-48 overflow-y-auto">
                {hours.map((hour) => (
                  <button
                    key={hour}
                    type="button"
                    onClick={() => handleTimeSelect(hour, selectedMinute)}
                    className={`w-full px-3 py-2 text-sm text-left hover:bg-accent transition-colors ${
                      selectedHour === hour ? 'bg-primary text-primary-foreground font-semibold' : ''
                    }`}
                  >
                    {hour}:00
                  </button>
                ))}
              </div>
            </div>

            {/* Minutes */}
            <div>
              <Label className="text-xs font-semibold text-muted-foreground mb-2 block">Minute</Label>
              <div className="border border-border rounded-lg h-48 overflow-y-auto">
                {['00', '15', '30', '45'].map((minute) => (
                  <button
                    key={minute}
                    type="button"
                    onClick={() => handleTimeSelect(selectedHour, minute)}
                    className={`w-full px-3 py-2 text-sm text-left hover:bg-accent transition-colors ${
                      selectedMinute === minute ? 'bg-primary text-primary-foreground font-semibold' : ''
                    }`}
                  >
                    :{minute}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full mt-2"
            onClick={() => setIsOpen(false)}
          >
            Done
          </Button>
        </div>
      )}
    </div>
  );
}

export function DateLocationStep({
  eventData,
  onInputChange,
  validationErrors,
  setValidationErrors,
  eventType,
  timezone,
  setTimezone,
}: DateLocationStepProps) {
  const handleInputChange = (field: string, value: string | boolean | number) => {
    onInputChange(field, value);
  };

  return (
    <div className="space-y-6">
      {/* Event Date & Start Time */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Event Date *</Label>
          <div className="relative">
            <Input
              id="date"
              type="date"
              value={eventData.date}
              onChange={(e) => {
                handleInputChange("date", e.target.value);
                // Clear end date if it's before start date
                if (eventData.endDate && e.target.value > eventData.endDate) {
                  handleInputChange("endDate", "");
                }
                if (validationErrors.date) setValidationErrors(prev => ({ ...prev, date: '' }));
              }}
              className={`h-12 pr-10 [&::-webkit-calendar-picker-indicator]:hidden ${validationErrors.date ? 'border-destructive' : ''}`}
            />
            <button
              type="button"
              onClick={() => document.getElementById('date')?.showPicker?.()}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <Calendar className="h-4 w-4" />
            </button>
          </div>
          {validationErrors.date && (
            <p className="text-sm text-destructive">{validationErrors.date}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="time">Start Time *</Label>
          <TimePicker
            id="time"
            value={eventData.time}
            onChange={(value) => {
              handleInputChange("time", value);
              if (validationErrors.time) setValidationErrors(prev => ({ ...prev, time: '' }));
            }}
          />
          {validationErrors.time && (
            <p className="text-sm text-destructive">{validationErrors.time}</p>
          )}
        </div>
      </div>

      {/* Timezone - Positioned early for context */}
      <div className="space-y-2">
        <Label htmlFor="timezone" className="flex items-center gap-2">
          <Globe className="w-4 h-4" />
          Timezone *
        </Label>
        <Select
          value={timezone}
          onValueChange={(value) => {
            if (value === '__local__') {
              // Use the detected local timezone
              setTimezone(getCurrentTimezone());
            } else {
              setTimezone(value);
            }
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select timezone">
              {timezone ? getTimezoneLabel(timezone) : "Select timezone"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {/* Local timezone option */}
            <SelectItem value="__local__" className="font-medium">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span>Use current timezone ({getCurrentTimezone().replace(/_/g, ' ')})</span>
              </div>
            </SelectItem>
            <div className="my-1 border-t border-border" />
            {TIMEZONES.map((tz) => (
              <SelectItem key={tz.value} value={tz.value}>
                {tz.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          All event times will be displayed and stored in this timezone
        </p>
      </div>

      {/* End Date & Time */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="endDate">End Date</Label>
          <div className="relative">
            <Input
              id="endDate"
              type="date"
              min={eventData.date || undefined}
              value={eventData.endDate}
              onChange={(e) => {
                handleInputChange("endDate", e.target.value);
                if (validationErrors.endDate) setValidationErrors(prev => ({ ...prev, endDate: '' }));
              }}
              className={`h-12 pr-10 [&::-webkit-calendar-picker-indicator]:hidden ${validationErrors.endDate ? 'border-destructive' : ''}`}
            />
            <button
              type="button"
              onClick={() => document.getElementById('endDate')?.showPicker?.()}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <Calendar className="h-4 w-4" />
            </button>
          </div>
          {validationErrors.endDate && (
            <p className="text-sm text-destructive">{validationErrors.endDate}</p>
          )}
          {eventData.date && !eventData.endDate && (
            <p className="text-xs text-muted-foreground">
              Minimum date: {new Date(eventData.date).toLocaleDateString()}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="endTime">End Time</Label>
          <TimePicker
            id="endTime"
            value={eventData.endTime}
            onChange={(value) => handleInputChange("endTime", value)}
          />
        </div>
      </div>

      {/* Registration Deadline - Toggle Section */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <Label htmlFor="hasRegistrationDeadline" className="text-sm font-medium cursor-pointer">
                Set Registration Deadline
              </Label>
              <p className="text-xs text-muted-foreground">
                Close registrations before the event starts
              </p>
            </div>
          </div>
          <Switch
            id="hasRegistrationDeadline"
            checked={!!eventData.registrationDeadline}
            onCheckedChange={(checked) => {
              if (!checked) {
                handleInputChange("registrationDeadline", "");
              } else {
                // Default to event date if available
                handleInputChange("registrationDeadline", eventData.date || "");
              }
            }}
          />
        </div>

        {/* Expandable deadline fields */}
        {eventData.registrationDeadline !== "" && (
          <div className="pt-3 border-t border-border animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="registrationDeadline" className="text-xs text-muted-foreground">
                  Last Registration Date
                </Label>
                <div className="relative">
                  <Input
                    id="registrationDeadline"
                    type="date"
                    value={eventData.registrationDeadline}
                    max={eventData.date || undefined}
                    onChange={(e) => handleInputChange("registrationDeadline", e.target.value)}
                    className="h-10 pr-10 [&::-webkit-calendar-picker-indicator]:hidden"
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById('registrationDeadline')?.showPicker?.()}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <Calendar className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="registrationDeadlineTime" className="text-xs text-muted-foreground">
                  Closing Time
                </Label>
                <TimePicker
                  id="registrationDeadlineTime"
                  value={eventData.registrationDeadlineTime || "23:59"}
                  onChange={(value) => handleInputChange("registrationDeadlineTime", value || "23:59")}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Registrations will close on this date and time. After this, attendees won't be able to register.
            </p>
          </div>
        )}
      </div>

      {/* Venue fields for in-person and hybrid */}
      {(eventType === "in-person" || eventType === "hybrid") && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="venue">Venue Name *</Label>
            <Input
              id="venue"
              placeholder="Enter venue name"
              value={eventData.venue}
              onChange={(e) => {
                handleInputChange("venue", e.target.value);
                if (validationErrors.venue) setValidationErrors(prev => ({ ...prev, venue: '' }));
              }}
              className={`h-12 ${validationErrors.venue ? 'border-destructive' : ''}`}
            />
            {validationErrors.venue && (
              <p className="text-sm text-destructive">{validationErrors.venue}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location *</Label>
            <Input
              id="location"
              placeholder="City, State/Country"
              value={eventData.location}
              onChange={(e) => {
                handleInputChange("location", e.target.value);
                if (validationErrors.location) setValidationErrors(prev => ({ ...prev, location: '' }));
              }}
              className={`h-12 ${validationErrors.location ? 'border-destructive' : ''}`}
            />
            {validationErrors.location && (
              <p className="text-sm text-destructive">{validationErrors.location}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address *</Label>
            <Textarea
              id="address"
              placeholder="Enter full address (street, building, floor, etc.)"
              rows={2}
              value={eventData.address}
              onChange={(e) => {
                handleInputChange("address", e.target.value);
                if (validationErrors.address) setValidationErrors(prev => ({ ...prev, address: '' }));
              }}
              className={validationErrors.address ? 'border-destructive' : ''}
            />
            {validationErrors.address && (
              <p className="text-sm text-destructive">{validationErrors.address}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Full address helps attendees find your venue
            </p>
          </div>
        </div>
      )}

      {/* Online link for online and hybrid */}
      {(eventType === "online" || eventType === "hybrid") && (
        <div className="space-y-2">
          <Label htmlFor="onlineLink">Online Event Link *</Label>
          <Input
            id="onlineLink"
            placeholder="https://zoom.us/j/..."
            value={eventData.onlineLink}
            onChange={(e) => {
              handleInputChange("onlineLink", e.target.value);
              if (validationErrors.onlineLink) setValidationErrors(prev => ({ ...prev, onlineLink: '' }));
            }}
            className={`h-12 ${validationErrors.onlineLink ? 'border-destructive' : ''}`}
          />
          {validationErrors.onlineLink && (
            <p className="text-sm text-destructive">{validationErrors.onlineLink}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Paste your Zoom, Google Meet, or other meeting link. This will only be shared with registered attendees.
          </p>
        </div>
      )}

    </div>
  );
}
