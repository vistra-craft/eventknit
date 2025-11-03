#!/usr/bin/env node

/**
 * Wrapper script for prisma generate that works without DATABASE_URL
 * This allows prisma generate to work in CI environments where DATABASE_URL might not be set
 */

import { execSync } from "child_process";
import { existsSync } from "fs";
import { join } from "path";

// Set a placeholder DATABASE_URL if not already set
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    "postgresql://placeholder:placeholder@localhost:5432/placeholder";
}

try {
  // Run prisma generate
  execSync("prisma generate", {
    stdio: "inherit",
    cwd: join(process.cwd()),
    env: process.env,
  });
} catch (error) {
  console.error("Failed to generate Prisma Client:", error.message);
  process.exit(1);
}
