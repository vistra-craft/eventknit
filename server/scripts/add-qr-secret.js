import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addQrSecretColumn() {
  try {
    console.log('Adding qrSecret column to EventRegistration table...');
    
    await prisma.$executeRaw`
      ALTER TABLE "EventRegistration" 
      ADD COLUMN IF NOT EXISTS "qrSecret" TEXT DEFAULT gen_random_uuid()::text;
    `;
    
    console.log('✅ Successfully added qrSecret column');
  } catch (error) {
    console.error('Error adding qrSecret column:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

addQrSecretColumn();
