/*
  Warnings:

  - The values [INACTIVE,PENDING_VERIFICATION] on the enum `UserStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InviteType" AS ENUM ('ATTENDEE', 'SPEAKER', 'EXHIBITOR', 'GUEST');

-- AlterEnum
BEGIN;
CREATE TYPE "UserStatus_new" AS ENUM ('ACTIVE', 'SUSPENDED', 'DEACTIVATED');
ALTER TABLE "public"."User" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "status" TYPE "UserStatus_new" USING ("status"::text::"UserStatus_new");
ALTER TYPE "UserStatus" RENAME TO "UserStatus_old";
ALTER TYPE "UserStatus_new" RENAME TO "UserStatus";
DROP TYPE "public"."UserStatus_old";
ALTER TABLE "User" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
COMMIT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "companyAffiliation" TEXT,
ADD COLUMN     "managedBy" TEXT,
ADD COLUMN     "otherName" TEXT,
ALTER COLUMN "status" SET DEFAULT 'ACTIVE';

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "fullDescription" TEXT,
    "category" TEXT,
    "tags" TEXT[],
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "startTime" TEXT,
    "endTime" TEXT,
    "registrationDeadline" TIMESTAMP(3),
    "venue" TEXT,
    "location" TEXT NOT NULL,
    "address" TEXT,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "onlineLink" TEXT,
    "coordinates" JSONB,
    "isFree" BOOLEAN NOT NULL DEFAULT false,
    "price" DECIMAL(10,2),
    "ticketTypes" JSONB,
    "capacity" INTEGER,
    "availableSlots" INTEGER,
    "image" TEXT,
    "images" TEXT[],
    "type" "EventType" NOT NULL DEFAULT 'PUBLIC',
    "status" "EventStatus" NOT NULL DEFAULT 'PENDING',
    "requirements" TEXT[],
    "ageRestriction" TEXT,
    "duration" TEXT,
    "speakers" JSONB,
    "sponsors" JSONB,
    "faqs" JSONB,
    "registrationFields" JSONB,
    "organizerId" TEXT NOT NULL,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedBy" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventRegistration" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "attendeeId" TEXT NOT NULL,
    "invitationId" TEXT,
    "ticketType" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "registrationData" JSONB,
    "status" "RegistrationStatus" NOT NULL DEFAULT 'PENDING',
    "paymentStatus" TEXT,
    "paymentMethod" TEXT,
    "paymentTransactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cancelledAt" TIMESTAMP(3),
    "cancelledBy" TEXT,

    CONSTRAINT "EventRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventInvitation" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "inviteType" "InviteType" NOT NULL,
    "token" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "expiresAt" TIMESTAMP(3),
    "maxUses" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "revokedBy" TEXT,

    CONSTRAINT "EventInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketTemplate" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "backgroundUrl" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "unit" TEXT,
    "elements" JSONB,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "TicketTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeaturedEvent" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "customTitle" TEXT,
    "customImage" TEXT,
    "customCategory" TEXT,
    "displayStartDate" TIMESTAMP(3),
    "displayEndDate" TIMESTAMP(3),
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "FeaturedEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Event_organizerId_idx" ON "Event"("organizerId");

-- CreateIndex
CREATE INDEX "Event_status_idx" ON "Event"("status");

-- CreateIndex
CREATE INDEX "Event_category_idx" ON "Event"("category");

-- CreateIndex
CREATE INDEX "Event_startDate_idx" ON "Event"("startDate");

-- CreateIndex
CREATE INDEX "Event_isFree_idx" ON "Event"("isFree");

-- CreateIndex
CREATE INDEX "Event_deletedAt_idx" ON "Event"("deletedAt");

-- CreateIndex
CREATE INDEX "Event_createdAt_idx" ON "Event"("createdAt");

-- CreateIndex
CREATE INDEX "EventRegistration_eventId_idx" ON "EventRegistration"("eventId");

-- CreateIndex
CREATE INDEX "EventRegistration_attendeeId_idx" ON "EventRegistration"("attendeeId");

-- CreateIndex
CREATE INDEX "EventRegistration_status_idx" ON "EventRegistration"("status");

-- CreateIndex
CREATE INDEX "EventRegistration_createdAt_idx" ON "EventRegistration"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "EventRegistration_eventId_attendeeId_key" ON "EventRegistration"("eventId", "attendeeId");

-- CreateIndex
CREATE UNIQUE INDEX "EventInvitation_token_key" ON "EventInvitation"("token");

-- CreateIndex
CREATE INDEX "EventInvitation_eventId_idx" ON "EventInvitation"("eventId");

-- CreateIndex
CREATE INDEX "EventInvitation_token_idx" ON "EventInvitation"("token");

-- CreateIndex
CREATE INDEX "EventInvitation_inviteType_idx" ON "EventInvitation"("inviteType");

-- CreateIndex
CREATE INDEX "EventInvitation_isActive_idx" ON "EventInvitation"("isActive");

-- CreateIndex
CREATE INDEX "EventInvitation_createdAt_idx" ON "EventInvitation"("createdAt");

-- CreateIndex
CREATE INDEX "TicketTemplate_eventId_idx" ON "TicketTemplate"("eventId");

-- CreateIndex
CREATE INDEX "TicketTemplate_createdBy_idx" ON "TicketTemplate"("createdBy");

-- CreateIndex
CREATE INDEX "TicketTemplate_isDefault_idx" ON "TicketTemplate"("isDefault");

-- CreateIndex
CREATE INDEX "TicketTemplate_createdAt_idx" ON "TicketTemplate"("createdAt");

-- CreateIndex
CREATE INDEX "FeaturedEvent_eventId_idx" ON "FeaturedEvent"("eventId");

-- CreateIndex
CREATE INDEX "FeaturedEvent_createdBy_idx" ON "FeaturedEvent"("createdBy");

-- CreateIndex
CREATE INDEX "FeaturedEvent_isActive_idx" ON "FeaturedEvent"("isActive");

-- CreateIndex
CREATE INDEX "FeaturedEvent_displayOrder_idx" ON "FeaturedEvent"("displayOrder");

-- CreateIndex
CREATE INDEX "FeaturedEvent_displayStartDate_idx" ON "FeaturedEvent"("displayStartDate");

-- CreateIndex
CREATE INDEX "FeaturedEvent_displayEndDate_idx" ON "FeaturedEvent"("displayEndDate");

-- CreateIndex
CREATE INDEX "FeaturedEvent_createdAt_idx" ON "FeaturedEvent"("createdAt");

-- CreateIndex
CREATE INDEX "User_managedBy_idx" ON "User"("managedBy");

-- CreateIndex
CREATE INDEX "User_organizationName_idx" ON "User"("organizationName");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_managedBy_fkey" FOREIGN KEY ("managedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRegistration" ADD CONSTRAINT "EventRegistration_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRegistration" ADD CONSTRAINT "EventRegistration_attendeeId_fkey" FOREIGN KEY ("attendeeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRegistration" ADD CONSTRAINT "EventRegistration_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "EventInvitation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventInvitation" ADD CONSTRAINT "EventInvitation_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventInvitation" ADD CONSTRAINT "EventInvitation_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketTemplate" ADD CONSTRAINT "TicketTemplate_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketTemplate" ADD CONSTRAINT "TicketTemplate_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeaturedEvent" ADD CONSTRAINT "FeaturedEvent_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeaturedEvent" ADD CONSTRAINT "FeaturedEvent_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
