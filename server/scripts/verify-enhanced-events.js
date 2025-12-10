#!/usr/bin/env node
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const techEvent = await prisma.event.findFirst({
    where: { title: 'Tech Innovation Summit 2025' }
  });
  
  const marketingEvent = await prisma.event.findFirst({
    where: { title: 'Digital Marketing Masterclass' }
  });
  
  console.log('\n=== Verification Results ===\n');
  
  if (techEvent) {
    console.log('✅ Tech Innovation Summit 2025:');
    console.log(`   - Has socialLinks: ${!!techEvent.socialLinks}`);
    console.log(`   - Has agenda: ${!!techEvent.agenda}`);
    console.log(`   - Has speakers: ${!!techEvent.speakers}`);
    console.log(`   - Has exhibitors: ${!!techEvent.exhibitors}`);
  }
  
  if (marketingEvent) {
    console.log('\n✅ Digital Marketing Masterclass:');
    console.log(`   - Has socialLinks: ${!!marketingEvent.socialLinks}`);
    console.log(`   - Has agenda: ${!!marketingEvent.agenda}`);
    console.log(`   - Has speakers: ${!!marketingEvent.speakers}`);
  }
  
  console.log('\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
