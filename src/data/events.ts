import concertImg from "@/assets/event-concert.jpg";
import comedyImg from "@/assets/event-comedy.jpg";
import sportsImg from "@/assets/event-sports.jpg";
import artImg from "@/assets/event-art.jpg";

export interface TicketType {
  name: string;
  price: number;
  features: string[];
}

export interface FAQ {
  question: string;
  answer: string;
}

export interface Speaker {
  name: string;
  title: string;
  bio: string;
  image?: string;
}

export interface Sponsor {
  name: string;
  level: 'gold' | 'silver' | 'bronze';
  logo: string;
}

// Helper function to ensure all events have required properties
const withDefaults = (event: Omit<EventItem, 'isPrivate' | 'faqs' | 'speakers' | 'sponsors' | 'requirements' | 'endTime' | 'registrationDeadline'> & 
  Partial<Pick<EventItem, 'isPrivate' | 'faqs' | 'speakers' | 'sponsors' | 'requirements' | 'endTime' | 'registrationDeadline'>>): EventItem => {
  const {
    id,
    title,
    image,
    date,
    time,
    venue,
    location,
    organizer,
    price,
    rating,
    category,
    description,
    fullDescription,
    duration,
    ageRestriction,
    ticketTypes = [],
    coordinates = { lat: 0, lng: 0 },
    isPrivate = false,
    faqs = [],
    speakers = [],
    sponsors = [],
    requirements = [],
    endTime = '',
    registrationDeadline = ''
  } = event;

  return {
    id,
    title,
    image,
    date,
    time,
    venue,
    location,
    organizer,
    price,
    rating,
    category,
    description,
    fullDescription,
    duration,
    ageRestriction,
    ticketTypes,
    coordinates,
    isPrivate,
    faqs,
    speakers,
    sponsors,
    requirements,
    endTime,
    registrationDeadline
  };
};

export interface EventItem {
  id: string;
  title: string;
  image: string;
  date: string;
  time: string;
  endTime?: string;
  venue: string;
  location: string;
  organizer: string;
  price: string; // display price
  rating: number;
  category: string;
  description: string;
  fullDescription: string;
  duration: string;
  ageRestriction: string;
  ticketTypes: TicketType[];
  coordinates: { lat: number; lng: number };
  isPrivate: boolean;
  registrationDeadline?: string;
  faqs: FAQ[];
  speakers: Speaker[];
  sponsors: Sponsor[];
  requirements: string[];
}

const baseDescription = "Get ready for an unforgettable experience packed with energy, world-class performances, and immersive production.";
const baseFullDescription = "Join thousands of fans for a night that blends cutting-edge visuals, incredible sound, and a lineup of acclaimed performers. Expect breathtaking moments and memories that last.";

export const events: EventItem[] = [
  withDefaults({
    id: "1",
    title: "Electric Nights Festival 2024",
    image: concertImg,
    date: "Dec 15, 2024",
    time: "8:00 PM",
    endTime: "2:00 AM",
    venue: "Madison Square Garden",
    location: "New York, NY",
    organizer: "Live Nation",
    price: "$89",
    rating: 4.8,
    category: "Music",
    description: baseDescription,
    fullDescription: baseFullDescription,
    duration: "6 hours",
    isPrivate: false,
    registrationDeadline: "Dec 10, 2024",
    requirements: [
      "Valid ID required for age verification",
      "No outside food or drinks",
      "No professional cameras without permission"
    ],
    faqs: [
      {
        question: "What's the refund policy?",
        answer: "Tickets are non-refundable but can be transferred to another person up to 24 hours before the event."
      },
      {
        question: "Is there parking available?",
        answer: "Yes, there is paid parking available at the venue. We recommend carpooling or using public transportation."
      },
      {
        question: "What time should I arrive?",
        answer: "Doors open at 7:00 PM. We recommend arriving at least 30 minutes early to allow time for security checks."
      }
    ],
    speakers: [
      {
        name: "DJ Nova",
        title: "Headline Performer",
        bio: "International DJ and producer with over 10 years of experience in the electronic music scene."
      },
      {
        name: "Sarah Chen",
        title: "Visual Artist",
        bio: "Award-winning visual artist known for creating immersive digital experiences at major music festivals worldwide."
      }
    ],
    sponsors: [
      {
        name: "Red Bull",
        level: "gold",
        logo: "https://logo.clearbit.com/redbull.com"
      },
      {
        name: "Beats by Dre",
        level: "silver",
        logo: "https://logo.clearbit.com/beatsbydre.com"
      },
      {
        name: "Urban Outfitters",
        level: "bronze",
        logo: "https://logo.clearbit.com/urbanoutfitters.com"
      }
    ],
    ageRestriction: "18+",
    ticketTypes: [
      { name: "General Admission", price: 89, features: ["Access to main stage", "Food court access", "Merchandise discount"] },
      { name: "VIP Experience", price: 199, features: ["Priority entry", "VIP viewing area", "Complimentary drinks", "Artist meet & greet", "VIP lounge access"] },
      { name: "Platinum Package", price: 399, features: ["All VIP features", "Backstage access", "Private bar", "Dedicated concierge", "Premium gift bag"] }
    ],
    coordinates: { lat: 40.7505, lng: -73.9934 },
  }),
  withDefaults({
    id: "2",
    title: "Comedy Central Live",
    image: comedyImg,
    date: "Dec 20, 2024",
    time: "7:30 PM",
    venue: "Comedy Club",
    location: "Los Angeles, CA",
    organizer: "Funny Business",
    price: "$45",
    rating: 4.6,
    category: "Comedy",
    description: baseDescription,
    fullDescription: baseFullDescription,
    duration: "2 hours",
    ageRestriction: "16+",
    ticketTypes: [
      { name: "Standard", price: 45, features: ["Seating", "Bar access"] },
      { name: "Front Row", price: 79, features: ["Front row seats", "Meet the comics"] },
    ],
    coordinates: { lat: 34.1016, lng: -118.3269 },
  }),
  withDefaults({
    id: "3",
    title: "NBA Finals Game 7",
    image: sportsImg,
    date: "Dec 18, 2024",
    time: "9:00 PM",
    venue: "Crypto.com Arena",
    location: "Los Angeles, CA",
    organizer: "NBA",
    price: "$299",
    rating: 4.9,
    category: "Sports",
    description: baseDescription,
    fullDescription: baseFullDescription,
    duration: "3 hours",
    ageRestriction: "All ages",
    isPrivate: false,
    faqs: [
      {
        question: "What's the refund policy?",
        answer: "Tickets are non-refundable but can be transferred to another person up to 24 hours before the event."
      },
      {
        question: "Is there parking available?",
        answer: "Yes, there is paid parking available at the venue. We recommend carpooling or using public transportation."
      },
      {
        question: "What time should I arrive?",
        answer: "Doors open at 8:00 PM. We recommend arriving at least 30 minutes early to allow time for security checks."
      }
    ],
    speakers: [],
    sponsors: [
      {
        name: "Red Bull",
        level: "gold",
        logo: "https://logo.clearbit.com/redbull.com"
      },
      {
        name: "Beats by Dre",
        level: "silver",
        logo: "https://logo.clearbit.com/beatsbydre.com"
      },
      {
        name: "Urban Outfitters",
        level: "bronze",
        logo: "https://logo.clearbit.com/urbanoutfitters.com"
      }
    ],
    requirements: [
      "Valid ID required for age verification",
      "No outside food or drinks",
      "No professional cameras without permission"
    ],
    ticketTypes: [
      { name: "Upper Bowl", price: 299, features: ["Arena entry", "Merch store access"] },
      { name: "Lower Bowl", price: 499, features: ["Lower bowl seats", "Exclusive lounge"] },
      { name: "Courtside", price: 1299, features: ["Courtside seats", "On-court photo"] },
    ],
    coordinates: { lat: 34.043, lng: -118.2673 },
  }),
  withDefaults({
    id: "4",
    title: "Modern Art Exhibition",
    image: artImg,
    date: "Dec 22, 2024",
    time: "6:00 PM",
    venue: "Museum of Modern Art",
    location: "New York, NY",
    organizer: "MoMA",
    price: "$25",
    rating: 4.4,
    category: "Arts",
    description: baseDescription,
    fullDescription: baseFullDescription,
    duration: "4 hours",
    ageRestriction: "All ages",
    ticketTypes: [
      { name: "General Admission", price: 25, features: ["Exhibit access", "Audio guide"] },
      { name: "Guided Tour", price: 45, features: ["Guided tour", "Exclusive exhibit room"] },
    ],
    coordinates: { lat: 40.7614, lng: -73.9776 },
  }),
  withDefaults({
    id: "5",
    title: "Synthwave Dreams Concert",
    image: concertImg,
    date: "Dec 25, 2024",
    time: "10:00 PM",
    venue: "Red Rocks Amphitheatre",
    location: "Morrison, CO",
    organizer: "Mountain Music",
    price: "$125",
    rating: 4.7,
    category: "Music",
    description: baseDescription,
    fullDescription: baseFullDescription,
    duration: "3.5 hours",
    ageRestriction: "16+",
    ticketTypes: [
      { name: "General Admission", price: 125, features: ["Standing area", "Merch discount"] },
      { name: "VIP", price: 249, features: ["VIP deck", "Priority bar"] },
    ],
    coordinates: { lat: 39.6654, lng: -105.2057 },
  }),
  withDefaults({
    id: "6",
    title: "Stand-Up Showdown",
    image: comedyImg,
    date: "Dec 28, 2024",
    time: "8:30 PM",
    venue: "Apollo Theater",
    location: "New York, NY",
    organizer: "Comedy Kings",
    price: "$65",
    rating: 4.5,
    category: "Comedy",
    description: baseDescription,
    fullDescription: baseFullDescription,
    duration: "2 hours",
    ageRestriction: "18+",
    ticketTypes: [
      { name: "Standard", price: 65, features: ["Seating", "Bar access"] },
      { name: "Premium", price: 95, features: ["Front seating", "Meet & greet"] },
    ],
    coordinates: { lat: 40.81, lng: -73.9496 },
  }),
  withDefaults({
    id: "7",
    title: "World Cup Final Watch Party",
    image: sportsImg,
    date: "Dec 30, 2024",
    time: "3:00 PM",
    venue: "Sports Arena",
    location: "Miami, FL",
    organizer: "Sports Central",
    price: "$35",
    rating: 4.3,
    category: "Sports",
    description: baseDescription,
    fullDescription: baseFullDescription,
    duration: "4 hours",
    ageRestriction: "All ages",
    ticketTypes: [
      { name: "General", price: 35, features: ["Big screen access", "Food court"] },
      { name: "VIP Table", price: 120, features: ["Private table", "Bottle service"] },
    ],
    coordinates: { lat: 25.7617, lng: -80.1918 },
  }),
  withDefaults({
    id: "8",
    title: "Contemporary Dance Performance",
    image: artImg,
    date: "Jan 2, 2025",
    time: "7:00 PM",
    venue: "Lincoln Center",
    location: "New York, NY",
    organizer: "Dance Company",
    price: "$85",
    rating: 4.6,
    category: "Arts",
    description: baseDescription,
    fullDescription: baseFullDescription,
    duration: "2 hours",
    ageRestriction: "All ages",
    ticketTypes: [
      { name: "Balcony", price: 85, features: ["Balcony seating", "Program booklet"] },
      { name: "Orchestra", price: 149, features: ["Orchestra seating", "Backstage talk"] },
    ],
    coordinates: { lat: 40.7725, lng: -73.9835 },
  })
];

export const eventsById = events.reduce<Record<string, EventItem>>((acc, ev) => {
  acc[ev.id] = ev;
  return acc;
}, {});