import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addMissingColumns() {
  try {
    console.log('Adding missing columns to database...');
    
    // Add refundSLA column to Event table
    await prisma.$executeRaw`
      ALTER TABLE "Event" 
      ADD COLUMN IF NOT EXISTS "refundSLA" INTEGER DEFAULT 0;
    `;
    console.log('✅ Added refundSLA column to Event table');
    
    // Add autoRefundEnabled column to Event table
    await prisma.$executeRaw`
      ALTER TABLE "Event" 
      ADD COLUMN IF NOT EXISTS "autoRefundEnabled" BOOLEAN DEFAULT false;
    `;
    console.log('✅ Added autoRefundEnabled column to Event table');
    
    // Add allowReEntry column to Event table
    await prisma.$executeRaw`
      ALTER TABLE "Event" 
      ADD COLUMN IF NOT EXISTS "allowReEntry" BOOLEAN DEFAULT false;
    `;
    console.log('✅ Added allowReEntry column to Event table');
    
    // Add requireCheckOut column to Event table
    await prisma.$executeRaw`
      ALTER TABLE "Event" 
      ADD COLUMN IF NOT EXISTS "requireCheckOut" BOOLEAN DEFAULT false;
    `;
    console.log('✅ Added requireCheckOut column to Event table');
    
    // Add maxReEntries column to Event table
    await prisma.$executeRaw`
      ALTER TABLE "Event" 
      ADD COLUMN IF NOT EXISTS "maxReEntries" INTEGER;
    `;
    console.log('✅ Added maxReEntries column to Event table');
    
    // Add scanSettings column to Event table
    await prisma.$executeRaw`
      ALTER TABLE "Event" 
      ADD COLUMN IF NOT EXISTS "scanSettings" JSONB;
    `;
    console.log('✅ Added scanSettings column to Event table');
    
    console.log('✅ All missing columns added successfully');
  } catch (error) {
    console.error('Error adding columns:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

addMissingColumns();
