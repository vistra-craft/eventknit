#!/usr/bin/env node
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Search for the specific events
  const aiEvent = await prisma.event.findFirst({
    where: { title: { contains: 'AI & Machine Learning' } },
    select: { title: true, socialLinks: true, agenda: true, speakers: true }
  });
  
  const sustainableEvent = await prisma.event.findFirst({
    where: { title: { contains: 'Sustainable Business' } },
    select: { title: true, socialLinks: true, agenda: true, speakers: true }
  });
  
  console.log('\n=== Searching for Enhanced Events ===\n');
  
  if (aiEvent) {
    console.log('✅ Found: AI & Machine Learning Conference');
    console.log(`   Has agenda: ${!!aiEvent.agenda && Array.isArray(aiEvent.agenda) ? aiEvent.agenda.length + ' items' : 'No'}`);
    console.log(`   Has social links: ${!!aiEvent.socialLinks ? 'Yes' : 'No'}`);
    console.log(`   Has speakers: ${!!aiEvent.speakers && Array.isArray(aiEvent.speakers) ? aiEvent.speakers.length + ' speakers' : 'No'}`);
  } else {
    console.log('❌ AI & Machine Learning Conference NOT FOUND');
  }
  
  if (sustainableEvent) {
    console.log('\n✅ Found: Sustainable Business Summit');
    console.log(`   Has agenda: ${!!sustainableEvent.agenda && Array.isArray(sustainableEvent.agenda) ? sustainableEvent.agenda.length + ' items' : 'No'}`);
    console.log(`   Has social links: ${!!sustainableEvent.socialLinks ? 'Yes' : 'No'}`);
    console.log(`   Has speakers: ${!!sustainableEvent.speakers && Array.isArray(sustainableEvent.speakers) ? sustainableEvent.speakers.length + ' speakers' : 'No'}`);
  } else {
    console.log('\n❌ Sustainable Business Summit NOT FOUND');
  }
  
  if (!aiEvent && !sustainableEvent) {
    console.log('\n⚠️  Events not found. Need to fix and re-run seed script.\n');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
