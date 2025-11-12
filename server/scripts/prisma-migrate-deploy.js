#!/usr/bin/env node

/**
 * Wrapper script for prisma migrate deploy that checks for valid DATABASE_URL
 * Skips migrations if DATABASE_URL is not set or is a placeholder
 */

import { execSync } from "child_process";

// Check if DATABASE_URL is explicitly set in environment
// If not set, the config will construct one with localhost defaults, which we want to skip
const databaseUrl = process.env.DATABASE_URL;

// Skip migrations if DATABASE_URL is not explicitly set (will default to localhost)
// or if it's explicitly a placeholder
if (!databaseUrl || databaseUrl.includes('placeholder')) {
  console.warn('⚠️  DATABASE_URL is not set or is a placeholder.');
  console.warn('   Skipping database migrations.');
  console.warn('   Please set DATABASE_URL in your Render environment variables.');
  console.warn('   Migrations will be skipped until DATABASE_URL is configured.');
  console.warn('   The server will start, but database features will not work.');
  process.exit(0); // Exit successfully so server can still start
}

try {
  console.log('🔄 Running database migrations...');
  execSync("prisma migrate deploy", {
    stdio: "inherit",
    cwd: process.cwd(),
    env: process.env,
  });
  console.log("✅ Database migrations completed successfully");
} catch (error) {
  console.error("❌ Failed to run database migrations:", error.message);
  console.error("   The server will still attempt to start, but database features may not work.");
  // Exit with 0 to allow server to start even if migrations fail
  // In production, you might want to exit with 1 to prevent server start
  process.exit(0);
}

