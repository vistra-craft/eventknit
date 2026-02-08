import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RichTextContent } from "@/components/ui/RichTextContent";
import type { StepComponentProps, TicketType } from "./types";

interface ReviewStepProps extends StepComponentProps {
  ticketTypes: TicketType[];
  eventType: string;
  isPrivate: boolean;
  setIsPrivate: (v: boolean) => void;
}

export function ReviewStep({
  eventData,
  ticketTypes,
  eventType,
  isPrivate,
  setIsPrivate,
}: ReviewStepProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Event Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Event Title</Label>
              <p className="text-lg font-semibold">{eventData.title || 'Not set'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Organizer</Label>
              <p className="text-lg font-semibold">{eventData.organizer || 'Not set'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Date & Time</Label>
              <p className="text-lg font-semibold">
                {eventData.date && eventData.time
                  ? `${eventData.date} at ${eventData.time}`
                  : 'Not set'
                }
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Location</Label>
              <p className="text-lg font-semibold">
                {eventType === 'online'
                  ? 'Online Event'
                  : eventType === 'hybrid'
                    ? `${eventData.venue || 'Not set'} + Online`
                    : eventData.venue || eventData.location || 'Not set'}
              </p>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-muted-foreground">Description</Label>
            {eventData.description ? (
              <RichTextContent
                content={eventData.description}
                className="text-base"
              />
            ) : (
              <p className="text-base">Not set</p>
            )}
          </div>

          <div>
            <Label className="text-sm font-medium text-muted-foreground">Ticket Types</Label>
            <div className="space-y-2">
              {ticketTypes.map((ticket, index) => (
                <div key={ticket.id} className="flex justify-between items-center p-2 bg-muted rounded">
                  <span>{ticket.name || `Ticket ${index + 1}`}</span>
                  <span className="font-medium">
                    {ticket.type === 'free' ? 'Free' : `${eventData.currency || 'KES'} ${ticket.price}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Switch
            checked={isPrivate}
            onCheckedChange={setIsPrivate}
          />
          <Label>Make this event private</Label>
        </div>
        <p className="text-sm text-muted-foreground">
          Private events are only visible to people with the direct link.
        </p>
      </div>
    </div>
  );
}
