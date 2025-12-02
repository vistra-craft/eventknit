import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://eventknit:eventknit123@localhost:5432/eventknit?schema=public',
    },
  },
});

async function main() {
  console.log('Attempting to connect to database...');
  try {
    await prisma.$connect();
    console.log('✅ Connected successfully!');
    const result = await prisma.$queryRaw`SELECT 1 as result`;
    console.log('Query result:', result);
  } catch (error) {
    console.error('❌ Connection failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
