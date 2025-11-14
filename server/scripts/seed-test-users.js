#!/usr/bin/env node

/**
 * Production-safe script to seed test users
 * This can be run manually on Render via Shell
 * Usage: node scripts/seed-test-users.js
 */

import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const env = process.env.NODE_ENV || 'production';
const envPath = path.resolve(__dirname, '..', `.env.${env}`);
dotenv.config({ path: envPath });
dotenv.config(); // Also load .env for fallback

const prisma = new PrismaClient({
  log: ['error'],
});

const hashPassword = async (password) => {
  return bcrypt.hash(password, 12);
};

async function seedTestUsers() {
  try {
    console.log('🌱 Seeding test users...');
    console.log(`📊 Environment: ${env}`);
    console.log(`📊 Database: ${process.env.DATABASE_URL ? 'Connected' : 'NOT SET'}\n`);

    await prisma.$connect();

    const testUsers = [
      {
        email: 'test@organizer.com',
        password: 'testpass123',
        firstName: 'Test',
        lastName: 'Organizer',
        role: UserRole.ORGANIZER,
        organizationName: 'Test Organization',
        businessEmail: 'test@organizer.com',
      },
      {
        email: 'test@user.com',
        password: 'testpass123',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.ATTENDEE,
      },
    ];

    for (const userData of testUsers) {
      console.log(`\n🔍 Processing: ${userData.email}`);

      const existing = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (existing) {
        console.log(`   User exists, updating...`);
        const hashedPassword = await hashPassword(userData.password);
        await prisma.user.update({
          where: { id: existing.id },
          data: {
            password: hashedPassword,
            role: userData.role,
            status: UserStatus.ACTIVE,
            isEmailVerified: true,
            emailVerifiedAt: new Date(),
            ...(userData.organizationName && { organizationName: userData.organizationName }),
            ...(userData.businessEmail && { businessEmail: userData.businessEmail }),
          },
        });
        console.log(`   ✅ Updated: ${userData.email}`);
      } else {
        console.log(`   Creating new user...`);
        const hashedPassword = await hashPassword(userData.password);
        const user = await prisma.user.create({
          data: {
            email: userData.email,
            password: hashedPassword,
            firstName: userData.firstName,
            lastName: userData.lastName,
            role: userData.role,
            status: UserStatus.ACTIVE,
            isEmailVerified: true,
            emailVerifiedAt: new Date(),
            ...(userData.organizationName && { organizationName: userData.organizationName }),
            ...(userData.businessEmail && { businessEmail: userData.businessEmail }),
          },
        });
        console.log(`   ✅ Created: ${userData.email} (${userData.role})`);
      }
    }

    console.log('\n✅ Test users seeded successfully!');
    console.log('\n📋 Test Credentials:');
    console.log('   Organizer: test@organizer.com / testpass123');
    console.log('   Attendee:  test@user.com / testpass123');
  } catch (error) {
    console.error('❌ Error seeding test users:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedTestUsers().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});


