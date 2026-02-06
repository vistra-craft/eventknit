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
    const existingUser = await prisma.user.findUnique({
      where: { email: SUPERVISOR_CREDENTIALS.email },
    });

    if (existingUser) {
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
        logger.info('Super admin role updated');
      }
      return;
    }

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

    logger.info('Super admin created');
  } catch (error) {
    logger.error('Failed to ensure super admin:', error);
  }
};
