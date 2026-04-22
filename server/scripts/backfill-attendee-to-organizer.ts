/**
 * Backfill: Upgrade ATTENDEE → ORGANIZER
 *
 * Finds all users with role=ATTENDEE who have at least one approved event
 * and upgrades their role to ORGANIZER. This covers users whose events were
 * approved before the auto-upgrade logic was fixed to handle already-ACTIVE
 * attendees.
 *
 * Safe to run multiple times (idempotent).
 *
 * Run with:
 *   npx dotenv-cli -e .env.development -- npx tsx scripts/backfill-attendee-to-organizer.ts
 */

import { prisma } from '../src/config/database.js';
import { UserRole, EventStatus } from '@prisma/client';
import { logger } from '../src/utils/logger.js';

async function backfillAttendeeToOrganizer() {
  try {
    logger.info('Starting ATTENDEE → ORGANIZER backfill...');

    // Find all ATTENDEE users who have at least one approved, non-deleted event
    const attendeesWithApprovedEvents = await prisma.user.findMany({
      where: {
        role: UserRole.ATTENDEE,
        deletedAt: null,
        eventsCreated: {
          some: {
            status: EventStatus.APPROVED,
            deletedAt: null,
          },
        },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
        role: true,
        eventsCreated: {
          where: {
            status: EventStatus.APPROVED,
            deletedAt: null,
          },
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    console.log('\n=== ATTENDEE → ORGANIZER BACKFILL ===\n');

    if (attendeesWithApprovedEvents.length === 0) {
      console.log('✅ No users need upgrading. All good!');
      return { total: 0, upgraded: 0 };
    }

    console.log(`Found ${attendeesWithApprovedEvents.length} ATTENDEE user(s) with approved events:\n`);

    let upgraded = 0;

    for (const user of attendeesWithApprovedEvents) {
      console.log(`User: ${user.email}`);
      console.log(`  Name: ${user.firstName} ${user.lastName}`);
      console.log(`  Status: ${user.status}`);
      console.log(`  Current Role: ${user.role}`);
      console.log(`  Approved Events (${user.eventsCreated.length}):`);
      for (const event of user.eventsCreated) {
        console.log(`    - "${event.title}" (${event.id})`);
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { role: UserRole.ORGANIZER },
      });

      console.log('  ✅ Upgraded to ORGANIZER\n');
      upgraded++;
    }

    console.log('=== SUMMARY ===');
    console.log(`Users found needing upgrade: ${attendeesWithApprovedEvents.length}`);
    console.log(`Successfully upgraded:       ${upgraded}`);

    return { total: attendeesWithApprovedEvents.length, upgraded };
  } catch (error) {
    logger.error('Backfill script failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

backfillAttendeeToOrganizer()
  .then(() => {
    console.log('\n✅ Backfill complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Backfill failed:', error);
    process.exit(1);
  });
