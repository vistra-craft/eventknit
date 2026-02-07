#!/usr/bin/env node

/**
 * Script to seed 10 events for existing organizers
 * Usage: node scripts/seed-events.js
 */

import { PrismaClient, EventStatus, EventType, UserRole } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const env = process.env.NODE_ENV || 'production';
const envPath = path.resolve(__dirname, '..', `.env.${env}`);
dotenv.config({ path: envPath });
dotenv.config(); // Also load .env for fallback

const prisma = new PrismaClient({
  log: ['error'],
});

const eventTemplates = [
  {
    title: "Tech Innovation Summit 2025",
    description: "Join industry leaders to discuss the future of technology, AI, and sustainable innovation. Network with professionals and discover the latest trends.",
    category: "Technology",
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1000&q=80",
    price: 150.00,
    venue: "Grand Convention Center",
    location: "Nairobi, Kenya"
  },
  {
    title: "Summer Music Festival",
    description: "A three-day extravaganza featuring top artists from around the globe. Experience music, food, and art in an open-air setting.",
    category: "Music",
    image: "https://images.unsplash.com/photo-1459749411177-2a296581dca1?auto=format&fit=crop&w=1000&q=80",
    price: 50.00,
    venue: "Uhuru Gardens",
    location: "Nairobi, Kenya"
  },
  {
    title: "Digital Marketing Masterclass",
    description: "Learn actionable strategies to grow your brand online. Covers SEO, social media marketing, and content strategy.",
    category: "Business",
    image: "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1000&q=80",
    price: 75.00,
    venue: "Innovation Hub",
    location: "Westlands, Nairobi"
  },
  {
    title: "Contemporary Art Exhibition",
    description: "Showcasing works from emerging local artists. A journey through modern expressionism and abstract art.",
    category: "Arts",
    image: "https://images.unsplash.com/photo-1460661619277-d6db9268e435?auto=format&fit=crop&w=1000&q=80",
    price: 20.00,
    venue: "National Museum",
    location: "Nairobi, Kenya"
  },
  {
    title: "Startup Pitch Night",
    description: "Watch 10 startups pitch their ideas to a panel of investors. Great networking opportunity for entrepreneurs.",
    category: "Business",
    image: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=1000&q=80",
    price: 0.00,
    venue: "The Nexus",
    location: "Kilimani, Nairobi"
  },
  {
    title: "Wellness & Yoga Retreat",
    description: "A day of relaxation, meditation, and yoga. Reconnect with your inner self in a serene environment.",
    category: "Health",
    image: "https://images.unsplash.com/photo-1544367563-12123d8965cd?auto=format&fit=crop&w=1000&q=80",
    price: 40.00,
    venue: "Karura Forest",
    location: "Nairobi, Kenya"
  },
  {
    title: "Culinary Arts Workshop",
    description: "Hands-on cooking class with a celebrity chef. Learn to prepare gourmet meals at home.",
    category: "Food",
    image: "https://images.unsplash.com/photo-1556910103-1c02745a30bf?auto=format&fit=crop&w=1000&q=80",
    price: 100.00,
    venue: "Culinary Institute",
    location: "Karen, Nairobi"
  },
  {
    title: "Charity Gala Dinner",
    description: "An evening of elegance to support local education initiatives. Dinner, entertainment, and auction included.",
    category: "Charity",
    image: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1000&q=80",
    price: 200.00,
    venue: "Villa Rosa Kempinski",
    location: "Nairobi, Kenya"
  },
  {
    title: "Future of AI Conference",
    description: "Exploring the impact of Artificial Intelligence on various industries. Keynotes, panels, and demos.",
    category: "Technology",
    image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1000&q=80",
    price: 120.00,
    venue: "Radisson Blu",
    location: "Upper Hill, Nairobi"
  },
  {
    title: "Photography Walk",
    description: "Join us for a guided photography walk through the city's historic districts. All skill levels welcome.",
    category: "Arts",
    image: "https://images.unsplash.com/photo-1552168324-d612d77725e3?auto=format&fit=crop&w=1000&q=80",
    price: 15.00,
    venue: "CBD",
    location: "Nairobi, Kenya"
  }
];

async function seedEvents() {
  try {
    console.log('🌱 Seeding events...');
    console.log(`📊 Environment: ${env}`);
    
    await prisma.$connect();

    // 1. Get Organizers
    const organizers = await prisma.user.findMany({
      where: { role: UserRole.ORGANIZER },
      take: 5,
      orderBy: { createdAt: 'desc' }
    });

    if (organizers.length === 0) {
      console.error('❌ No organizers found! Please run seed-dummy-data.js first.');
      process.exit(1);
    }

    console.log(`✅ Found ${organizers.length} organizers.`);

    let eventCount = 0;

    // 2. Create Events
    for (let i = 0; i < eventTemplates.length; i++) {
      const template = eventTemplates[i];
      // Distribute events among organizers (round-robin)
      const organizer = organizers[i % organizers.length];

      // Set date to be in the future (randomly between 7 and 120 days from now)
      // This ensures all events are upcoming and spread across the next 4 months
      const daysToAdd = Math.floor(Math.random() * 113) + 7; // 7 to 120 days
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + daysToAdd);
      startDate.setHours(9, 0, 0, 0); // 9:00 AM

      const endDate = new Date(startDate);
      endDate.setHours(17, 0, 0, 0); // 5:00 PM

      const isFree = template.price === 0;
      
      // Build ticket types array matching the backend format
      // Backend expects: { name, price, quantity?, features?, originalPrice?, discountLabel?, isComplementary?, requiresInvitation?, availableFrom?, availableUntil? }
      const ticketTypes = isFree 
        ? [
            {
              name: "Free Admission",
              price: 0,
              quantity: 200,
              features: [],
              isComplementary: false,
              requiresInvitation: false
            }
          ]
        : [
            {
              name: "General Admission",
              price: template.price,
              quantity: 200,
              features: [],
              isComplementary: false,
              requiresInvitation: false
            }
          ];

      // Determine single price if all tickets have same price
      const singlePrice = !isFree && ticketTypes.length === 1 
        ? ticketTypes[0].price 
        : undefined;

      // Create the event
      await prisma.event.create({
        data: {
          title: template.title,
          description: template.description,
          fullDescription: template.description + " This is a detailed description of the event, providing more context and information for attendees.",
          category: template.category,
          tags: [template.category, "Event", "Nairobi"],
          startDate: startDate,
          endDate: endDate,
          startTime: "09:00",
          endTime: "17:00",
          venue: template.venue,
          location: template.location,
          address: `${template.venue}, ${template.location}`,
          isOnline: false,
          onlineLink: null,
          isFree: isFree,
          price: singlePrice ? new Decimal(singlePrice) : (isFree ? new Decimal(0) : null),
          currency: "KES",
          ticketTypes: ticketTypes.length > 0 ? ticketTypes : undefined,
          capacity: 200,
          availableSlots: 200,
          image: template.image,
          images: [],
          type: EventType.PUBLIC,
          status: EventStatus.APPROVED, // Auto-approve for visibility
          requirements: [],
          ageRestriction: null,
          duration: null,
          speakers: null,
          sponsors: null,
          faqs: null,
          registrationFields: null,
          organizerId: organizer.id,
          createdBy: organizer.id,
          approvedAt: new Date(),
          approvedBy: "system-seed"
        }
      });

      console.log(`   ✅ Created event: "${template.title}" for ${organizer.email}`);
      eventCount++;
    }

    console.log(`\n✅ Successfully seeded ${eventCount} events!`);

  } catch (error) {
    console.error('❌ Error seeding events:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedEvents().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
