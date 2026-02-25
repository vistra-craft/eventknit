/*
  Warnings:

  - A unique constraint covering the columns `[appleId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "PromoCodeRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'PAYOUT_INITIATED';
ALTER TYPE "NotificationType" ADD VALUE 'PAYOUT_COMPLETED';

-- AlterEnum
ALTER TYPE "UserStatus" ADD VALUE 'PENDING_APPROVAL';

-- AlterTable
ALTER TABLE "OrganizerProfile" ADD COLUMN     "socialLinks" JSONB;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "appleId" TEXT,
ADD COLUMN     "profileCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "profileCompletedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "PendingEmailChange" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "oldEmail" TEXT NOT NULL,
    "newEmail" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PendingEmailChange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromoCodeRequest" (
    "id" TEXT NOT NULL,
    "organizerId" TEXT NOT NULL,
    "eventId" TEXT,
    "message" TEXT,
    "status" "PromoCodeRequestStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "promoCodeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromoCodeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PendingEmailChange_userId_idx" ON "PendingEmailChange"("userId");

-- CreateIndex
CREATE INDEX "PendingEmailChange_newEmail_idx" ON "PendingEmailChange"("newEmail");

-- CreateIndex
CREATE INDEX "PendingEmailChange_expiresAt_idx" ON "PendingEmailChange"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "PromoCodeRequest_promoCodeId_key" ON "PromoCodeRequest"("promoCodeId");

-- CreateIndex
CREATE INDEX "PromoCodeRequest_organizerId_idx" ON "PromoCodeRequest"("organizerId");

-- CreateIndex
CREATE INDEX "PromoCodeRequest_status_idx" ON "PromoCodeRequest"("status");

-- CreateIndex
CREATE UNIQUE INDEX "User_appleId_key" ON "User"("appleId");

-- AddForeignKey
ALTER TABLE "PendingEmailChange" ADD CONSTRAINT "PendingEmailChange_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromoCodeRequest" ADD CONSTRAINT "PromoCodeRequest_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromoCodeRequest" ADD CONSTRAINT "PromoCodeRequest_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromoCodeRequest" ADD CONSTRAINT "PromoCodeRequest_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromoCodeRequest" ADD CONSTRAINT "PromoCodeRequest_promoCodeId_fkey" FOREIGN KEY ("promoCodeId") REFERENCES "PromoCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;
