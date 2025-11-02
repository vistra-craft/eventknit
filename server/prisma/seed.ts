import dotenv from 'dotenv';
import path from 'path';
import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

// Load environment variables
const env = process.env.NODE_ENV || 'development';
const envPath = path.resolve(process.cwd(), `.env.${env}`);
dotenv.config({ path: envPath });
dotenv.config(); // Also load .env for fallback

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
    console.log('Checking for existing superuser...');

    // Check if superuser already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: SUPERVISOR_CREDENTIALS.email },
    });

    if (existingUser) {
      console.log(`User with email ${SUPERVISOR_CREDENTIALS.email} already exists`);

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
        console.log('Updated existing user to SUPERADMIN role');
      } else {
        console.log('User is already a SUPERADMIN');
      }

      // Update password if needed (for security, you might want to skip this)
      // const hashedPassword = await hashPassword(SUPERVISOR_CREDENTIALS.password);
      // await prisma.user.update({
      //   where: { id: existingUser.id },
      //   data: { password: hashedPassword },
      // });
      console.log('Skipping password update for existing user');
    } else {
      // Create new superuser
      console.log('Creating new superuser...');
      const hashedPassword = await hashPassword(SUPERVISOR_CREDENTIALS.password);

      const superuser = await prisma.user.create({
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

      console.log(`Superuser created successfully with email: ${SUPERVISOR_CREDENTIALS.email}`);
      console.log('📧 Email:', SUPERVISOR_CREDENTIALS.email);
      console.log('🔑 Password:', SUPERVISOR_CREDENTIALS.password);
    }
  } catch (error) {
    console.error('Failed to create superuser:', error);
    throw error;
  }
};

/**
 * Main function
 */
async function main(): Promise<void> {
  try {
    console.log('🌱 Seeding database...');
    await createSuperuser();
    console.log('✅ Script completed successfully');
  } catch (error) {
    console.error('❌ Script failed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
