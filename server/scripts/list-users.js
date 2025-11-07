#!/usr/bin/env node

/**
 * Script to list users in the database
 * Usage:
 *   npm run list-users
 *   or
 *   node scripts/list-users.js
 *
 * Options:
 *   --role <role>    Filter by role (e.g., ATTENDEE, ORGANIZER)
 *   --status <status> Filter by status (e.g., ACTIVE, DEACTIVATED)
 */

import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const env = process.env.NODE_ENV || "development";
const envPath = path.resolve(__dirname, "..", `.env.${env}`);
dotenv.config({ path: envPath });
dotenv.config(); // Also load .env for fallback

const prisma = new PrismaClient({
  log: ["error"],
});

async function listUsers() {
  try {
    // Connect to database
    await prisma.$connect();
    console.log("✅ Connected to database\n");

    // Parse command line arguments
    const args = process.argv.slice(2);
    const roleIndex = args.indexOf("--role");
    const statusIndex = args.indexOf("--status");

    const roleFilter =
      roleIndex !== -1 && args[roleIndex + 1] ? args[roleIndex + 1] : undefined;
    const statusFilter =
      statusIndex !== -1 && args[statusIndex + 1]
        ? args[statusIndex + 1]
        : undefined;

    // Build where clause
    const where = {};
    if (roleFilter) {
      where.role = roleFilter;
    }
    if (statusFilter) {
      where.status = statusFilter;
    }

    // Find users
    const users = await prisma.user.findMany({
      where,
      include: {
        _count: {
          select: {
            eventsCreated: true,
            eventRegistrations: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (users.length === 0) {
      console.log("📭 No users found");
      if (roleFilter || statusFilter) {
        console.log("   (with applied filters)");
      }
      return;
    }

    console.log(`📋 Found ${users.length} user(s):\n`);
    console.log("─".repeat(100));

    users.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Name: ${user.firstName || "N/A"} ${user.lastName || ""}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Status: ${user.status}`);
      console.log(`   Email Verified: ${user.isEmailVerified ? "✅" : "❌"}`);
      console.log(`   Created: ${user.createdAt.toLocaleString()}`);
      console.log(`   Events created: ${user._count.eventsCreated}`);
      console.log(`   Event registrations: ${user._count.eventRegistrations}`);
      if (user.deletedAt) {
        console.log(`   ⚠️  Deleted: ${user.deletedAt.toLocaleString()}`);
      }
    });

    console.log("\n" + "─".repeat(100));
    console.log(`\nTotal: ${users.length} user(s)`);
  } catch (error) {
    console.error("❌ Error listing users:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

listUsers().catch((error) => {
  console.error("❌ Unexpected error:", error);
  process.exit(1);
});
