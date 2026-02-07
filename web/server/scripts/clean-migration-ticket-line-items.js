#!/usr/bin/env node

/**
 * Script to remove the problematic migration from the database tracking table
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanMigration() {
  try {
    const migrationName = '20250101000000_add_ticket_line_items';
    
    console.log(`🔄 Removing migration ${migrationName} from tracking table...`);
    
    // Check if migration exists in tracking table
    const existing = await prisma.$queryRaw`
      SELECT migration_name, finished_at, rolled_back_at 
      FROM "_prisma_migrations" 
      WHERE migration_name = ${migrationName}
    `;
    
    if (!existing || existing.length === 0) {
      console.log(`ℹ️  Migration ${migrationName} not found in tracking table`);
      return;
    }
    
    console.log(`📋 Found migration record:`, existing);
    
    // Remove the migration from the tracking table
    await prisma.$executeRaw`
      DELETE FROM "_prisma_migrations" 
      WHERE migration_name = ${migrationName}
    `;
    
    console.log(`✅ Migration ${migrationName} removed from tracking table`);
    
  } catch (error) {
    console.error('❌ Error cleaning migration:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

cleanMigration();
