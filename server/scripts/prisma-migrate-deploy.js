#!/usr/bin/env node

/**
 * Wrapper script for prisma migrate deploy that checks for valid DATABASE_URL
 * Skips migrations if DATABASE_URL is not set or is a placeholder
 * Handles migration errors gracefully to allow server to start
 */

import { execSync } from "child_process";

// Check if DATABASE_URL is explicitly set in environment
const databaseUrl = process.env.DATABASE_URL;

// Skip migrations if DATABASE_URL is not set or is a placeholder
if (!databaseUrl || databaseUrl.includes("placeholder")) {
  console.warn("⚠️  DATABASE_URL is not set or is a placeholder.");
  console.warn("   Skipping database migrations.");
  console.warn("   Please set DATABASE_URL in your environment variables.");
  process.exit(0); // Exit successfully so server can still start
}

try {
  console.log("🔄 Running database migrations...");
  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    cwd: process.cwd(),
    env: process.env,
  });
  console.log("✅ Database migrations completed successfully");
} catch (error) {
  console.error("❌ Failed to run database migrations:", error.message);
  
  // Try to resolve common migration issues
  try {
    console.log("🔄 Attempting to resolve migration issues...");
    
    // Try to resolve rolled-back migrations
    try {
      execSync("npx prisma migrate resolve --rolled-back", {
        stdio: "pipe",
        cwd: process.cwd(),
        env: process.env,
      });
      console.log("✅ Resolved rolled-back migrations");
      
      // Retry migration
      execSync("npx prisma migrate deploy", {
        stdio: "inherit",
        cwd: process.cwd(),
        env: process.env,
      });
      console.log("✅ Database migrations completed after resolution");
      process.exit(0);
    } catch (retryError) {
      console.warn("⚠️  Could not resolve migrations automatically");
    }
  } catch (resolveError) {
    console.warn("⚠️  Could not automatically resolve migration issues");
  }
  
  console.warn("⚠️  The server will still attempt to start, but database features may not work.");
  console.warn("   Please check migrations manually:");
  console.warn("   npx prisma migrate status");
  console.warn("   npx prisma migrate deploy");
  console.warn("   Or mark specific migrations as applied:");
  console.warn("   npx prisma migrate resolve --applied <migration-name>");
  
  // Exit with 0 to allow server to start even if migrations fail
  process.exit(0);
}
