#!/usr/bin/env node

/**
 * Script to verify test users and test password authentication
 * Usage: node scripts/verify-test-users.js
 */

import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcrypt";

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

async function verifyTestUsers() {
  try {
    await prisma.$connect();
    console.log("✅ Connected to database\n");

    const testUsers = [
      { email: "test@organizer.com", password: "testpass123" },
      { email: "test@user.com", password: "testpass123" },
    ];

    for (const testUser of testUsers) {
      console.log(`\n🔍 Checking user: ${testUser.email}`);
      console.log("─".repeat(60));

      const user = await prisma.user.findUnique({
        where: { email: testUser.email },
        select: {
          id: true,
          email: true,
          password: true,
          role: true,
          status: true,
          isEmailVerified: true,
          emailVerifiedAt: true,
          lockedUntil: true,
          failedLoginAttempts: true,
        },
      });

      if (!user) {
        console.log("❌ User NOT FOUND in database");
        console.log("   Run: npm run prisma:seed");
        continue;
      }

      console.log("✅ User found");
      console.log(`   ID: ${user.id}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Status: ${user.status}`);
      console.log(`   Email Verified: ${user.isEmailVerified ? "✅" : "❌"}`);
      console.log(`   Has Password: ${user.password ? "✅" : "❌"}`);

      if (user.lockedUntil && user.lockedUntil > new Date()) {
        console.log(
          `   ⚠️  Account LOCKED until: ${user.lockedUntil.toLocaleString()}`
        );
      }

      if (user.failedLoginAttempts > 0) {
        console.log(
          `   ⚠️  Failed login attempts: ${user.failedLoginAttempts}`
        );
      }

      if (user.password) {
        console.log("\n   Testing password authentication...");
        const isValid = await bcrypt.compare(testUser.password, user.password);
        if (isValid) {
          console.log("   ✅ Password authentication: SUCCESS");
        } else {
          console.log("   ❌ Password authentication: FAILED");
          console.log("   ⚠️  Password hash might be incorrect");
          console.log("   💡 Try re-running: npm run prisma:seed");
        }
      } else {
        console.log("   ❌ No password set for user");
        console.log("   💡 Try re-running: npm run prisma:seed");
      }
    }

    console.log("\n" + "─".repeat(60));
    console.log("\n✅ Verification complete");
  } catch (error) {
    console.error("❌ Error verifying users:", error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyTestUsers().catch((error) => {
  console.error("❌ Unexpected error:", error);
  process.exit(1);
});
