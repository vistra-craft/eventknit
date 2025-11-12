#!/usr/bin/env node
/**
 * Script to check if super admin user exists in the database
 */

import { PrismaClient, UserRole } from "@prisma/client";
import dotenv from "dotenv";
import path from "path";

// Load environment variables
const env = process.env.NODE_ENV || "development";
const envPath = path.resolve(process.cwd(), `.env.${env}`);
dotenv.config({ path: envPath });
dotenv.config(); // Also load .env for fallback

const prisma = new PrismaClient();

async function checkSuperAdmin() {
  try {
    // Check if DATABASE_URL is set
    if (
      !process.env.DATABASE_URL ||
      process.env.DATABASE_URL.includes("placeholder") ||
      (process.env.DATABASE_URL.includes("localhost") &&
        !process.env.DATABASE_URL.includes("render.com"))
    ) {
      console.log("⚠️  DATABASE_URL is not set or points to localhost.");
      console.log(
        "   To check production database, set DATABASE_URL to your Render database URL."
      );
      console.log(
        "   Example: DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require\n"
      );
      console.log(
        "   Note: Render databases may only be accessible from Render's network.\n"
      );
      console.log(
        "   You may need to use the External Database URL from Render dashboard.\n"
      );
      process.exit(1);
    }

    console.log("🔍 Checking for super admin users...\n");

    // Find all SUPERADMIN users
    const superAdmins = await prisma.user.findMany({
      where: {
        role: UserRole.SUPERADMIN,
        deletedAt: null, // Only active users
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        isEmailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (superAdmins.length === 0) {
      console.log("❌ No super admin users found in the database.");
      console.log("\n💡 To create a super admin, run:");
      console.log("   npm run prisma:seed");
      process.exit(1);
    }

    console.log(`✅ Found ${superAdmins.length} super admin user(s):\n`);

    superAdmins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.firstName} ${admin.lastName}`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Role: ${admin.role}`);
      console.log(`   Status: ${admin.status}`);
      console.log(`   Email Verified: ${admin.isEmailVerified ? "Yes" : "No"}`);
      console.log(`   Created: ${admin.createdAt.toISOString()}`);
      console.log(`   Updated: ${admin.updatedAt.toISOString()}`);
      console.log("");
    });

    // Check for the expected super admin from seed script
    const expectedEmail = "vistracraft@gmail.com";
    const expectedAdmin = superAdmins.find(
      (admin) => admin.email === expectedEmail
    );

    if (expectedAdmin) {
      console.log("✅ Expected super admin (vistracraft@gmail.com) found!");
    } else {
      console.log(
        "⚠️  Expected super admin (vistracraft@gmail.com) not found."
      );
      console.log("   But other super admin users exist.");
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error checking super admin:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkSuperAdmin();
