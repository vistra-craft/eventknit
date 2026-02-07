import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Globe, Users } from 'lucide-react';
import type { StepComponentProps } from './types';

interface BasicInfoStepProps extends StepComponentProps {
  eventType: string;
  setEventType: (type: string) => void;
  eventCategories: string[];
}

export function BasicInfoStep({
  eventData,
  onInputChange,
  validationErrors,
  setValidationErrors,
  eventType,
  setEventType,
  eventCategories,
}: BasicInfoStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Basic Event Information
        </h2>
        <p className="text-muted-foreground">
          Let's start with the essential details about your event.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="eventName">Event Title *</Label>
          <Input
            id="eventName"
            placeholder="Give your event a catchy title"
            value={eventData.title}
            onChange={(e) => {
              onInputChange("title", e.target.value);
              if (validationErrors.title) setValidationErrors(prev => ({ ...prev, title: '' }));
            }}
            className={`h-12 border-border focus-visible:border-primary/30 ${validationErrors.title ? 'border-destructive' : ''}`}
          />
          {validationErrors.title && (
            <p className="text-sm text-destructive">{validationErrors.title}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="organizer">Organizer Name</Label>
          <Input
            id="organizer"
            placeholder="Your organization name"
            value={eventData.organizer}
            onChange={(e) => onInputChange("organizer", e.target.value)}
            className="h-12 border-border focus-visible:border-primary/30"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Event Description *</Label>
        <Textarea
          id="description"
          placeholder="Describe what your event is about..."
          rows={4}
          value={eventData.description}
          maxLength={5000}
          onChange={(e) => {
            onInputChange("description", e.target.value);
            if (validationErrors.description) setValidationErrors(prev => ({ ...prev, description: '' }));
          }}
          className={validationErrors.description ? 'border-destructive' : ''}
        />
        <div className="flex justify-between">
          <p className="text-sm text-muted-foreground">
            {eventData.description.length}/5000 characters
          </p>
          {validationErrors.description && (
            <p className="text-sm text-destructive">{validationErrors.description}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="fullDescription">Detailed Description (Optional)</Label>
        <Textarea
          id="fullDescription"
          placeholder="Provide a more comprehensive description of your event, including what attendees can expect..."
          rows={6}
          value={eventData.fullDescription}
          maxLength={10000}
          onChange={(e) => onInputChange("fullDescription", e.target.value)}
        />
        <p className="text-sm text-muted-foreground">
          {eventData.fullDescription.length}/10000 characters
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="organizerDescription">About the Organizer (Optional)</Label>
        <Textarea
          id="organizerDescription"
          placeholder="Tell attendees about yourself or your organization. This will be displayed on the event details page."
          rows={4}
          value={eventData.organizerDescription || ""}
          maxLength={1000}
          onChange={(e) => onInputChange("organizerDescription", e.target.value)}
        />
        <p className="text-sm text-muted-foreground">
          {(eventData.organizerDescription || "").length}/1000 characters
        </p>
        <p className="text-xs text-muted-foreground">
          Share information about yourself or your organization to help attendees learn more about the event host.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Event Type *</Label>
          <div className="grid grid-cols-3 gap-2">
            <Button
              type="button"
              variant={eventType === 'in-person' ? 'default' : 'outline'}
              onClick={() => setEventType('in-person')}
              className={`h-11 text-sm font-medium rounded-xl transition-all duration-200 ${
                eventType === 'in-person'
                  ? 'bg-primary text-white hover:bg-primary/90'
                  : 'border border-primary text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary'
              }`}
            >
              <MapPin className="mr-2 h-4 w-4" />
              In-Person
            </Button>
            <Button
              type="button"
              variant={eventType === 'online' ? 'default' : 'outline'}
              onClick={() => setEventType('online')}
              className={`h-11 text-sm font-medium rounded-xl transition-all duration-200 ${
                eventType === 'online'
                  ? 'bg-primary text-white hover:bg-primary/90'
                  : 'border border-primary text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary'
              }`}
            >
              <Globe className="mr-2 h-4 w-4" />
              Online
            </Button>
            <Button
              type="button"
              variant={eventType === 'hybrid' ? 'default' : 'outline'}
              onClick={() => setEventType('hybrid')}
              className={`h-11 text-sm font-medium rounded-xl transition-all duration-200 ${
                eventType === 'hybrid'
                  ? 'bg-primary text-white hover:bg-primary/90'
                  : 'border border-primary text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary'
              }`}
            >
              <Users className="mr-2 h-4 w-4" />
              Hybrid
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Select
            value={eventData.category || ""}
            onValueChange={(value) => {
              onInputChange("category", value);
              if (validationErrors.category) setValidationErrors(prev => ({ ...prev, category: '' }));
            }}
          >
            <SelectTrigger className={validationErrors.category ? 'border-destructive' : ''}>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {eventCategories.map((category) => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {validationErrors.category && (
            <p className="text-sm text-destructive">{validationErrors.category}</p>
          )}
        </div>
      </div>
    </div>
  );
}
