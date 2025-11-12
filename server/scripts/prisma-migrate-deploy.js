#!/usr/bin/env node

/**
 * Wrapper script for prisma migrate deploy that checks for valid DATABASE_URL
 * Skips migrations if DATABASE_URL is not set or is a placeholder
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
  execSync("prisma migrate deploy", {
    stdio: "inherit",
    cwd: process.cwd(),
    env: process.env,
  });
  console.log("✅ Database migrations completed successfully");
} catch (error) {
  console.error("❌ Failed to run database migrations:", error.message);
  console.error(
    "   The server will still attempt to start, but database features may not work."
  );
  // Exit with 0 to allow server to start even if migrations fail
  process.exit(0);
}
