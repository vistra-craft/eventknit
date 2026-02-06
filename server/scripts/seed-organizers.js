#!/usr/bin/env node

/**
 * Script to create additional organizers with email/password authentication
 * Creates 6 new organizers (in addition to scecil072@gmail.com)
 * 
 * Usage: node scripts/seed-organizers.js
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
dotenv.config();

const prisma = new PrismaClient({
  log: ['error'],
});

const hashPassword = async (password) => {
  return bcrypt.hash(password, 12);
};

const organizersData = [
  {
    email: 'sarah.events@eventknit.com',
    password: 'SecurePass123!',
    firstName: 'Sarah',
    lastName: 'Johnson',
    organizationName: 'Elite Events Management',
    businessEmail: 'contact@eliteevents.com',
    phoneNumber: '+1-555-0101'
  },
  {
    email: 'mike.conferences@eventknit.com',
    password: 'SecurePass123!',
    firstName: 'Michael',
    lastName: 'Chen',
    organizationName: 'TechConference Pro',
    businessEmail: 'info@techconference.com',
    phoneNumber: '+1-555-0102'
  },
  {
    email: 'priya.summits@eventknit.com',
    password: 'SecurePass123!',
    firstName: 'Priya',
    lastName: 'Patel',
    organizationName: 'Global Summits International',
    businessEmail: 'hello@globalsummits.com',
    phoneNumber: '+1-555-0103'
  },
  {
    email: 'david.festivals@eventknit.com',
    password: 'SecurePass123!',
    firstName: 'David',
    lastName: 'Martinez',
    organizationName: 'Festival Masters Inc',
    businessEmail: 'contact@festivalmasters.com',
    phoneNumber: '+1-555-0104'
  },
  {
    email: 'emma.workshops@eventknit.com',
    password: 'SecurePass123!',
    firstName: 'Emma',
    lastName: 'Thompson',
    organizationName: 'Learning & Development Hub',
    businessEmail: 'training@ldhub.com',
    phoneNumber: '+1-555-0105'
  },
  {
    email: 'james.corporate@eventknit.com',
    password: 'SecurePass123!',
    firstName: 'James',
    lastName: 'Wilson',
    organizationName: 'Corporate Events Solutions',
    businessEmail: 'info@corporateevents.com',
    phoneNumber: '+1-555-0106'
  }
];

async function main() {
  console.log('🌱 Seeding organizers...\n');

  let createdCount = 0;
  let existingCount = 0;

  for (const orgData of organizersData) {
    console.log(`🔍 Processing: ${orgData.email}`);

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: orgData.email },
    });

    if (existing) {
      console.log(`   ⚠️  User already exists, skipping...\n`);
      existingCount++;
      continue;
    }

    // Create new organizer
    try {
      const hashedPassword = await hashPassword(orgData.password);
      
      const user = await prisma.user.create({
        data: {
          email: orgData.email,
          password: hashedPassword,
          firstName: orgData.firstName,
          lastName: orgData.lastName,
          role: UserRole.ORGANIZER,
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
          emailVerifiedAt: new Date(),
          organizationName: orgData.organizationName,
          businessEmail: orgData.businessEmail,
          phoneNumber: orgData.phoneNumber,
        },
      });

      console.log(`   ✅ Created: ${user.email}`);
      console.log(`      Organization: ${user.organizationName}`);
      console.log(`      Name: ${user.firstName} ${user.lastName}\n`);
      createdCount++;
    } catch (error) {
      console.error(`   ❌ Failed to create ${orgData.email}:`, error.message);
    }
  }

  console.log('\n✨ Organizer seeding complete!\n');
  console.log('📊 Summary:');
  console.log(`   ✅ Created: ${createdCount} organizer(s)`);
  console.log(`   ⚠️  Already existed: ${existingCount} organizer(s)`);
  console.log(`\n📋 Login Credentials (for newly created organizers):`);
  console.log(`   Password for all: SecurePass123!\n`);
  
  organizersData.forEach(org => {
    console.log(`   ${org.email}`);
    console.log(`      Organization: ${org.organizationName}`);
  });
  
  console.log(`\n   scecil072@gmail.com (Existing - Continue with Email)`);
  console.log(`      Organization: (Use existing credentials)\n`);
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
