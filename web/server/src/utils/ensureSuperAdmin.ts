import { prisma } from '../config/database.js';
import { UserRole, UserStatus } from '@prisma/client';
import { hashPassword } from './password.js';
import { logger } from './logger.js';

const SUPERVISOR_CREDENTIALS = {
  email: 'vistracraft@gmail.com',
  password: 'Somepass123!',
  firstName: 'Vistra',
  lastName: 'Craft',
  role: UserRole.SUPERADMIN,
};

/**
 * Ensure super admin user exists in the database
 * Called automatically on server startup
 */
export const ensureSuperAdmin = async (): Promise<void> => {
  try {
    logger.info('🔍 Checking for super admin user...');

    // Check if superuser already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: SUPERVISOR_CREDENTIALS.email },
    });

    if (existingUser) {
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
        logger.info('✅ Updated existing user to SUPERADMIN role');
      } else {
        logger.info('✅ Super admin already exists');
      }
      return;
    }

    // Create new superuser
    logger.info('📝 Creating super admin user...');
    const hashedPassword = await hashPassword(SUPERVISOR_CREDENTIALS.password);

    await prisma.user.create({
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

    logger.info('✅ Super admin created successfully');
    logger.info(`   Email: ${SUPERVISOR_CREDENTIALS.email}`);
    logger.info(`   Password: ${SUPERVISOR_CREDENTIALS.password}`);
  } catch (error) {
    // Log error but don't fail server startup
    logger.error('⚠️  Failed to ensure super admin exists:', error);
    logger.warn('   Server will continue, but super admin may not be available');
  }
};

