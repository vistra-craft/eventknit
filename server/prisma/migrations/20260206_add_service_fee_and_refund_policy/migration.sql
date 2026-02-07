-- Add service fee and refund policy configuration to Event table
-- AlterTable
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "refundPolicy" TEXT;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "refundPolicyText" TEXT;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "serviceFeePassToAttendee" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "serviceFeeType" TEXT;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "serviceFeeValue" DECIMAL(10,2);

-- Add comment for documentation
COMMENT ON COLUMN "Event"."serviceFeeType" IS 'Service fee type: percentage, fixed, or none';
COMMENT ON COLUMN "Event"."serviceFeeValue" IS 'Service fee value (percentage or fixed amount)';
COMMENT ON COLUMN "Event"."serviceFeePassToAttendee" IS 'If true, fee shown at checkout. If false, absorbed by organizer';
COMMENT ON COLUMN "Event"."refundPolicy" IS 'Refund policy: no_refunds, full_refund, partial_refund, or custom';
COMMENT ON COLUMN "Event"."refundPolicyText" IS 'Custom refund policy text for attendees';
