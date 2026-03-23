import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { EventViewPills, type ViewType } from "@/components/organizer/events/EventViewPills";
import { EventsListView } from "@/components/organizer/events/EventsListView";
import { useOrganizerEvents, type EventView } from "@/hooks/useOrganizerEvents";
import EventTemplatesManagement from "./EventTemplatesManagement";
import EventDraftsManagement from "./EventDraftsManagement";

const EVENT_VIEWS: EventView[] = ["all", "upcoming", "past", "cancelled"];

function isEventView(view: string): view is EventView {
  return EVENT_VIEWS.includes(view as EventView);
}

function isValidView(view: string): view is ViewType {
  return ["all", "upcoming", "past", "cancelled", "templates", "drafts"].includes(view);
}

const UnifiedEventsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const viewParam = searchParams.get("view") || "all";
  const activeView: ViewType = isValidView(viewParam) ? viewParam : "all";

  // Track counts for pill badges — persisted separately so they don't disappear on view switch
  const [pillCounts, setPillCounts] = useState<Partial<Record<ViewType, number>>>({});

  // Only use the events hook for event views (not templates/drafts)
  const eventView: EventView = isEventView(activeView) ? activeView : "all";
  const eventsHook = useOrganizerEvents({ view: eventView });

  // Update counts when data loads for event views
  useEffect(() => {
    if (isEventView(activeView) && !eventsHook.loading && eventsHook.total >= 0) {
      setPillCounts((prev) => ({
        ...prev,
        [activeView]: eventsHook.total,
      }));
    }
  }, [activeView, eventsHook.loading, eventsHook.total]);

  const handleViewChange = useCallback(
    (view: ViewType) => {
      if (view === "all") {
        setSearchParams({}, { replace: true });
      } else {
        setSearchParams({ view }, { replace: true });
      }
    },
    [setSearchParams]
  );

  return (
    <div className="space-y-0">
      {/* Sticky Header Zone */}
      <div className="sticky top-0 z-20 bg-background pb-4 pt-1">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div>
            <h1 className="text-page-title">Events</h1>
            <p className="text-page-subtitle mt-1">
              Manage all your events in one place
            </p>
          </div>
          {/* Desktop Create Button */}
          <Link
            to="/organizer/events/create"
            className="hidden sm:inline-flex items-center bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2.5 rounded-lg font-medium transition-colors duration-200 shadow-sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Event
          </Link>
        </div>

        {/* Pill Navigation */}
        <EventViewPills
          activeView={activeView}
          onViewChange={handleViewChange}
          counts={pillCounts}
        />
      </div>

      {/* Content Area with Transitions */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeView}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
        >
          {activeView === "templates" ? (
            <EventTemplatesManagement embedded />
          ) : activeView === "drafts" ? (
            <EventDraftsManagement embedded />
          ) : (
            <EventsListView
              view={eventView}
              events={eventsHook.events}
              loading={eventsHook.loading}
              error={eventsHook.error}
              page={eventsHook.page}
              limit={eventsHook.limit}
              totalPages={eventsHook.totalPages}
              total={eventsHook.total}
              searchTerm={eventsHook.searchTerm}
              statusFilter={eventsHook.statusFilter}
              onPageChange={eventsHook.setPage}
              onLimitChange={eventsHook.setLimit}
              onSearchChange={eventsHook.setSearchTerm}
              onStatusFilterChange={eventsHook.setStatusFilter}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Mobile FAB */}
      <Link
        to="/organizer/events/create"
        className="sm:hidden fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center active:scale-95 transition-transform"
        aria-label="Create Event"
      >
        <Plus className="h-6 w-6" />
      </Link>
    </div>
  );
};

export default UnifiedEventsPage;
