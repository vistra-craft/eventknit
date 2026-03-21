/**
 * Organizer Notifications Center
 * Uses the shared NotificationsHub with organizer-specific filter options.
 */

import NotificationsHub, { ORGANIZER_TYPE_FILTERS } from "@/components/notifications/NotificationsHub";

const OrganizerNotificationsCenter = () => {
  return (
    <NotificationsHub
      typeFilters={ORGANIZER_TYPE_FILTERS}
      showBackButton={false}
      showDetails={true}
    />
  );
};

export default OrganizerNotificationsCenter;
