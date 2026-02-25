import { AttendingEventsView } from "@/components/organizer/events/AttendingEventsView";

const AttendingEventsPage = () => {
  return (
    <div className="space-y-0">
      <div className="sticky top-0 z-20 bg-background pb-4 pt-1">
        <div>
          <h1 className="text-page-title">Attending</h1>
          <p className="text-page-subtitle mt-1">
            Events you're registered to attend
          </p>
        </div>
      </div>
      <AttendingEventsView />
    </div>
  );
};

export default AttendingEventsPage;
