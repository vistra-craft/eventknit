import { PrismaClient } from '@prisma/client';
import { config } from './index';
import { logger } from '../utils/logger';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: config.env === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (config.env !== 'production') {
  globalForPrisma.prisma = prisma;
}

export const connectDB = async (): Promise<void> => {
  try {
    await prisma.$connect();
    // Verify connection with a simple query
    await prisma.$queryRaw`SELECT 1`;
    logger.info('✅ PostgreSQL connected via Prisma');
  } catch (error) {
    logger.warn('⚠️  Failed to connect to PostgreSQL, continuing without database');
    logger.warn(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    logger.warn('   Some features may not work. Start PostgreSQL with:');
    logger.warn('   docker compose --env-file .env.development up -d postgres');
    // Don't throw - allow server to start for development convenience
  }
};

export const disconnectDB = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    logger.info('🔌 PostgreSQL connection closed');
  } catch (error) {
    logger.warn('⚠️  Error disconnecting from PostgreSQL:', error);
  }
};



