export interface TypeFilterOption {
  value: string;
  label: string;
}

export const ATTENDEE_TYPE_FILTERS: TypeFilterOption[] = [
  { value: "EVENT_REMINDER_24H", label: "Event Reminders" },
  { value: "EVENT_UPDATE", label: "Event Updates" },
  { value: "REGISTRATION_CONFIRMED", label: "Registrations" },
  { value: "PAYMENT_SUCCESS", label: "Payments" },
  { value: "SYSTEM_ANNOUNCEMENT", label: "System" },
];

export const ORGANIZER_TYPE_FILTERS: TypeFilterOption[] = [
  { value: "EVENT_REMINDER_24H", label: "Event Reminders" },
  { value: "EVENT_UPDATE", label: "Event Updates" },
  { value: "EVENT_APPROVED", label: "Event Approved" },
  { value: "EVENT_REJECTED", label: "Event Rejected" },
  { value: "REGISTRATION_CONFIRMED", label: "Registrations" },
  { value: "REGISTRATION_MILESTONE_50", label: "Registration Milestones" },
  { value: "CAPACITY_REACHED", label: "Capacity Alerts" },
  { value: "PAYMENT_RECEIVED", label: "Payments" },
  { value: "REFUND_PROCESSED", label: "Refunds" },
  { value: "SYSTEM_ANNOUNCEMENT", label: "System Announcements" },
];

export const ADMIN_TYPE_FILTERS: TypeFilterOption[] = [
  { value: "EVENT_REMINDER_24H", label: "Event Reminders" },
  { value: "EVENT_UPDATE", label: "Event Updates" },
  { value: "EVENT_APPROVED", label: "Event Approved" },
  { value: "EVENT_REJECTED", label: "Event Rejected" },
  { value: "REGISTRATION_CONFIRMED", label: "Registrations" },
  { value: "PAYMENT_SUCCESS", label: "Payments" },
  { value: "SYSTEM_ANNOUNCEMENT", label: "System Announcements" },
  { value: "SECURITY_ALERT", label: "Security Alerts" },
  { value: "STAFF_ASSIGNED_TO_EVENT", label: "Staff Assignments" },
];
