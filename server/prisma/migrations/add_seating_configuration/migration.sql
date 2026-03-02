-- AlterTable: Add seating configuration fields to Event
ALTER TABLE "Event" ADD COLUMN "hasSeatingMap" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Event" ADD COLUMN "seatingType" TEXT; -- 'CUSTOMER_SELECTS', 'ORGANIZER_ASSIGNS', 'HYBRID'
ALTER TABLE "Event" ADD COLUMN "seatMapRequired" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: Update SeatReservation to support multiple seats per registration
-- Remove @unique constraint on registrationId
ALTER TABLE "SeatReservation" DROP CONSTRAINT "SeatReservation_registrationId_key";

-- Add attendee information fields
ALTER TABLE "SeatReservation" ADD COLUMN "attendeeName" VARCHAR(255);
ALTER TABLE "SeatReservation" ADD COLUMN "attendeeEmail" VARCHAR(255);
ALTER TABLE "SeatReservation" ADD COLUMN "attendeePhone" VARCHAR(20);
ALTER TABLE "SeatReservation" ADD COLUMN "ticketLineItemId" TEXT;

-- Add composite unique constraint for (seatId, registrationId) to allow multiple seats per registration
ALTER TABLE "SeatReservation" ADD CONSTRAINT "SeatReservation_seatId_registrationId_key" UNIQUE("seatId", "registrationId");

-- Add index for efficient queries
CREATE INDEX "SeatReservation_registrationId_idx" ON "SeatReservation"("registrationId");
CREATE INDEX "SeatReservation_status_idx" ON "SeatReservation"("status");
CREATE INDEX "SeatReservation_ticketLineItemId_idx" ON "SeatReservation"("ticketLineItemId");
