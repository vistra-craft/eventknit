/**
 * Script to release stuck Prisma advisory locks
 * Run this if you get P1002 timeout errors during migrations
 */

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env.development') });

const prisma = new PrismaClient();

async function releaseLocks() {
  try {
    console.log('🔓 Attempting to release Prisma advisory locks...\n');

    // Prisma uses advisory locks with specific IDs
    // The lock ID is calculated from the migration name hash
    // We'll try to release all common Prisma advisory locks

    // Release lock for migration operations (common lock IDs)
    const lockIds = [
      72707369, // The one from the error message
      // Add other lock IDs if needed
    ];

    for (const lockId of lockIds) {
      try {
        // Try to release the lock
        await prisma.$executeRawUnsafe(`SELECT pg_advisory_unlock(${lockId})`);
        console.log(`✅ Released advisory lock ${lockId}`);
      } catch (error) {
        if (error.message.includes('not currently held')) {
          console.log(`ℹ️  Lock ${lockId} was not held (already released)`);
        } else {
          console.log(`⚠️  Could not release lock ${lockId}: ${error.message}`);
        }
      }
    }

    // Also try to release all locks for the current session
    try {
      const result = await prisma.$executeRawUnsafe(`
        SELECT pg_advisory_unlock_all()
      `);
      console.log('✅ Released all advisory locks for current session');
    } catch (error) {
      console.log(`⚠️  Could not release all locks: ${error.message}`);
    }

    // Check for any remaining locks
    const locks = await prisma.$queryRawUnsafe(`
      SELECT 
        locktype, 
        objid, 
        pid, 
        mode, 
        granted 
      FROM pg_locks 
      WHERE locktype = 'advisory' 
      AND objid IN (${lockIds.join(',')})
    `);

    if (Array.isArray(locks) && locks.length > 0) {
      console.log('\n⚠️  Warning: Some locks may still be held:');
      console.log(locks);
      console.log('\n💡 You may need to:');
      console.log('   1. Kill the process holding the lock (PID shown above)');
      console.log('   2. Restart your database server');
      console.log('   3. Wait a few minutes and try again');
    } else {
      console.log('\n✅ No advisory locks found. You should be able to run migrations now.');
    }

    console.log('\n✨ Done! Try running your migration again.');
  } catch (error) {
    console.error('❌ Error releasing locks:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

releaseLocks();


