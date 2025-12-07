#!/usr/bin/env node

/**
 * Script to check events in the database
 * Shows status, type, and other relevant fields
 */

import { PrismaClient, EventStatus, EventType } from '@prisma/client';

const prisma = new PrismaClient();

async function checkEvents() {
  try {
    console.log('\n=== Checking All Events ===\n');

    // Get all events
    const allEvents = await prisma.event.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        status: true,
        type: true,
        createdAt: true,
        organizer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            organizationName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`Total events found: ${allEvents.length}\n`);

    if (allEvents.length === 0) {
      console.log('No events found in database.');
      return;
    }

    // Display events
    allEvents.forEach((event, index) => {
      console.log(`Event ${index + 1}:`);
      console.log(`  ID: ${event.id}`);
      console.log(`  Title: ${event.title}`);
      console.log(`  Status: ${event.status}`);
      console.log(`  Type: ${event.type}`);
      console.log(`  Created: ${event.createdAt.toISOString()}`);
      console.log(`  Organizer: ${event.organizer.organizationName || `${event.organizer.firstName} ${event.organizer.lastName}`}`);
      console.log('');
    });

    // Check approved and public events
    const approvedPublicEvents = allEvents.filter(
      (e) => e.status === EventStatus.APPROVED && e.type === EventType.PUBLIC
    );

    console.log(`\n=== Approved PUBLIC Events (should show on home page) ===`);
    console.log(`Count: ${approvedPublicEvents.length}\n`);

    if (approvedPublicEvents.length > 0) {
      approvedPublicEvents.forEach((event) => {
        console.log(`  - ${event.title} (${event.id})`);
      });
    } else {
      console.log('  No approved PUBLIC events found.');
      console.log('\n  This is why events are not showing on the home page!');
    }

    // Check approved events (any type)
    const approvedEvents = allEvents.filter((e) => e.status === EventStatus.APPROVED);
    console.log(`\n=== All Approved Events (any type) ===`);
    console.log(`Count: ${approvedEvents.length}\n`);

    if (approvedEvents.length > 0) {
      approvedEvents.forEach((event) => {
        console.log(`  - ${event.title} (${event.id}) - Type: ${event.type}`);
      });
    }

    // Check public events (any status)
    const publicEvents = allEvents.filter((e) => e.type === EventType.PUBLIC);
    console.log(`\n=== All PUBLIC Events (any status) ===`);
    console.log(`Count: ${publicEvents.length}\n`);

    if (publicEvents.length > 0) {
      publicEvents.forEach((event) => {
        console.log(`  - ${event.title} (${event.id}) - Status: ${event.status}`);
      });
    }

    // Summary
    console.log('\n=== Summary ===');
    console.log(`Total events: ${allEvents.length}`);
    console.log(`Approved events: ${approvedEvents.length}`);
    console.log(`Public events: ${publicEvents.length}`);
    console.log(`Approved + Public events: ${approvedPublicEvents.length}`);
    console.log('');

    if (approvedPublicEvents.length === 0 && approvedEvents.length > 0) {
      console.log('⚠️  ISSUE FOUND: You have approved events, but they are not PUBLIC type!');
      console.log('   Events need to be both APPROVED and PUBLIC to show on home page.');
      console.log('\n   To fix, you can update events to PUBLIC type:');
      approvedEvents.forEach((event) => {
        console.log(`   - Event "${event.title}" (${event.id}) is ${event.status} but type is ${event.type}`);
      });
    } else if (approvedPublicEvents.length === 0 && publicEvents.length > 0) {
      console.log('⚠️  ISSUE FOUND: You have PUBLIC events, but they are not APPROVED!');
      console.log('   Events need to be both APPROVED and PUBLIC to show on home page.');
      console.log('\n   To fix, you need to approve these events:');
      publicEvents.forEach((event) => {
        console.log(`   - Event "${event.title}" (${event.id}) is ${event.type} but status is ${event.status}`);
      });
    } else if (approvedPublicEvents.length === 0) {
      console.log('⚠️  No events meet the criteria (APPROVED + PUBLIC)');
    } else {
      console.log('✅ Events should be showing on home page!');
    }
  } catch (error) {
    console.error('Error checking events:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkEvents();




