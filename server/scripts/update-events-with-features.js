#!/usr/bin/env node

/**
 * Script to update existing events with agenda and social links
 * This adds the new features to existing events
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Updating existing events with enhanced features...\n');

  // Find Tech Innovation Summit
  const techEvent = await prisma.event.findFirst({
    where: { title: 'Tech Innovation Summit 2025' }
  });

  if (techEvent) {
    await prisma.event.update({
      where: { id: techEvent.id },
      data: {
        socialLinks: {
          twitter: "https://twitter.com/techinnovsum",
          linkedin: "https://linkedin.com/company/tech-innovation-summit",
          website: "https://techinnovation2025.com",
          facebook: "https://facebook.com/techinnovationsummit"
        },
        speakers: [
          {
            name: "Dr. Sarah Chen",
            title: "Chief AI Scientist at TechCorp",
            bio: "Leading researcher in AI with 15+ years experience",
            image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400"
          },
          {
            name: "Alex Rodriguez",
            title: "VP of Machine Learning",
            bio: "Built ML systems serving millions of users",
            image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400"
          }
        ],
        agenda: [
          {
            title: "Registration & Welcome Coffee",
            description: "Check-in and networking",
            startTime: "08:00",
            endTime: "09:00",
            speakers: []
          },
          {
            title: "Keynote: The Future of Technology",
            description: "Opening keynote on tech trends and innovation",
            startTime: "09:00",
            endTime: "10:00",
            speakers: ["Dr. Sarah Chen"]
          },
          {
            title: "Panel: AI in Business",
            description: "Discussion on practical AI applications",
            startTime: "10:30",
            endTime: "12:00",
            speakers: ["Dr. Sarah Chen", "Alex Rodriguez"]
          },
          {
            title: "Lunch & Networking",
            description: "Catered lunch with networking opportunities",
            startTime: "12:00",
            endTime: "13:30",
            speakers: []
          },
          {
            title: "Workshop: Innovation Strategies",
            description: "Hands-on workshop on driving innovation",
            startTime: "14:00",
            endTime: "16:00",
            speakers: ["Alex Rodriguez"]
          }
        ],
        exhibitors: [
          {
            name: "TechVentures Inc",
            description: "Leading tech infrastructure provider",
            booth: "A1"
          },
          {
            name: "Innovation Labs",
            description: "R&D and prototyping services",
            booth: "A2"
          }
        ]
      }
    });
    console.log(`✅ Updated: Tech Innovation Summit 2025`);
    console.log(`   Added: 5 agenda items, 2 speakers, 4 social links, 2 exhibitors\n`);
  }

  // Find Digital Marketing Masterclass
  const marketingEvent = await prisma.event.findFirst({
    where: { title: 'Digital Marketing Masterclass' }
  });

  if (marketingEvent) {
    await prisma.event.update({
      where: { id: marketingEvent.id },
      data: {
        socialLinks: {
          linkedin: "https://linkedin.com/company/digital-marketing-academy",
          instagram: "https://instagram.com/digitalmarketingpro",
          twitter: "https://twitter.com/digimarketclass",
          website: "https://digitalmarketingmasterclass.com"
        },
        speakers: [
          {
            name: "Emma Williams",
            title: "Digital Marketing Strategist",
            bio: "15 years of experience helping brands grow online",
            image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400"
          },
          {
            name: "David Chen",
            title: "SEO Expert",
            bio: "Ranked 100+ websites on Google's first page",
            image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400"
          }
        ],
        agenda: [
          {
            title: "Welcome & Introduction",
            description: "Course overview and networking",
            startTime: "09:00",
            endTime: "09:30",
            speakers: []
          },
          {
            title: "SEO Fundamentals",
            description: "Learn the basics of search engine optimization",
            startTime: "09:30",
            endTime: "11:00",
            speakers: ["David Chen"]
          },
          {
            title: "Coffee Break",
            description: "Refreshments and networking",
            startTime: "11:00",
            endTime: "11:15",
            speakers: []
          },
          {
            title: "Social Media Marketing",
            description: "Strategies for growing your brand on social platforms",
            startTime: "11:15",
            endTime: "13:00",
            speakers: ["Emma Williams"]
          },
          {
            title: "Lunch Break",
            description: "Lunch provided",
            startTime: "13:00",
            endTime: "14:00",
            speakers: []
          },
          {
            title: "Content Strategy Workshop",
            description: "Hands-on session creating a content plan",
            startTime: "14:00",
            endTime: "16:00",
            speakers: ["Emma Williams", "David Chen"]
          },
          {
            title: "Q&A and Wrap-up",
            description: "Questions and closing remarks",
            startTime: "16:00",
            endTime: "16:30",
            speakers: ["Emma Williams"]
          }
        ]
      }
    });
    console.log(`✅ Updated: Digital Marketing Masterclass`);
    console.log(`   Added: 7 agenda items, 2 speakers, 4 social links\n`);
  }

  console.log('✨ Update complete!\n');
  console.log('📋 Enhanced Event Names:');
  console.log('   1. Tech Innovation Summit 2025');
  console.log('   2. Digital Marketing Masterclass\n');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
