-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'NEW_MESSAGE';

-- DropIndex
DROP INDEX "SeatReservation_ticketLineItemId_idx";

-- AlterTable
ALTER TABLE "SeatReservation" ALTER COLUMN "attendeeName" SET DATA TYPE TEXT,
ALTER COLUMN "attendeeEmail" SET DATA TYPE TEXT,
ALTER COLUMN "attendeePhone" SET DATA TYPE TEXT;
