import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Globe, Calendar, X, MapPin } from 'lucide-react';
import type { StepComponentProps } from './types';
import { TIMEZONES, getCurrentTimezone, getTimezoneLabel } from './types';

interface DateLocationStepProps extends StepComponentProps {
  eventType: string;
  timezone: string;
  setTimezone: (tz: string) => void;
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
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Date, Time & Location
        </h2>
        <p className="text-muted-foreground">
          When and where will your event take place?
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Event Date *</Label>
          <Input
            id="date"
            type="date"
            value={eventData.date}
            onChange={(e) => {
              handleInputChange("date", e.target.value);
              if (validationErrors.date) setValidationErrors(prev => ({ ...prev, date: '' }));
            }}
            className={`h-12 border-border focus-visible:border-primary/30 ${validationErrors.date ? 'border-destructive' : ''}`}
          />
          {validationErrors.date && (
            <p className="text-sm text-destructive">{validationErrors.date}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="time">Start Time *</Label>
          <div className="relative">
            <Input
              id="time"
              type="time"
              value={eventData.time}
              onChange={(e) => {
                handleInputChange("time", e.target.value);
                if (validationErrors.time) setValidationErrors(prev => ({ ...prev, time: '' }));
              }}
              className={`h-12 border-border focus-visible:border-primary/30 pr-10 ${validationErrors.time ? 'border-destructive' : ''}`}
            />
            {eventData.time && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted"
                onClick={() => handleInputChange("time", "")}
              >
                <X className="h-4 w-4 text-muted-foreground" />
                <span className="sr-only">Clear time</span>
              </Button>
            )}
          </div>
          {validationErrors.time && (
            <p className="text-sm text-destructive">{validationErrors.time}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="endDate">End Date</Label>
          <Input
            id="endDate"
            type="date"
            value={eventData.endDate}
            onChange={(e) => {
              handleInputChange("endDate", e.target.value);
              if (validationErrors.endDate) setValidationErrors(prev => ({ ...prev, endDate: '' }));
            }}
            className={`h-12 border-border focus-visible:border-primary/30 ${validationErrors.endDate ? 'border-destructive' : ''}`}
          />
          {validationErrors.endDate && (
            <p className="text-sm text-destructive">{validationErrors.endDate}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="endTime">End Time</Label>
          <div className="relative">
            <Input
              id="endTime"
              type="time"
              value={eventData.endTime}
              onChange={(e) => handleInputChange("endTime", e.target.value)}
              className="h-12 border-border focus-visible:border-primary/30 pr-10"
            />
            {eventData.endTime && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted"
                onClick={() => handleInputChange("endTime", "")}
              >
                <X className="h-4 w-4 text-muted-foreground" />
                <span className="sr-only">Clear end time</span>
              </Button>
            )}
          </div>
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
                <Input
                  id="registrationDeadline"
                  type="date"
                  value={eventData.registrationDeadline}
                  max={eventData.date || undefined}
                  onChange={(e) => handleInputChange("registrationDeadline", e.target.value)}
                  className="h-10 border-border focus-visible:border-primary/30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="registrationDeadlineTime" className="text-xs text-muted-foreground">
                  Closing Time
                </Label>
                <div className="relative">
                  <Input
                    id="registrationDeadlineTime"
                    type="time"
                    value={eventData.registrationDeadlineTime || "23:59"}
                    onChange={(e) => handleInputChange("registrationDeadlineTime", e.target.value)}
                    className="h-10 border-border focus-visible:border-primary/30 pr-10"
                  />
                  {eventData.registrationDeadlineTime && eventData.registrationDeadlineTime !== "23:59" && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 hover:bg-muted"
                      onClick={() => handleInputChange("registrationDeadlineTime", "23:59")}
                    >
                      <X className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="sr-only">Reset to default</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Registrations will close on this date and time. After this, attendees won't be able to register.
            </p>
          </div>
        )}
      </div>

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
          Event time will be displayed in this timezone
        </p>
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
              className={`h-12 border-border focus-visible:border-primary/30 ${validationErrors.venue ? 'border-destructive' : ''}`}
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
              className={`h-12 border-border focus-visible:border-primary/30 ${validationErrors.location ? 'border-destructive' : ''}`}
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
            className={`h-12 border-border focus-visible:border-primary/30 ${validationErrors.onlineLink ? 'border-destructive' : ''}`}
          />
          {validationErrors.onlineLink && (
            <p className="text-sm text-destructive">{validationErrors.onlineLink}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Paste your Zoom, Google Meet, or other meeting link. This will only be shared with registered attendees.
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="capacity">Event Capacity</Label>
        <div className="flex gap-2">
          <Input
            id="capacity"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="Maximum attendees"
            value={eventData.capacity}
            onChange={(e) => {
              const value = e.target.value;
              // Only allow positive integers or empty string
              if (value === '' || /^\d+$/.test(value)) {
                handleInputChange("capacity", value);
              }
            }}
            onBlur={(e) => {
              // Ensure value is valid on blur
              const value = e.target.value.trim();
              if (value === '' || parseInt(value, 10) > 0) {
                handleInputChange("capacity", value);
              } else {
                // Reset to empty if invalid
                handleInputChange("capacity", "");
              }
            }}
            className="h-12 border-border focus-visible:border-primary/30 flex-1"
          />
          {eventData.capacity && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-12 px-3 hover:bg-muted"
              onClick={() => handleInputChange("capacity", "")}
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </Button>
          )}
        </div>
        {/* Quick capacity buttons */}
        <div className="flex flex-wrap gap-2 mt-2">
          {[10, 50, 100, 500, 1000].map((increment) => (
            <Button
              key={increment}
              type="button"
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs"
              onClick={() => {
                const current = parseInt(eventData.capacity || '0', 10) || 0;
                handleInputChange("capacity", String(current + increment));
              }}
            >
              +{increment}
            </Button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Enter directly or use quick buttons to set capacity
        </p>
      </div>
    </div>
  );
}
