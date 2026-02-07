/**
 * Seed script for system permissions
 * Run this after migration: npx tsx prisma/seed-permissions.ts
 */

import { PrismaClient } from '@prisma/client';
import { SYSTEM_PERMISSIONS } from '../src/services/permission.service.js';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding system permissions...');

  for (const perm of SYSTEM_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key: perm.key },
      update: {
        name: perm.name,
        description: perm.description,
        category: perm.category,
        isSystem: true,
      },
      create: {
        key: perm.key,
        name: perm.name,
        description: perm.description,
        category: perm.category,
        isSystem: true,
      },
    });
  }

  console.log(`✅ Seeded ${SYSTEM_PERMISSIONS.length} system permissions`);
}

main()
  .catch((e) => {
    console.error('Error seeding permissions:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


 * Seed script for system permissions
 * Run this after migration: npx tsx prisma/seed-permissions.ts
 */

import { PrismaClient } from '@prisma/client';
import { SYSTEM_PERMISSIONS } from '../src/services/permission.service.js';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding system permissions...');

  for (const perm of SYSTEM_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key: perm.key },
      update: {
        name: perm.name,
        description: perm.description,
        category: perm.category,
        isSystem: true,
      },
      create: {
        key: perm.key,
        name: perm.name,
        description: perm.description,
        category: perm.category,
        isSystem: true,
      },
    });
  }

  console.log(`✅ Seeded ${SYSTEM_PERMISSIONS.length} system permissions`);
}

main()
  .catch((e) => {
    console.error('Error seeding permissions:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


