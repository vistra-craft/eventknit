#!/usr/bin/env node

/**
 * Script to seed 2 events with agenda, speakers, and social links
 * Usage: node scripts/seed-enhanced-events.js
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

async function main() {
  console.log('🌱 Seeding enhanced events with agenda and social links...\n');

  // Get organizers
  const organizers = await prisma.user.findMany({
    where: { role: UserRole.ORGANIZER },
    take: 2
  });

  if (organizers.length < 2) {
    console.error('❌ Not enough organizers found. Please run seed-dummy-data.js first.');
    process.exit(1);
  }

  const enhancedEvents = [
    {
      title: "AI & Machine Learning Conference 2025",
      description: "Join us for a comprehensive exploration of AI, Machine Learning, and the future of technology. Network with industry leaders, attend workshops, and witness groundbreaking innovations.",
      fullDescription: "This premier AI conference brings together thought leaders, researchers, and practitioners from around the globe. Explore cutting-edge advancements in machine learning, deep learning, natural language processing, and computer vision. Participate in hands-on workshops, hear from keynote speakers at top tech companies, and network with peers pushing the boundaries of AI innovation.",
      category: "Technology",
      image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=80",
      price: 250.00,
      currency: "USD",
      venue: "Tech Innovation Hub",
      location: "San Francisco, CA",
      capacity: 500,
      isFree: false,
      eventType: EventType.IN_PERSON,
      status: EventStatus.PUBLISHED,
      organizerId: organizers[0].id,
      tags: ["AI", "Machine Learning", "Technology", "Innovation", "Networking"],
      socialLinks: {
        twitter: "https://twitter.com/aimlconf",
        linkedin: "https://linkedin.com/company/aiml-conference",
        website: "https://aimlconf2025.example.com",
        facebook: "https://facebook.com/aimlconference"
      },
      speakers: [
        {
          name: "Dr. Sarah Chen",
          title: "Chief AI Scientist at TechCorp",
          bio: "Dr. Chen is a leading researcher in deep learning with over 15 years of experience. She has published 50+ papers and holds multiple patents in AI.",
          image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80"
        },
        {
          name: "Alex Rodriguez",
          title: "VP of Machine Learning at DataCo",
          bio: "Alex leads ML initiatives at DataCo and has built production ML systems serving millions of users.",
          image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80"
        },
        {
          name: "Prof. James Liu",
          title: "Professor at MIT",
          bio: "Professor Liu teaches AI at MIT and has been recognized with multiple awards for his contributions to computer vision.",
          image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80"
        }
      ],
      agenda: [
        {
          title: "Registration & Welcome Coffee",
          description: "Check-in and networking with fellow attendees",
          startTime: "08:00",
          endTime: "09:00",
          speakers: []
        },
        {
          title: "Keynote: The Future of AI",
          description: "Opening keynote exploring the trajectory of AI development and its societal impact",
          startTime: "09:00",
          endTime: "10:00",
          speakers: ["Dr. Sarah Chen"]
        },
        {
          title: "Workshop: Building Production ML Systems",
          description: "Hands-on workshop covering MLOps, model deployment, and monitoring",
          startTime: "10:30",
          endTime: "12:30",
          speakers: ["Alex Rodriguez"]
        },
        {
          title: "Lunch & Networking",
          description: "Catered lunch with networking opportunities",
          startTime: "12:30",
          endTime: "14:00",
          speakers: []
        },
        {
          title: "Panel: Ethics in AI",
          description: "Discussion on responsible AI development and ethical considerations",
          startTime: "14:00",
          endTime: "15:30",
          speakers: ["Dr. Sarah Chen", "Prof. James Liu"]
        },
        {
          title: "Deep Dive: Computer Vision Advances",
          description: "Technical session on recent breakthroughs in computer vision",
          startTime: "16:00",
          endTime: "17:30",
          speakers: ["Prof. James Liu"]
        }
      ],
      exhibitors: [
        {
          name: "TechVentures Inc",
          description: "Leading AI infrastructure provider",
          booth: "A1"
        },
        {
          name: "DataCloud Solutions",
          description: "Cloud-native ML platform for enterprises",
          booth: "A2"
        }
      ]
    },
    {
      title: "Sustainable Business Summit 2025",
      description: "Driving sustainability in business. Learn strategies for building eco-friendly, profitable businesses from industry pioneers.",
      fullDescription: "The Sustainable Business Summit is where environmental responsibility meets business innovation. Discover how leading companies are integrating sustainability into their core operations while maintaining profitability. Hear success stories, learn practical strategies, and connect with like-minded business leaders committed to creating a sustainable future.",
      category: "Business",
      image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1200&q=80",
      price: 180.00,
      currency: "USD",
      venue: "Green Convention Center",
      location: "Seattle, WA",
      capacity: 300,
      isFree: false,
      eventType: EventType.HYBRID,
      status: EventStatus.PUBLISHED,
      organizerId: organizers[1].id,
      tags: ["Sustainability", "Business", "Environment", "Green Energy", "ESG"],
      socialLinks: {
        linkedin: "https://linkedin.com/company/sustainable-biz-summit",
        twitter: "https://twitter.com/sustbizsum",
        instagram: "https://instagram.com/sustainablebusinesssummit",
        website: "https://sustainablebiz2025.example.com"
      },
      speakers: [
        {
          name: "Emma Thompson",
          title: "CEO of GreenTech Industries",
          bio: "Emma has led GreenTech to become a billion-dollar sustainable energy company while maintaining carbon neutrality.",
          image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80"
        },
        {
          name: "Michael Park",
          title: "Sustainability Consultant",
          bio: "Michael advises Fortune 500 companies on ESG strategies and has helped reduce carbon emissions by over 1M tons.",
          image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80"
        }
      ],
      agenda: [
        {
          title: "Opening Remarks & Breakfast",
          description: "Welcome and sustainable breakfast buffet",
          startTime: "08:30",
          endTime: "09:30",
          speakers: []
        },
        {
          title: "Keynote: Building a Sustainable Enterprise",
          description: "How GreenTech achieved profitability while staying carbon neutral",
          startTime: "09:30",
          endTime: "10:30",
          speakers: ["Emma Thompson"]
        },
        {
          title: "Workshop: ESG Reporting \u0026 Compliance",
          description: "Practical guide to ESG frameworks and reporting standards",
          startTime: "11:00",
          endTime: "12:30",
          speakers: ["Michael Park"]
        },
        {
          title: "Networking Lunch",
          description: "Locally-sourced, organic lunch with networking",
          startTime: "12:30",
          endTime: "14:00",
          speakers: []
        },
        {
          title: "Case Studies: Sustainability Success Stories",
          description: "Real-world examples of sustainable business transformations",
          startTime: "14:00",
          endTime: "15:30",
          speakers: ["Emma Thompson", "Michael Park"]
        },
        {
          title: "Q\u0026A and Closing",
          description: "Open forum and closing remarks",
          startTime: "16:00",
          endTime: "17:00",
          speakers: ["Emma Thompson"]
        }
      ],
      exhibitors: [
        {
          name: "Solar Innovations",
          description: "Cutting-edge solar panel technology",
          booth: "B1"
        },
        {
          name: "EcoPackaging Co",
          description: "100% biodegradable packaging solutions",
          booth: "B2"
        },
        {
          name: "Green Finance Partners",
          description: "Sustainable investment and financing",
          booth: "B3"
        }
      ],
      sponsors: [
        {
          name: "EcoBank",
          level: "Platinum"
        },
        {
          name: "Renewable Energy Corp",
          level: "Gold"
        }
      ]
    }
  ];

  // Calculate future dates
  const today = new Date();
  const eventDates = [
    new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
    new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)  // 30 days from now
  ];

  for (let i = 0; i < enhancedEvents.length; i++) {
    const template = enhancedEvents[i];
    const eventDate = eventDates[i];
    
    const eventData = {
      ...template,
      price: new Decimal(template.price),
      startDate: eventDate,
      endDate: eventDate,
      startTime: "09:00",
      endTime: "17:00",
      requirements: template.title.includes('AI') 
        ? "Laptop required for workshops, Basic understanding of programming recommended"
        : "Business attire recommended",
      ageRestriction: "18+",
      createdAt: new Date(),
      updatedAt: new Date()
    };

    try {
      const event = await prisma.event.create({
        data: eventData
      });
      console.log(`✅ Created: ${event.title}`);
      console.log(`   ID: ${event.id}`);
      console.log(`   Date: ${eventDate.toLocaleDateString()}`);
      console.log(`   Agenda items: ${template.agenda.length}`);
      console.log(`   Speakers: ${template.speakers.length}`);
      console.log(`   Social links: ${Object.keys(template.socialLinks).length}\n`);
    } catch (error) {
      console.error(`❌ Failed to create ${template.title}:`, error.message);
    }
  }

  console.log('\n✨ Seeding complete!\n');
  console.log('📋 Event Names:');
  console.log('   1. AI & Machine Learning Conference 2025');
  console.log('   2. Sustainable Business Summit 2025\n');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
