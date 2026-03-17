// Event Attendee View Components
export { EventAttendeeView } from './EventAttendeeView';
export { EventOverview } from './EventOverview';
export { EventAgenda } from './EventAgenda';
export { EventPeople } from './EventPeople';
export { EventMyBadge } from './EventMyBadge';
// Legacy exports kept for any remaining direct references
export { EventHome } from './EventHome';
export { EventSpeakers } from './EventSpeakers';
export { EventExhibitors } from './EventExhibitors';
export { EventMyEvent } from './EventMyEvent';

// Re-export types
export type {
  EventData,
  User,
  Speaker,
  Sponsor,
  Exhibitor,
  AgendaItem,
  SeatInfo,
} from './EventAttendeeView';
