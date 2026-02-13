/**
 * Event Management Hub
 * Unified interface for managing events
 * Reuses existing EventManagement component from organizer pages
 */

import { useParams } from 'react-router-dom';
import EventManagement from '../organizer/EventManagement';
import { PAGE_TITLES } from '../../constants/navigationLabels';

/**
 * EventManagementHub
 * Container component that renders the existing EventManagement component
 * in the context of the unified dashboard
 */
const EventManagementHub = () => {
  const { eventId } = useParams<{ eventId: string }>();

  if (!eventId) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="text-center py-16">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Event Not Found
          </h1>
          <p className="text-muted-foreground">
            Please select an event to manage.
          </p>
        </div>
      </div>
    );
  }

  // Simply render the existing EventManagement component
  // It already has all the functionality we need:
  // - Overview with metrics
  // - Attendee management
  // - Communication tools
  // - Financial data
  // - Staff assignment
  // - Event settings
  return <EventManagement />;
};

export default EventManagementHub;
