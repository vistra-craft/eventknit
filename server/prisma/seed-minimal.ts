import dotenv from 'dotenv';
import path from 'path';
import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import bcrypt from 'bcrypt';
import { logger } from '../src/utils/logger.js';

// Load environment variables
const env = process.env.NODE_ENV || 'development';
const envPath = path.resolve(process.cwd(), `.env.${env}`);
dotenv.config({ path: envPath });
dotenv.config(); // Also load .env for fallback

// Log database connection info (without exposing password)
const databaseUrl = process.env.DATABASE_URL || 'NOT SET';
const dbInfo = databaseUrl.replace(/:[^:@]+@/, ':****@'); // Mask password
logger.info(`📊 Environment: ${env}`);
logger.info(`📊 Database: ${dbInfo}`);

const SUPERVISOR_CREDENTIALS = {
  email: 'vistracraft@gmail.com',
  password: 'Somepass123!',
  firstName: 'Vistra',
  lastName: 'Craft',
  role: UserRole.SUPERADMIN,
};

const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

const prisma = new PrismaClient();

/**
 * Create or update the superuser
 */
const createSuperuser = async (): Promise<void> => {
  try {
    logger.info('Checking for existing superuser...');

    // Check if superuser already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: SUPERVISOR_CREDENTIALS.email },
    });

    if (existingUser) {
      logger.info(`User with email ${SUPERVISOR_CREDENTIALS.email} already exists`);

      // Update to SUPERADMIN if not already
      if (existingUser.role !== UserRole.SUPERADMIN) {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            role: UserRole.SUPERADMIN,
            status: UserStatus.ACTIVE,
            isEmailVerified: true,
            emailVerifiedAt: new Date(),
          },
        });
        logger.info('Updated existing user to SUPERADMIN role');
      } else {
        logger.info('User is already a SUPERADMIN');
      }
    } else {
      // Create new superuser
      logger.info('Creating new superuser...');
      const hashedPassword = await hashPassword(SUPERVISOR_CREDENTIALS.password);

      const _superuser = await prisma.user.create({
        data: {
          email: SUPERVISOR_CREDENTIALS.email,
          password: hashedPassword,
          firstName: SUPERVISOR_CREDENTIALS.firstName,
          lastName: SUPERVISOR_CREDENTIALS.lastName,
          role: SUPERVISOR_CREDENTIALS.role,
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
          emailVerifiedAt: new Date(),
        },
      });

      logger.info(`Superuser created successfully with email: ${SUPERVISOR_CREDENTIALS.email}`);
      logger.info('📧 Email:', SUPERVISOR_CREDENTIALS.email);
      logger.info('🔑 Password:', SUPERVISOR_CREDENTIALS.password);
    }
  } catch (error) {
    logger.error('Failed to create superuser:', error);
    throw error;
  }
};

/**
 * Main function
 */
async function main(): Promise<void> {
  try {
    logger.info('🌱 Seeding database (superuser only)...');
    
    // Verify database connection before proceeding
    try {
      await prisma.$connect();
      await prisma.$queryRaw`SELECT 1`;
      logger.info('✅ Database connection verified');
    } catch (error) {
      logger.error('❌ Failed to connect to database. Please check your DATABASE_URL.');
      logger.error(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
    
    // Create superuser
    await createSuperuser();

    logger.info('✅ Seed script completed successfully');
  } catch (error) {
    logger.error('❌ Seed script failed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    logger.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
