#!/usr/bin/env node

/**
 * Wrapper script for prisma generate that works without DATABASE_URL
 * This allows prisma generate to work in CI environments where DATABASE_URL might not be set
 */

import { execSync } from "child_process";
import { join } from "path";

// Set a placeholder DATABASE_URL if not already set
// Use a dummy URL that won't cause connection attempts during generate
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    "postgresql://placeholder:placeholder@placeholder:5432/placeholder?schema=public";
}

// Prisma generate doesn't need a real database connection
// It only generates the client code based on the schema
try {
  // Run prisma generate with explicit schema path to avoid any connection attempts
  const schemaPath = join(process.cwd(), "prisma", "schema.prisma");
  execSync(`prisma generate --schema=${schemaPath}`, {
    stdio: "inherit",
    cwd: process.cwd(),
    env: {
      ...process.env,
      // Ensure we don't try to connect during generate
      DATABASE_URL: process.env.DATABASE_URL,
    },
  });
  console.log("✓ Prisma Client generated successfully");
} catch (error) {
  // Use console.error here since this script runs before TypeScript compilation
  // and logger from src/ won't be available
  console.error("Failed to generate Prisma Client:", error.message);
  process.exit(1);
}
