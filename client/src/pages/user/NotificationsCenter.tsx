/**
 * Attendee Notifications Center
 * Uses the shared NotificationsHub with attendee-specific filter options.
 */

import NotificationsHub, { ATTENDEE_TYPE_FILTERS } from "@/components/notifications/NotificationsHub";

const NotificationsCenter = () => {
  return (
    <NotificationsHub
      typeFilters={ATTENDEE_TYPE_FILTERS}
      showBackButton={true}
      showDetails={true}
    />
  );
};

export default NotificationsCenter;
