#!/usr/bin/env node

/**
 * Script to check database state and fix migration issues
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAndFix() {
  try {
    console.log('🔍 Checking database state...\n');
    
    // Check for the problematic migration
    const problematicMigration = await prisma.$queryRaw`
      SELECT migration_name, finished_at, rolled_back_at, started_at
      FROM "_prisma_migrations" 
      WHERE migration_name = '20250101000000_add_ticket_line_items'
    `;
    
    if (problematicMigration && problematicMigration.length > 0) {
      console.log('⚠️  Found problematic migration record:');
      console.log(JSON.stringify(problematicMigration, null, 2));
      console.log('\n🔄 Removing it...');
      
      await prisma.$executeRaw`
        DELETE FROM "_prisma_migrations" 
        WHERE migration_name = '20250101000000_add_ticket_line_items'
      `;
      
      console.log('✅ Removed problematic migration record\n');
    } else {
      console.log('✅ No problematic migration record found\n');
    }
    
    // Check if EventRegistration table exists
    const tableCheck = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'EventRegistration'
    `;
    
    if (!tableCheck || tableCheck.length === 0) {
      console.log('❌ EventRegistration table does NOT exist');
      console.log('📝 You need to run migrations:');
      console.log('   npx prisma migrate deploy');
      console.log('   OR for development:');
      console.log('   npx prisma migrate reset');
    } else {
      console.log('✅ EventRegistration table exists');
    }
    
    // Check migration status
    const allMigrations = await prisma.$queryRaw`
      SELECT migration_name, finished_at, rolled_back_at
      FROM "_prisma_migrations"
      ORDER BY started_at DESC
      LIMIT 10
    `;
    
    console.log('\n📋 Recent migrations:');
    console.log(JSON.stringify(allMigrations, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('does not exist')) {
      console.log('\n💡 The database might not be initialized. Try:');
      console.log('   npx prisma migrate deploy');
    }
  } finally {
    await prisma.$disconnect();
  }
}

checkAndFix();
