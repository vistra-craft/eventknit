#!/usr/bin/env node

/**
 * Wrapper script for prisma generate that works without DATABASE_URL
 * This allows prisma generate to work in CI environments where DATABASE_URL might not be set
 */

import { execSync } from "child_process";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Set a placeholder DATABASE_URL if not already set
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    "postgresql://placeholder:placeholder@placeholder:5432/placeholder?schema=public";
}

try {
  const schemaPath = join(process.cwd(), "prisma", "schema.prisma");
  const prismaBinary = join(process.cwd(), "node_modules", ".bin", "prisma");

  // Use the local prisma binary from node_modules
  const command =
    process.platform === "win32"
      ? `"${prismaBinary}.cmd" generate --schema="${schemaPath}"`
      : `"${prismaBinary}" generate --schema="${schemaPath}"`;

  execSync(command, {
    stdio: "inherit",
    cwd: process.cwd(),
    env: {
      ...process.env,
      DATABASE_URL: process.env.DATABASE_URL,
    },
    shell: true,
  });
  console.log("✓ Prisma Client generated successfully");
} catch (error) {
  console.error("Failed to generate Prisma Client:", error.message);
  process.exit(1);
}
