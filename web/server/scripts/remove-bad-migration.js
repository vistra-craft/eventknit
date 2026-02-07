import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function removeBadMigration() {
  try {
    console.log('Removing problematic migration record...');
    
    const result = await prisma.$executeRaw`
      DELETE FROM "_prisma_migrations" 
      WHERE migration_name = '20250101000000_add_ticket_line_items'
    `;
    
    console.log(`Deleted ${result} record(s)`);
    console.log('✅ Done! Now you can run: npx prisma migrate reset');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

removeBadMigration();
