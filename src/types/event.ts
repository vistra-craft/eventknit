
export interface RegistrationField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'select' | 'radio' | 'checkbox' | 'textarea';
  required: boolean;
  options?: string[];
  placeholder?: string;
}

export interface RegistrationData {
  [key: string]: string | string[] | boolean;
}

export interface EventData {
  id: string;
  title: string;
  description: string;
  fullDescription: string;
  date: string;
  time: string;
  endTime?: string;
  venue: string;
  location: string;
  image: string;
  price: number;
  category: string;
  rating: number;
  duration: string;
  ageRestriction?: string;
  isPrivate: boolean;
  availableSlots: number;
  totalSlots: number;
  organizer: string;
  registrationFields: RegistrationField[];
  faqs?: Array<{ question: string; answer: string }>;
  speakers?: Array<{ name: string; title: string; bio: string; image?: string }>;
  sponsors?: Array<{ name: string; level: 'gold' | 'silver' | 'bronze'; logo: string }>;
  requirements?: string[];
  registrationDeadline?: string;
  coordinates?: { lat: number; lng: number };
  ticketTypes?: Array<{ name: string; price: number; features: string[] }>;
}

export interface PaymentSummary {
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
}
