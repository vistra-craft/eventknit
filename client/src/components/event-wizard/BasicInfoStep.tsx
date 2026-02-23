import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EVENT_CATEGORIES } from '@/lib/event-categories';
import { MapPin, Globe, Users } from 'lucide-react';
import type { StepComponentProps } from './types';

// Helper function to strip HTML tags and get text length
const getTextLength = (html: string): number => {
  const text = html.replace(/<[^>]*>/g, '').trim();
  return text.length;
};

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
}: BasicInfoStepProps) {
  return (
    <div className="space-y-6">
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
            className={`h-12 ${validationErrors.title ? 'border-destructive' : ''}`}
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
            className="h-12"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Event Description *</Label>
        <RichTextEditor
          content={eventData.description}
          onChange={(html) => {
            onInputChange("description", html);
            if (validationErrors.description) setValidationErrors(prev => ({ ...prev, description: '' }));
          }}
          placeholder="Describe what your event is about..."
          minHeight="180px"
          className={validationErrors.description ? 'border-destructive' : ''}
        />
        <div className="flex justify-between">
          <p className="text-sm text-muted-foreground">
            {getTextLength(eventData.description)}/10000 characters
          </p>
          {validationErrors.description && (
            <p className="text-sm text-destructive">{validationErrors.description}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="organizerDescription">About the Organizer (Optional)</Label>
        <RichTextEditor
          content={eventData.organizerDescription || ""}
          onChange={(html) => onInputChange("organizerDescription", html)}
          placeholder="Tell attendees about yourself or your organization. This will be displayed on the event details page."
          minHeight="160px"
        />
        <p className="text-sm text-muted-foreground">
          {getTextLength(eventData.organizerDescription || "")}/1000 characters
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
              {EVENT_CATEGORIES.map((category) => (
                <SelectItem key={category.value} value={category.value}>{category.label}</SelectItem>
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
