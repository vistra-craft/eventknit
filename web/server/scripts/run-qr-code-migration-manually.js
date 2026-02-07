/**
 * Manual migration script to add QR code storage fields
 * This bypasses Prisma's migration system to avoid lock issues
 * Run: node scripts/run-qr-code-migration-manually.js
 */

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env.development') });

const prisma = new PrismaClient();

async function runMigration() {
  try {
    console.log('🔄 Running manual migration to add QR code storage fields...\n');

    // Read the SQL migration file
    const sqlPath = join(__dirname, 'create-qr-code-storage-migration.sql');
    const sql = readFileSync(sqlPath, 'utf-8');

    // Split by semicolons and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          console.log(`Executing: ${statement.substring(0, 60)}...`);
          await prisma.$executeRawUnsafe(statement);
          console.log('✅ Success\n');
        } catch (error) {
          // Ignore "already exists" errors
          if (error.message.includes('already exists') || error.message.includes('duplicate')) {
            console.log('ℹ️  Already exists (skipping)\n');
          } else {
            throw error;
          }
        }
      }
    }

    console.log('✨ Migration completed successfully!');
    console.log('\n📝 Note: You may want to mark this migration as applied in Prisma:');
    console.log('   Run: npx prisma migrate resolve --applied add_qr_code_storage');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runMigration();


