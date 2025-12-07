#!/usr/bin/env node

/**
 * Apply migration directly using Prisma Client
 * This script applies the organizerDescription migration
 */

import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const prisma = new PrismaClient();

async function applyMigration() {
  try {
    console.log('🔄 Applying migration: add_organizer_description');
    
    // Read the migration SQL file
    const migrationPath = join(__dirname, '../prisma/migrations/20251205012025_add_organizer_description/migration.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    
    console.log('📄 Migration SQL:');
    console.log(migrationSQL);
    
    // Check if column already exists
    const checkColumn = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Event' 
      AND column_name = 'organizerDescription'
    `;
    
    if (checkColumn && checkColumn.length > 0) {
      console.log('✅ Column "organizerDescription" already exists in Event table');
      console.log('   Migration may have already been applied.');
      return;
    }
    
    // Apply the migration
    console.log('🔄 Executing migration...');
    await prisma.$executeRawUnsafe(migrationSQL);
    
    console.log('✅ Migration applied successfully!');
    
    // Verify the column was added
    const verifyColumn = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Event' 
      AND column_name = 'organizerDescription'
    `;
    
    if (verifyColumn && verifyColumn.length > 0) {
      console.log('✅ Verified: Column "organizerDescription" now exists in Event table');
    } else {
      console.warn('⚠️  Warning: Could not verify column was added');
    }
    
  } catch (error) {
    console.error('❌ Error applying migration:', error.message);
    
    // Check if it's a "column already exists" error
    if (error.message && error.message.includes('already exists')) {
      console.log('✅ Column already exists - migration may have been applied previously');
    } else {
      console.error('   Full error:', error);
      process.exit(1);
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
applyMigration()
  .then(() => {
    console.log('✅ Migration process completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });




