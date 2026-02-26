/**
 * Check and Fix Organizer Roles
 * 
 * This script finds ALL users with ORGANIZER role who have no approved events
 * and downgrades them to ATTENDEE (regardless of their status).
 */

import { prisma } from '../src/config/database.js';
import { UserRole, EventStatus } from '@prisma/client';
import { logger } from '../src/utils/logger.js';

async function checkAndFixOrganizerRoles() {
  try {
    logger.info('Checking all organizers...');

    // Find all users with ORGANIZER role
    const organizers = await prisma.user.findMany({
      where: {
        role: UserRole.ORGANIZER,
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
            status: true,
          },
        },
      },
    });

    logger.info(`Found ${organizers.length} users with ORGANIZER role`);

    console.log('\n=== ORGANIZER AUDIT ===\n');

    let needsDowngrade = 0;
    let hasApprovedEvents = 0;

    for (const user of organizers) {
      const approvedEventCount = user.eventsCreated.length;
      
      console.log(`User: ${user.email}`);
      console.log(`  Name: ${user.firstName} ${user.lastName}`);
      console.log(`  Status: ${user.status}`);
      console.log(`  Role: ${user.role}`);
      console.log(`  Approved Events: ${approvedEventCount}`);
      
      if (approvedEventCount === 0) {
        console.log(`  ⚠️  Should be ATTENDEE (no approved events)`);
        needsDowngrade++;
        
        // Downgrade to ATTENDEE
        await prisma.user.update({
          where: { id: user.id },
          data: { role: UserRole.ATTENDEE },
        });
        console.log(`  ✅ Downgraded to ATTENDEE`);
      } else {
        console.log(`  ✅ Correctly has ORGANIZER role`);
        hasApprovedEvents++;
      }
      console.log('');
    }

    console.log('=== SUMMARY ===');
    console.log(`Total organizers checked: ${organizers.length}`);
    console.log(`Has approved events: ${hasApprovedEvents}`);
    console.log(`Downgraded to ATTENDEE: ${needsDowngrade}`);
    
    return {
      total: organizers.length,
      downgraded: needsDowngrade,
      correct: hasApprovedEvents,
    };
  } catch (error) {
    logger.error('Script failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
checkAndFixOrganizerRoles()
  .then((result) => {
    console.log('\n✅ Script complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
