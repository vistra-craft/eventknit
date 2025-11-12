# Event API Implementation Summary

## Overview

This document outlines the implementation of event management logic on the frontend following the same modern, scalable patterns used for authentication.

## Architecture Pattern

Following the authentication implementation pattern:

- **API Layer** (`lib/event-api.ts`) - Centralized API functions
- **Hooks** (`hooks/useEvents.ts`, `hooks/useEvent.ts`) - Custom React hooks for state management
- **Utilities** (`lib/event-utils.ts`) - Data transformation and formatting
- **Type Safety** - Full TypeScript support with proper interfaces

## Files Created

### 1. API Layer

**File**: `src/lib/event-api.ts`

**Features**:

- All event CRUD operations
- Event registration functions
- Admin functions (approve/reject)
- Type-safe interfaces matching backend
- Automatic data transformation

**Key Functions**:

- `getEvents(filters?)` - Fetch events with optional filters
- `getEventById(id)` - Fetch single event
- `createEvent(data)` - Create new event
- `updateEvent(id, data)` - Update event
- `deleteEvent(id)` - Delete event
- `registerForEvent(eventId, data)` - Register for event
- `getEventRegistrations(eventId)` - Get registrations (organizer)
- `cancelRegistration(registrationId)` - Cancel registration
- `approveEvent(eventId)` - Approve event (admin)
- `rejectEvent(eventId, reason)` - Reject event (admin)

### 2. Custom Hooks

#### `useEvents` Hook

**File**: `src/hooks/useEvents.ts`

**Purpose**: Manage multiple events with filtering and pagination

**Features**:

- Loading state management
- Error handling
- Automatic fetch on mount (optional)
- Refresh capability
- Filter support

**Usage**:

```tsx
const { events, isLoading, error, fetchEvents, refreshEvents } = useEvents();

// Fetch with filters
await fetchEvents({ status: EventStatus.APPROVED, limit: 20 });
```

#### `useEvent` Hook

**File**: `src/hooks/useEvent.ts`

**Purpose**: Manage a single event with CRUD operations

**Features**:

- Automatic fetch on mount (if eventId provided)
- Create, update, delete operations
- Registration functionality
- Loading and error states

**Usage**:

```tsx
const { event, isLoading, error, createEvent, updateEvent, deleteEvent } =
  useEvent(eventId);

// Create event
await createEvent(eventData);

// Update event
await updateEvent(eventId, updateData);
```

### 3. Utilities

**File**: `src/lib/event-utils.ts`

**Functions**:

- `formatEventDate(dateString)` - Format ISO date to readable string
- `formatEventTime(startTime, endTime?)` - Format time range
- `formatEventDateRange(startDate, endDate?)` - Format date range
- `transformEventData(backendEvent)` - Transform backend data to frontend format
- `transformEventsData(backendEvents)` - Transform array of events

**Purpose**: Bridge backend API format with frontend component expectations

## Files Updated

### 1. Event Types

**File**: `src/types/event.ts`

**Changes**:

- Updated `EventData` interface to match backend Prisma schema
- Added optional fields for backward compatibility
- Added computed fields (`organizerName`, `registrationCount`)
- Added legacy fields for component compatibility

### 2. Components Updated

#### EventGrid Component

**File**: `src/components/EventGrid.tsx`

**Changes**:

- Removed mock data
- Integrated `useEvents` hook
- Added loading states
- Added error handling
- Added filter functionality
- Fetches approved events by default

#### EventDetails Component

**File**: `src/pages/EventDetails.tsx`

**Changes**:

- Removed mock data
- Integrated `useEvent` hook
- Added loading state
- Added error handling
- Automatic fetch on mount with event ID

#### OrganizerEventGrid Component

**File**: `src/components/OrganizerEventGrid.tsx`

**Changes**:

- Removed mock data
- Integrated `useEvents` hook
- Filters events by organizer ID
- Uses authenticated user's ID
- Added loading/error states

## API Endpoints Used

### Public Endpoints

- `GET /api/v1/events` - List events (with filters)
- `GET /api/v1/events/:id` - Get event by ID

### Protected Endpoints

- `POST /api/v1/events` - Create event (ORGANIZER+)
- `PUT /api/v1/events/:id` - Update event (ORGANIZER+)
- `DELETE /api/v1/events/:id` - Delete event (ORGANIZER+)
- `POST /api/v1/events/:id/register` - Register for event (ATTENDEE+)
- `GET /api/v1/events/:id/registrations` - Get registrations (ORGANIZER+)
- `DELETE /api/v1/events/registrations/:id` - Cancel registration
- `POST /api/v1/events/:id/approve` - Approve event (ADMIN_STAFF+)
- `POST /api/v1/events/:id/reject` - Reject event (ADMIN_STAFF+)

## Features

### ✅ Implemented

1. **Event Listing** - Fetch and display events with filters
2. **Event Details** - View single event with all details
3. **Event Creation** - Create new events (via hook)
4. **Event Updates** - Update existing events (via hook)
5. **Event Deletion** - Delete events (via hook)
6. **Event Registration** - Register for events (via hook)
7. **Data Transformation** - Automatic backend-to-frontend transformation
8. **Loading States** - Proper loading indicators
9. **Error Handling** - Comprehensive error handling
10. **Type Safety** - Full TypeScript support

### 🔄 Backward Compatible

- Components continue to work with transformed data
- Legacy fields (`date`, `time`, `organizer`) are computed
- Existing component props remain unchanged

## Best Practices Followed

1. **Separation of Concerns**

   - API logic in `lib/`
   - State management in hooks
   - UI logic in components

2. **Reusability**

   - Hooks can be used across components
   - Utility functions are pure and testable

3. **Type Safety**

   - Full TypeScript coverage
   - Proper interfaces matching backend

4. **Error Handling**

   - Comprehensive error states
   - User-friendly error messages
   - Retry mechanisms

5. **Performance**
   - Automatic token refresh handled by API layer
   - Efficient data transformation
   - Proper memoization in hooks

## Usage Examples

### Fetching Events

```tsx
import { useEvents } from "@/hooks/useEvents";
import { EventStatus } from "@/lib/event-api";

function MyComponent() {
  const { events, isLoading, error, fetchEvents } = useEvents();

  useEffect(() => {
    fetchEvents({ status: EventStatus.APPROVED, limit: 10 });
  }, []);

  if (isLoading) return <Loading />;
  if (error) return <Error message={error} />;

  return <EventList events={events} />;
}
```

### Single Event Management

```tsx
import { useEvent } from "@/hooks/useEvent";

function EventPage({ eventId }: { eventId: string }) {
  const { event, isLoading, updateEvent, deleteEvent } = useEvent(eventId);

  const handleUpdate = async () => {
    await updateEvent(eventId, { title: "New Title" });
  };

  return <EventDetails event={event} onUpdate={handleUpdate} />;
}
```

### Creating Events

```tsx
import { useEvent } from "@/hooks/useEvent";

function CreateEventForm() {
  const { createEvent, isLoading } = useEvent();

  const handleSubmit = async (data: CreateEventData) => {
    const newEvent = await createEvent(data);
    navigate(`/events/${newEvent.id}`);
  };

  return <EventForm onSubmit={handleSubmit} />;
}
```

## Next Steps (Optional)

1. **Pagination** - Implement infinite scroll or pagination
2. **Caching** - Add React Query or SWR for caching
3. **Optimistic Updates** - Update UI before API confirmation
4. **Date Filtering** - Implement date range filters (when backend supports)
5. **Search** - Add search functionality
6. **Event Categories** - Filter by category dropdown

## Testing Checklist

- [ ] Events load correctly
- [ ] Event details display properly
- [ ] Loading states show during fetch
- [ ] Error states display correctly
- [ ] Filters work as expected
- [ ] Event creation works
- [ ] Event updates work
- [ ] Event deletion works
- [ ] Registration works
- [ ] Data transformation is correct

## Notes

- All API calls automatically benefit from token refresh (from auth implementation)
- Backend data is automatically transformed to match frontend expectations
- Components are backward compatible with existing code
- Follows the same patterns as authentication for consistency

