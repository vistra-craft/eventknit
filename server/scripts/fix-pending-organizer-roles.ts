/**
 * Migration Script: Fix Pending Organizer Roles
 * 
 * This script finds all users who:
 * - Have ORGANIZER role
 * - Have PENDING_APPROVAL status
 * - Have NO approved events
 * 
 * And downgrades them back to ATTENDEE role.
 * They will be upgraded back to ORGANIZER when their first event is approved.
 */

import { prisma } from '../src/config/database.js';
import { UserRole, UserStatus, EventStatus } from '@prisma/client';
import { logger } from '../src/utils/logger.js';

async function fixPendingOrganizerRoles() {
  try {
    logger.info('Starting migration: Fix pending organizer roles');

    // Find all users with ORGANIZER role and PENDING_APPROVAL status
    const pendingOrganizers = await prisma.user.findMany({
      where: {
        role: UserRole.ORGANIZER,
        status: UserStatus.PENDING_APPROVAL,
      },
      include: {
        eventsCreated: {
          where: {
            status: EventStatus.APPROVED,
            deletedAt: null,
          },
        },
      },
    });

    logger.info(`Found ${pendingOrganizers.length} pending organizers to check`);

    let downgraded = 0;
    let skipped = 0;

    for (const user of pendingOrganizers) {
      // If user has any approved events, they should stay as ORGANIZER
      if (user.eventsCreated.length > 0) {
        logger.info(
          `Skipping user ${user.id} (${user.email}) - has ${user.eventsCreated.length} approved events`,
        );
        skipped++;
        continue;
      }

      // Downgrade to ATTENDEE
      await prisma.user.update({
        where: { id: user.id },
        data: {
          role: UserRole.ATTENDEE,
        },
      });

      logger.info(
        `Downgraded user ${user.id} (${user.email}) from ORGANIZER to ATTENDEE (pending approval, no approved events)`,
      );
      downgraded++;
    }

    logger.info(`Migration complete: ${downgraded} users downgraded, ${skipped} users skipped`);
    
    return {
      total: pendingOrganizers.length,
      downgraded,
      skipped,
    };
  } catch (error) {
    logger.error('Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
fixPendingOrganizerRoles()
  .then((result) => {
    console.log('\n✅ Migration successful!');
    console.log(`Total checked: ${result.total}`);
    console.log(`Downgraded: ${result.downgraded}`);
    console.log(`Skipped: ${result.skipped}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });
