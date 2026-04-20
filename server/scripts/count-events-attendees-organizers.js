#!/usr/bin/env node

/**
 * Count events, organizers, and attendees.
 *
 * Usage: node scripts/count-events-attendees-organizers.js
 */

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const env = process.env.NODE_ENV || 'development';
const envPath = path.resolve(__dirname, '..', `.env.${env}`);
dotenv.config({ path: envPath });
dotenv.config();

const prisma = new PrismaClient({
  log: ['error'],
});

async function main() {
  try {
    console.log('📊 Counting events, organizers, and attendees...');
    console.log(`📊 Environment: ${env}`);

    await prisma.$connect();

    const [events, organizers, attendees] = await Promise.all([
      prisma.event.count(),
      prisma.user.count({ where: { role: 'ORGANIZER' } }),
      prisma.user.count({ where: { role: 'ATTENDEE' } }),
    ]);

    console.log(`
Counts:
  Events: ${events}
  Organizers: ${organizers}
  Attendees: ${attendees}
`);
  } catch (error) {
    console.error('❌ Count failed:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
