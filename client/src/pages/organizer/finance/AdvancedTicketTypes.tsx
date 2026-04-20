import { Card, CardContent } from "@/components/ui/card";
import { TicketPackageManager } from "@/components/tickets/TicketPackageManager";
import { useParams } from "react-router-dom";

const AdvancedTicketTypes = () => {
  const { eventId } = useParams<{ eventId: string }>();

  if (!eventId) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Event ID is required.
        </CardContent>
      </Card>
    );
  }

  return <TicketPackageManager eventId={eventId} mode="organizer" />;
};

export default AdvancedTicketTypes;
