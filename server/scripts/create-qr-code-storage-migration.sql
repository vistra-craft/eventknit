-- Migration: Add QR Code Storage Fields to EventRegistration
-- This matches Eventbrite/vf-ticket approach of storing QR codes at registration time

-- Add qrCodeDataUrl field (stores base64 data URL of QR code image)
ALTER TABLE "EventRegistration" 
ADD COLUMN IF NOT EXISTS "qrCodeDataUrl" TEXT;

-- Add qrCodeGeneratedAt field (tracks when QR code was generated)
ALTER TABLE "EventRegistration" 
ADD COLUMN IF NOT EXISTS "qrCodeGeneratedAt" TIMESTAMP(3);

-- Create index for faster lookups (optional but recommended)
CREATE INDEX IF NOT EXISTS "EventRegistration_qrCodeGeneratedAt_idx" 
ON "EventRegistration"("qrCodeGeneratedAt");

-- Note: Existing registrations will have NULL values
-- QR codes will be generated on-the-fly when needed (backward compatible)
-- New registrations will have QR codes generated and stored immediately
