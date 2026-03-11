-- Create CareerInquiry table
CREATE TABLE IF NOT EXISTS "CareerInquiry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "emailSentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),
    "notes" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "source" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "CareerInquiry_email_idx" ON "CareerInquiry"("email");
CREATE INDEX IF NOT EXISTS "CareerInquiry_status_idx" ON "CareerInquiry"("status");
CREATE INDEX IF NOT EXISTS "CareerInquiry_createdAt_idx" ON "CareerInquiry"("createdAt");
