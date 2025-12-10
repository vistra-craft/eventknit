#!/usr/bin/env node
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({ log: ['query', 'error'] });

async function main() {
  console.log('Testing event update...\n');

  const event = await prisma.event.findFirst({
    where: { title: 'Tech Innovation Summit 2025' },
    select: { id: true, title: true }
  });

  if (!event) {
    console.log('Event not found!');
    return;
  }

  console.log(`Found event: ${event.title}`);
  console.log(`ID: ${event.id}\n`);
  
  try {
    const updated = await prisma.event.update({
      where: { id: event.id },
      data: {
        socialLinks: {
          twitter: "https://twitter.com/test"
        }
      }
    });
    console.log('✅ Successfully updated event with social links');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

main()
  .finally(() => prisma.$disconnect());
