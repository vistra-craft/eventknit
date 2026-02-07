-- Manual migration SQL for email tracking fields
-- Use this if Prisma migrate dev is having lock issues
-- Run this directly in your PostgreSQL database

-- Add email tracking columns to EventRegistration table
ALTER TABLE "EventRegistration" 
ADD COLUMN IF NOT EXISTS "ticketEmailSentAt" TIMESTAMP,
ADD COLUMN IF NOT EXISTS "ticketEmailStatus" TEXT,
ADD COLUMN IF NOT EXISTS "ticketEmailError" TEXT;

-- Add comments for documentation
COMMENT ON COLUMN "EventRegistration"."ticketEmailSentAt" IS 'When ticket email was sent';
COMMENT ON COLUMN "EventRegistration"."ticketEmailStatus" IS 'SUCCESS, FAILED, or PENDING';
COMMENT ON COLUMN "EventRegistration"."ticketEmailError" IS 'Error message if email failed (max 500 chars)';

-- Create index on email status for faster queries
CREATE INDEX IF NOT EXISTS "EventRegistration_ticketEmailStatus_idx" 
ON "EventRegistration"("ticketEmailStatus");

-- Verify the columns were added
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'EventRegistration'
  AND column_name IN ('ticketEmailSentAt', 'ticketEmailStatus', 'ticketEmailError');


