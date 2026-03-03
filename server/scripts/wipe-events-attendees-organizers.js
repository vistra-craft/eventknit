#!/usr/bin/env node

/**
 * Wipe all events and delete all attendees + organizers.
 *
 * Usage: node scripts/wipe-events-attendees-organizers.js
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

const USER_ROLES_TO_DELETE = ['ORGANIZER', 'ATTENDEE'];
const SAFE_IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;

const getUserCounts = async () => {
  const [organizers, attendees] = await Promise.all([
    prisma.user.count({ where: { role: 'ORGANIZER' } }),
    prisma.user.count({ where: { role: 'ATTENDEE' } }),
  ]);

  return { organizers, attendees };
};

const getForeignKeyTargets = async () => {
  return prisma.$queryRaw`
    SELECT
      tc.table_name AS "tableName",
      kcu.column_name AS "columnName"
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND ccu.table_name = 'User'
      AND tc.table_schema = 'public'
      AND kcu.table_schema = 'public'
    ORDER BY tc.table_name, kcu.column_name;
  `;
};

async function main() {
  try {
    console.log('🧹 Wiping events, attendees, and organizers...');
    console.log(`📊 Environment: ${env}`);

    await prisma.$connect();

    const beforeEvents = await prisma.event.count();
    const beforeUsers = await getUserCounts();

    console.log(`
Before:
  Events: ${beforeEvents}
  Organizers: ${beforeUsers.organizers}
  Attendees: ${beforeUsers.attendees}
`);

    // Remove all events and anything referencing them.
    await prisma.$executeRawUnsafe('TRUNCATE "Event" CASCADE;');

    // Remove dependent rows that reference users in target roles.
    const fkTargets = await getForeignKeyTargets();

    const rolesSql = USER_ROLES_TO_DELETE.map(role => `'${role}'`).join(', ');

    for (const { tableName, columnName } of fkTargets) {
      // Skip the User table itself (not a FK target, but defensive).
      if (tableName === 'User') continue;

      if (!SAFE_IDENTIFIER.test(tableName) || !SAFE_IDENTIFIER.test(columnName)) {
        console.warn(`⚠️  Skipping unsafe identifier: ${tableName}.${columnName}`);
        continue;
      }
      const query = `DELETE FROM "${tableName}" WHERE "${columnName}" IN (SELECT id FROM "User" WHERE role IN (${rolesSql}));`;
      await prisma.$executeRawUnsafe(query);
    }

    // Delete organizers and attendees
    await prisma.user.deleteMany({
      where: { role: { in: USER_ROLES_TO_DELETE } },
    });

    const afterEvents = await prisma.event.count();
    const afterUsers = await getUserCounts();

    console.log(`
After:
  Events: ${afterEvents}
  Organizers: ${afterUsers.organizers}
  Attendees: ${afterUsers.attendees}
`);

    console.log('✅ Wipe complete.');
  } catch (error) {
    console.error('❌ Wipe failed:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
