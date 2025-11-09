#!/usr/bin/env node

/**
 * Script to delete a user account from the database
 *
 * For testing: Use --hard flag to permanently delete accounts so you can reuse the email
 *
 * Usage:
 *   npm run delete-user -- <email> [--hard] [--force]
 *   or
 *   node scripts/delete-user.js <email> [--hard] [--force]
 *
 * Examples:
 *   npm run delete-user -- bkelvin138@gmail.com --hard --force
 *   node scripts/delete-user.js bkelvin138@gmail.com --hard --force
 *
 * Options:
 *   --hard    Hard delete (permanently remove from database - use for testing to reuse email)
 *   --force   Skip confirmation prompt
 *
 * Note:
 *   - Default is soft delete (sets status to DEACTIVATED). Use --hard for testing.
 *   - When using npm run, use -- to pass flags: npm run delete-user -- <email> --hard --force
 */

import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import readline from "readline";

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

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query) =>
  new Promise((resolve) => rl.question(query, resolve));

async function deleteUser(email, hardDelete = false, force = false) {
  try {
    // Connect to database
    await prisma.$connect();
    console.log("✅ Connected to database\n");

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        _count: {
          select: {
            eventsCreated: true,
            eventRegistrations: true,
          },
        },
      },
    });

    if (!user) {
      console.error(`❌ User with email "${email}" not found`);
      process.exit(1);
    }

    // Show user info
    console.log("📋 User Information:");
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.firstName || "N/A"} ${user.lastName || ""}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Status: ${user.status}`);
    console.log(`   Created: ${user.createdAt.toLocaleString()}`);
    console.log(`   Events created: ${user._count.eventsCreated}`);
    console.log(`   Event registrations: ${user._count.eventRegistrations}`);
    console.log("");

    // Confirmation
    if (!force) {
      const deleteType = hardDelete ? "PERMANENTLY DELETE" : "soft delete";
      const answer = await question(
        `⚠️  Are you sure you want to ${deleteType} this user? (yes/no): `
      );

      if (answer.toLowerCase() !== "yes" && answer.toLowerCase() !== "y") {
        console.log("❌ Deletion cancelled");
        process.exit(0);
      }
    }

    // Perform deletion
    if (hardDelete) {
      console.log("🗑️  Performing HARD DELETE (permanent removal)...");

      // Delete related records first (due to foreign key constraints)
      await prisma.eventRegistration.deleteMany({
        where: { attendeeId: user.id },
      });

      await prisma.eventInvitation.deleteMany({
        where: { createdBy: user.id },
      });

      await prisma.event.deleteMany({
        where: { organizerId: user.id },
      });

      await prisma.refreshToken.deleteMany({
        where: { userId: user.id },
      });

      // Delete EmailVerification records by userId AND by email (in case some don't have userId)
      await prisma.emailVerification.deleteMany({
        where: { userId: user.id },
      });
      await prisma.emailVerification.deleteMany({
        where: { email: user.email },
      });

      await prisma.passwordReset.deleteMany({
        where: { userId: user.id },
      });

      await prisma.auditLog.deleteMany({
        where: { userId: user.id },
      });

      // Finally delete the user
      await prisma.user.delete({
        where: { id: user.id },
      });

      console.log("✅ User permanently deleted from database");
    } else {
      console.log("🗑️  Performing SOFT DELETE (marking as deleted)...");

      await prisma.user.update({
        where: { id: user.id },
        data: {
          status: "DEACTIVATED",
        },
      });

      console.log("✅ User soft deleted (status set to DEACTIVATED)");
    }

    console.log(`\n✅ Successfully deleted user: ${email}`);
  } catch (error) {
    console.error("❌ Error deleting user:", error.message);
    if (error.code === "P2003") {
      console.error("   This user has related records that prevent deletion.");
      console.error("   Use --hard flag to force delete all related records.");
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const email = args.find((arg) => !arg.startsWith("--"));
const hardDelete = args.includes("--hard");
const force = args.includes("--force");

if (!email) {
  console.error("❌ Error: Email address is required");
  console.error("\nUsage:");
  console.error("  npm run delete-user -- <email> [--hard] [--force]");
  console.error("  node scripts/delete-user.js <email> [--hard] [--force]");
  console.error("\nExamples:");
  console.error("  npm run delete-user -- bkelvin138@gmail.com --hard --force");
  console.error(
    "  node scripts/delete-user.js bkelvin138@gmail.com --hard --force"
  );
  console.error("\nOptions:");
  console.error("  --hard    Hard delete (permanently remove)");
  console.error("  --force   Skip confirmation prompt");
  console.error(
    "\nNote: When using npm run, use -- to pass flags through to the script."
  );
  process.exit(1);
}

deleteUser(email, hardDelete, force).catch((error) => {
  console.error("❌ Unexpected error:", error);
  process.exit(1);
});
