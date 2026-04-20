-- AlterTable: Add seating configuration fields to Event
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "hasSeatingMap" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "seatingType" TEXT; -- 'CUSTOMER_SELECTS', 'ORGANIZER_ASSIGNS', 'HYBRID'
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "seatMapRequired" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: Update SeatReservation to support multiple seats per registration
-- Only add columns if they don't already exist
ALTER TABLE "SeatReservation" ADD COLUMN IF NOT EXISTS "attendeeName" VARCHAR(255);
ALTER TABLE "SeatReservation" ADD COLUMN IF NOT EXISTS "attendeeEmail" VARCHAR(255);
ALTER TABLE "SeatReservation" ADD COLUMN IF NOT EXISTS "attendeePhone" VARCHAR(20);
ALTER TABLE "SeatReservation" ADD COLUMN IF NOT EXISTS "ticketLineItemId" TEXT;

-- Add indexes if they don't exist
CREATE INDEX IF NOT EXISTS "SeatReservation_registrationId_idx" ON "SeatReservation"("registrationId");
CREATE INDEX IF NOT EXISTS "SeatReservation_status_idx" ON "SeatReservation"("status");
CREATE INDEX IF NOT EXISTS "SeatReservation_ticketLineItemId_idx" ON "SeatReservation"("ticketLineItemId");
