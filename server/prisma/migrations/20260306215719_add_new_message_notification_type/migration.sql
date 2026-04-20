-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'NEW_MESSAGE';

-- DropIndex
DROP INDEX IF EXISTS "SeatReservation_ticketLineItemId_idx";

-- AlterTable (conditional — columns may not exist on fresh shadow DB)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'SeatReservation'
      AND column_name = 'attendeeName'
  ) THEN
    ALTER TABLE "SeatReservation" ALTER COLUMN "attendeeName" SET DATA TYPE TEXT;
    ALTER TABLE "SeatReservation" ALTER COLUMN "attendeeEmail" SET DATA TYPE TEXT;
    ALTER TABLE "SeatReservation" ALTER COLUMN "attendeePhone" SET DATA TYPE TEXT;
  END IF;
END $$;
