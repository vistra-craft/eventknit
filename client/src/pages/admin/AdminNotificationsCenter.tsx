/**
 * Admin Notifications Center
 * Uses the shared NotificationsHub with admin-specific filter options.
 */

import NotificationsHub, { ADMIN_TYPE_FILTERS } from "@/components/notifications/NotificationsHub";

const AdminNotificationsCenter = () => {
  return (
    <NotificationsHub
      typeFilters={ADMIN_TYPE_FILTERS}
      showBackButton={false}
      showDetails={true}
    />
  );
};

export default AdminNotificationsCenter;
