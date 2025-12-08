#!/usr/bin/env node

/**
 * Script to fix the migration issue by removing the problematic migration record
 * and then resetting the database
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixMigration() {
  try {
    const migrationName = '20250101000000_add_ticket_line_items';
    
    console.log('🔍 Checking for problematic migration...');
    
    // Check if migration exists in tracking table
    const existing = await prisma.$queryRaw`
      SELECT migration_name, finished_at, rolled_back_at, started_at
      FROM "_prisma_migrations" 
      WHERE migration_name = ${migrationName}
    `;
    
    if (existing && existing.length > 0) {
      console.log(`📋 Found migration record:`, existing);
      console.log(`🔄 Removing migration ${migrationName} from tracking table...`);
      
      // Remove the migration from the tracking table
      const result = await prisma.$executeRaw`
        DELETE FROM "_prisma_migrations" 
        WHERE migration_name = ${migrationName}
      `;
      
      console.log(`✅ Migration ${migrationName} removed from tracking table`);
      console.log(`   Rows deleted: ${result}`);
    } else {
      console.log(`ℹ️  Migration ${migrationName} not found in tracking table`);
    }
    
    // Verify it's gone
    const verify = await prisma.$queryRaw`
      SELECT migration_name 
      FROM "_prisma_migrations" 
      WHERE migration_name = ${migrationName}
    `;
    
    if (!verify || verify.length === 0) {
      console.log(`✅ Confirmed: Migration record removed successfully`);
      console.log(`\n📝 Next steps:`);
      console.log(`   1. Run: npx prisma migrate reset`);
      console.log(`   2. Or run: npx prisma migrate deploy`);
    } else {
      console.log(`⚠️  Warning: Migration record still exists`);
    }
    
  } catch (error) {
    console.error('❌ Error fixing migration:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

fixMigration();
