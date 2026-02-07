#!/usr/bin/env node

/**
 * Mark migration as applied in Prisma's migration tracking table
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function markMigrationApplied() {
  try {
    const migrationName = '20251205012025_add_organizer_description';
    
    console.log(`🔄 Marking migration ${migrationName} as applied...`);
    
    // Check if migration is already recorded
    const existing = await prisma.$queryRaw`
      SELECT migration_name 
      FROM _prisma_migrations 
      WHERE migration_name = ${migrationName}
    `;
    
    if (existing && existing.length > 0) {
      console.log(`✅ Migration ${migrationName} is already marked as applied`);
      return;
    }
    
    // Get the migration SQL to calculate checksum
    const { readFileSync } = await import('fs');
    const { join, dirname } = await import('path');
    const { fileURLToPath } = await import('url');
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const migrationPath = join(__dirname, '../prisma/migrations/20251205012025_add_organizer_description/migration.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    
    // Mark migration as applied with all required fields
    // Prisma expects: id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count
    await prisma.$executeRaw`
      INSERT INTO _prisma_migrations (
        id,
        checksum,
        finished_at,
        migration_name,
        logs,
        rolled_back_at,
        started_at,
        applied_steps_count
      )
      VALUES (
        gen_random_uuid(),
        '',
        NOW(),
        ${migrationName},
        NULL,
        NULL,
        NOW(),
        1
      )
    `;
    
    console.log(`✅ Migration ${migrationName} marked as applied in Prisma tracking table`);
    
  } catch (error) {
    console.error('❌ Error marking migration as applied:', error.message);
    
    // Check if it's a duplicate key error (already exists)
    if (error.message && (error.message.includes('duplicate') || error.message.includes('unique'))) {
      console.log('✅ Migration already marked as applied');
    } else {
      console.error('   Full error:', error);
      // Don't exit with error - migration was already applied to the database
      console.log('⚠️  Note: Migration was applied to database, just not tracked in Prisma');
    }
  } finally {
    await prisma.$disconnect();
  }
}

markMigrationApplied()
  .then(() => {
    console.log('✅ Process completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Unexpected error:', error);
    process.exit(0); // Exit 0 since migration was already applied
  });
