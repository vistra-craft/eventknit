-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('ACTIVE', 'DEACTIVATED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ScanType" AS ENUM ('CHECK_IN', 'CHECK_OUT', 'MANUAL_CHECK_IN', 'MANUAL_CHECK_OUT');

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "allowReEntry" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maxReEntries" INTEGER,
ADD COLUMN     "requireCheckOut" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "scanSettings" JSONB;

-- AlterTable
ALTER TABLE "EventRegistration" ADD COLUMN     "checkedInAt" TIMESTAMP(3),
ADD COLUMN     "checkedInBy" TEXT,
ADD COLUMN     "checkedOutAt" TIMESTAMP(3),
ADD COLUMN     "checkedOutBy" TEXT,
ADD COLUMN     "isCurrentlyInside" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastScanFacility" TEXT,
ADD COLUMN     "reEntryCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "ticketStatus" "TicketStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateTable
CREATE TABLE "TicketScan" (
    "id" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "scanType" "ScanType" NOT NULL,
    "scannedBy" TEXT NOT NULL,
    "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "facility" TEXT,
    "deviceId" TEXT,
    "deviceType" TEXT,
    "isValid" BOOLEAN NOT NULL DEFAULT true,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "isReEntry" BOOLEAN NOT NULL DEFAULT false,
    "previousScanId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "location" JSONB,

    CONSTRAINT "TicketScan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TicketScan_registrationId_idx" ON "TicketScan"("registrationId");

-- CreateIndex
CREATE INDEX "TicketScan_eventId_idx" ON "TicketScan"("eventId");

-- CreateIndex
CREATE INDEX "TicketScan_scannedAt_idx" ON "TicketScan"("scannedAt");

-- CreateIndex
CREATE INDEX "TicketScan_scannedBy_idx" ON "TicketScan"("scannedBy");

-- CreateIndex
CREATE INDEX "TicketScan_facility_idx" ON "TicketScan"("facility");

-- CreateIndex
CREATE INDEX "EventRegistration_ticketStatus_idx" ON "EventRegistration"("ticketStatus");

-- CreateIndex
CREATE INDEX "EventRegistration_checkedInAt_idx" ON "EventRegistration"("checkedInAt");

-- CreateIndex
CREATE INDEX "EventRegistration_isCurrentlyInside_idx" ON "EventRegistration"("isCurrentlyInside");

-- AddForeignKey
ALTER TABLE "TicketScan" ADD CONSTRAINT "TicketScan_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "EventRegistration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketScan" ADD CONSTRAINT "TicketScan_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
