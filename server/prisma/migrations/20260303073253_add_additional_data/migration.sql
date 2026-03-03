/*
  Warnings:

  - The `seatingType` column on the `Event` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[seatId,registrationId]` on the table `SeatReservation` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "SeatingType" AS ENUM ('CUSTOMER_SELECTS', 'ORGANIZER_ASSIGNS', 'HYBRID');

-- DropIndex
DROP INDEX IF EXISTS "SeatReservation_ticketLineItemId_idx";

-- AlterTable
ALTER TABLE "Event" DROP COLUMN IF EXISTS "seatingType",
ADD COLUMN     "seatingType" "SeatingType";

-- AlterTable
ALTER TABLE "EventRegistration" ADD COLUMN     "additionalData" JSONB;

-- AlterTable (conditional, for legacy columns)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'SeatReservation'
      AND column_name = 'attendeeName'
  ) THEN
    ALTER TABLE "SeatReservation" ALTER COLUMN "attendeeName" SET DATA TYPE TEXT;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'SeatReservation'
      AND column_name = 'attendeeEmail'
  ) THEN
    ALTER TABLE "SeatReservation" ALTER COLUMN "attendeeEmail" SET DATA TYPE TEXT;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'SeatReservation'
      AND column_name = 'attendeePhone'
  ) THEN
    ALTER TABLE "SeatReservation" ALTER COLUMN "attendeePhone" SET DATA TYPE TEXT;
  END IF;
END $$;

-- AlterTable
ALTER TABLE "TicketScan" ADD COLUMN     "dayOfEvent" INTEGER,
ADD COLUMN     "durationSeconds" INTEGER,
ADD COLUMN     "sessionId" TEXT;

-- CreateTable
CREATE TABLE "EventSession" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "dayOfEvent" INTEGER NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "capacity" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionAttendance" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "checkedInAt" TIMESTAMP(3),
    "checkedOutAt" TIMESTAMP(3),
    "durationSeconds" INTEGER,
    "attended" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SessionAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EventSession_eventId_idx" ON "EventSession"("eventId");

-- CreateIndex
CREATE INDEX "EventSession_eventId_dayOfEvent_idx" ON "EventSession"("eventId", "dayOfEvent");

-- CreateIndex
CREATE INDEX "EventSession_startTime_idx" ON "EventSession"("startTime");

-- CreateIndex
CREATE INDEX "SessionAttendance_sessionId_idx" ON "SessionAttendance"("sessionId");

-- CreateIndex
CREATE INDEX "SessionAttendance_registrationId_idx" ON "SessionAttendance"("registrationId");

-- CreateIndex
CREATE INDEX "SessionAttendance_checkedInAt_idx" ON "SessionAttendance"("checkedInAt");

-- CreateIndex
CREATE INDEX "SessionAttendance_checkedOutAt_idx" ON "SessionAttendance"("checkedOutAt");

-- CreateIndex
CREATE UNIQUE INDEX "SessionAttendance_sessionId_registrationId_key" ON "SessionAttendance"("sessionId", "registrationId");

-- CreateIndex
CREATE UNIQUE INDEX "SeatReservation_seatId_registrationId_key" ON "SeatReservation"("seatId", "registrationId");

-- CreateIndex
CREATE INDEX "TicketScan_sessionId_idx" ON "TicketScan"("sessionId");

-- CreateIndex
CREATE INDEX "TicketScan_dayOfEvent_idx" ON "TicketScan"("dayOfEvent");

-- AddForeignKey
ALTER TABLE "EventSession" ADD CONSTRAINT "EventSession_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionAttendance" ADD CONSTRAINT "SessionAttendance_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "EventSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionAttendance" ADD CONSTRAINT "SessionAttendance_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "EventRegistration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketScan" ADD CONSTRAINT "TicketScan_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "EventSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
