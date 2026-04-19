/**
 * Deletes all events created by test@organizer.com
 * Usage: npx dotenv-cli -e .env.development -- npx tsx scripts/clear-test-events.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const organizer = await prisma.user.findUnique({ where: { email: 'test@organizer.com' } });
  if (!organizer) {
    console.log('❌ Organizer test@organizer.com not found');
    process.exit(1);
  }
  const deleted = await prisma.event.deleteMany({ where: { organizerId: organizer.id } });
  console.log(`🗑️  Deleted ${deleted.count} event(s) for test@organizer.com`);
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
