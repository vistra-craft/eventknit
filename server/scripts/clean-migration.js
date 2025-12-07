#!/usr/bin/env node

/**
 * Script to remove a problematic migration from the database tracking table
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanMigration() {
  try {
    const migrationName = '20250101000000_add_organizer_description';
    
    console.log(`🔄 Removing migration ${migrationName} from tracking table...`);
    
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

