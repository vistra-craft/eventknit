#!/usr/bin/env node

/**
 * Script to seed dummy data for 5 organizers and 10 clients
 * Usage: node scripts/seed-dummy-data.js
 */

import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const env = process.env.NODE_ENV || 'development';
const envPath = path.resolve(__dirname, '..', `.env.${env}`);
dotenv.config({ path: envPath });
dotenv.config(); // Also load .env for fallback

const prisma = new PrismaClient({
  log: ['error'],
});

const hashPassword = async (password) => {
  return bcrypt.hash(password, 12);
};

async function seedDummyData() {
  try {
    console.log('🌱 Seeding dummy data...');
    console.log(`📊 Environment: ${env}`);
    console.log(`📊 Database: ${process.env.DATABASE_URL ? 'Connected' : 'NOT SET'}\n`);

    await prisma.$connect();

    const organizers = [];
    for (let i = 1; i <= 5; i++) {
      organizers.push({
        email: `testorg${i}@eventknit.com`,
        password: 'testpass123',
        firstName: `TestOrg${i}`,
        lastName: 'Organizer',
        role: UserRole.ORGANIZER,
        organizationName: `Test Organization ${i}`,
        businessEmail: `testorg${i}@eventknit.com`,
      });
    }

    const clients = [];
    for (let i = 1; i <= 10; i++) {
      clients.push({
        email: `testclient${i}@eventknit.com`,
        password: 'testpass123',
        firstName: `TestClient${i}`,
        lastName: 'User',
        role: UserRole.ATTENDEE,
      });
    }

    const allUsers = [...organizers, ...clients];

    for (const userData of allUsers) {
      // console.log(`\n🔍 Processing: ${userData.email}`);

      const existing = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (existing) {
        // console.log(`   User exists, updating...`);
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
        // console.log(`   ✅ Updated: ${userData.email}`);
      } else {
        // console.log(`   Creating new user...`);
        const hashedPassword = await hashPassword(userData.password);
        await prisma.user.create({
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
        // console.log(`   ✅ Created: ${userData.email} (${userData.role})`);
      }
    }

    console.log('\n✅ Dummy data seeded successfully!');
    console.log('\n📋 Organizer Credentials:');
    organizers.forEach(u => console.log(`   ${u.email} / ${u.password}`));
    console.log('\n📋 Client Credentials:');
    clients.forEach(u => console.log(`   ${u.email} / ${u.password}`));

  } catch (error) {
    console.error('❌ Error seeding dummy data:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedDummyData().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
