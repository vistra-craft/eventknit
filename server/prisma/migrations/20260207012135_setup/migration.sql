/*
  Warnings:

  - A unique constraint covering the columns `[idempotencyKey]` on the table `EventPaymentTransaction` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[googleId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "PromoCodeScope" AS ENUM ('PLATFORM', 'ORGANIZER', 'EVENT', 'MULTI_EVENT');

-- CreateEnum
CREATE TYPE "SubscriptionTier" AS ENUM ('BASIC', 'STANDARD', 'PREMIUM');

-- CreateEnum
CREATE TYPE "StaffDepartment" AS ENUM ('OPERATIONS', 'CUSTOMER_SERVICE', 'TECHNICAL', 'MANAGEMENT', 'FINANCE', 'MARKETING');

-- CreateEnum
CREATE TYPE "FacilityType" AS ENUM ('CHECK_IN', 'REGISTRATION', 'HYBRID');

-- CreateEnum
CREATE TYPE "CheckpointType" AS ENUM ('DOOR', 'MEAL', 'GIFT', 'SESSION', 'REGISTRATION', 'NETWORKING', 'EXHIBITION', 'CERTIFICATE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "FinancialEntryStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentMethodType" AS ENUM ('CASH', 'BANK_TRANSFER', 'CREDIT_CARD', 'CHECK', 'MOBILE_MONEY', 'MPESA', 'OTHER');

-- CreateEnum
CREATE TYPE "CartStatus" AS ENUM ('ACTIVE', 'RESERVED', 'COMPLETED', 'EXPIRED', 'ABANDONED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "KYCDocumentType" ADD VALUE 'BUSINESS_LICENSE';
ALTER TYPE "KYCDocumentType" ADD VALUE 'TAX_ID';

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'POST_EVENT_SURVEY';

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'ADMIN';

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "autoRefundEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "bannerImage" TEXT,
ADD COLUMN     "basePrice" DECIMAL(10,2),
ADD COLUMN     "coverImage" TEXT,
ADD COLUMN     "eventType" TEXT DEFAULT 'PUBLIC',
ADD COLUMN     "imageFocalX" INTEGER DEFAULT 50,
ADD COLUMN     "imageFocalY" INTEGER DEFAULT 50,
ADD COLUMN     "maxTicketsPerUser" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "refundSLA" INTEGER DEFAULT 0,
ADD COLUMN     "refundTiers" JSONB,
ADD COLUMN     "venueCurrentOccupancy" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "venueMaxCapacity" INTEGER,
ADD COLUMN     "venueName" TEXT;

-- AlterTable
ALTER TABLE "EventPaymentTransaction" ADD COLUMN     "deviceFingerprint" TEXT,
ADD COLUMN     "idempotencyKey" TEXT,
ADD COLUMN     "ipAddress" TEXT,
ADD COLUMN     "riskFlags" JSONB,
ADD COLUMN     "riskScore" DOUBLE PRECISION,
ADD COLUMN     "userAgent" TEXT;

-- AlterTable
ALTER TABLE "EventRegistration" ADD COLUMN     "deviceFingerprint" TEXT,
ADD COLUMN     "ipAddress" TEXT,
ADD COLUMN     "qrCode" TEXT,
ADD COLUMN     "qrSecret" TEXT,
ADD COLUMN     "riskFlags" JSONB,
ADD COLUMN     "riskScore" DOUBLE PRECISION,
ADD COLUMN     "ticketNumber" TEXT,
ADD COLUMN     "ticketPdfGeneratedAt" TIMESTAMP(3),
ADD COLUMN     "ticketPdfStatus" TEXT,
ADD COLUMN     "ticketPdfUrl" TEXT,
ADD COLUMN     "userAgent" TEXT;

-- AlterTable
ALTER TABLE "PasswordReset" ADD COLUMN     "ipAddress" TEXT;

-- AlterTable
ALTER TABLE "PlatformExpense" ADD COLUMN     "notes" TEXT;

-- AlterTable
ALTER TABLE "PlatformIncome" ADD COLUMN     "notes" TEXT;

-- AlterTable
ALTER TABLE "PromoCode" ADD COLUMN     "batchId" TEXT,
ADD COLUMN     "campaignName" TEXT,
ADD COLUMN     "campaignSource" TEXT,
ADD COLUMN     "codePrefix" TEXT,
ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "discountTiers" JSONB,
ADD COLUMN     "eventIds" TEXT[],
ADD COLUMN     "firstTimeOnly" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isReferral" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isStackable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isTiered" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "referrerUserId" TEXT,
ADD COLUMN     "scope" "PromoCodeScope" NOT NULL DEFAULT 'EVENT',
ALTER COLUMN "organizerId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "SMSSession" ADD COLUMN     "paymentAmount" DECIMAL(10,2),
ADD COLUMN     "paymentCompletedAt" TIMESTAMP(3),
ADD COLUMN     "paymentCurrency" TEXT DEFAULT 'KES',
ADD COLUMN     "paymentGateway" TEXT,
ADD COLUMN     "paymentInitiatedAt" TIMESTAMP(3),
ADD COLUMN     "paymentReceiptNumber" TEXT,
ADD COLUMN     "paymentReference" TEXT,
ADD COLUMN     "paymentRequired" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "paymentStatus" TEXT DEFAULT 'pending';

-- AlterTable
ALTER TABLE "TicketScan" ADD COLUMN     "facilityId" TEXT;

-- AlterTable
ALTER TABLE "TicketTransfer" ADD COLUMN     "parentTransferId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "googleId" TEXT;

-- CreateTable
CREATE TABLE "StaffProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "employeeId" TEXT,
    "department" "StaffDepartment" NOT NULL DEFAULT 'OPERATIONS',
    "location" TEXT,
    "hireDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "salary" DECIMAL(12,2),
    "hourlyRate" DECIMAL(8,2),
    "permissions" JSONB DEFAULT '{}',
    "totalHours" DECIMAL(10,2) DEFAULT 0,
    "rating" DECIMAL(3,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "website" TEXT,
    "description" TEXT,
    "businessLicense" TEXT,
    "taxId" TEXT,
    "bankAccountLast4" TEXT,
    "location" TEXT,
    "totalEvents" INTEGER NOT NULL DEFAULT 0,
    "totalRevenue" DECIMAL(14,2) DEFAULT 0,
    "rating" DECIMAL(3,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmergencyContact" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmergencyContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendeeConsent" (
    "id" TEXT NOT NULL,
    "attendeeId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "operationalConsent" BOOLEAN NOT NULL DEFAULT true,
    "marketingConsent" BOOLEAN NOT NULL DEFAULT false,
    "demographicsConsent" BOOLEAN NOT NULL DEFAULT false,
    "analyticsConsent" BOOLEAN NOT NULL DEFAULT false,
    "consentedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "consentVersion" TEXT NOT NULL DEFAULT '1.0',

    CONSTRAINT "AttendeeConsent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizerSubscription" (
    "id" TEXT NOT NULL,
    "organizerId" TEXT NOT NULL,
    "tier" "SubscriptionTier" NOT NULL DEFAULT 'BASIC',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "canceledAt" TIMESTAMP(3),
    "billingEmail" TEXT,
    "nextBillingDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizerSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataAccessAuditLog" (
    "id" TEXT NOT NULL,
    "organizerId" TEXT NOT NULL,
    "attendeeId" TEXT,
    "eventId" TEXT,
    "action" TEXT NOT NULL,
    "dataType" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "details" JSONB,

    CONSTRAINT "DataAccessAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventFacility" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "location" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "allowCheckIn" BOOLEAN NOT NULL DEFAULT true,
    "allowCheckOut" BOOLEAN NOT NULL DEFAULT true,
    "allowRegistration" BOOLEAN NOT NULL DEFAULT false,
    "facilityType" "FacilityType" NOT NULL DEFAULT 'CHECK_IN',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "maxCapacity" INTEGER,
    "currentOccupancy" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventFacility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Checkpoint" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CheckpointType" NOT NULL DEFAULT 'CUSTOM',
    "description" TEXT,
    "location" TEXT,
    "stationCode" TEXT,
    "quota" INTEGER NOT NULL DEFAULT 1,
    "quotaEnforced" BOOLEAN NOT NULL DEFAULT true,
    "eligibilityRules" JSONB,
    "activeFrom" TIMESTAMP(3),
    "activeTo" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "Checkpoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CheckpointScan" (
    "id" TEXT NOT NULL,
    "checkpointId" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "scannedBy" TEXT NOT NULL,
    "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isValid" BOOLEAN NOT NULL DEFAULT true,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "scanNumber" INTEGER NOT NULL,
    "deviceId" TEXT,
    "deviceType" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "location" JSONB,
    "notes" TEXT,

    CONSTRAINT "CheckpointScan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CheckpointStaff" (
    "id" TEXT NOT NULL,
    "checkpointId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT NOT NULL,
    "shiftStart" TIMESTAMP(3),
    "shiftEnd" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CheckpointStaff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentWebhookEvent" (
    "id" TEXT NOT NULL,
    "gatewayEventId" TEXT NOT NULL,
    "gateway" TEXT NOT NULL DEFAULT 'PAYSTACK',
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "reference" TEXT,
    "registrationId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PROCESSED',
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentWebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailDigestQueue" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "digestType" TEXT NOT NULL,
    "priority" "NotificationPriority" NOT NULL DEFAULT 'MEDIUM',
    "notificationType" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "eventId" TEXT,
    "eventTitle" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailDigestQueue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "userAgent" TEXT,
    "deviceId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUsed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "failCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MobileDevice" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fcmToken" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "deviceId" TEXT,
    "deviceModel" TEXT,
    "osVersion" TEXT,
    "appVersion" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUsed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "failCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MobileDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataExportRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "exportData" JSONB,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataExportRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "USSDSession" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "serviceCode" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "currentLevel" INTEGER NOT NULL DEFAULT 0,
    "menuPath" TEXT[],
    "currentMenu" TEXT NOT NULL DEFAULT 'main',
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "jobTitle" TEXT,
    "organization" TEXT,
    "eventId" TEXT,
    "eventCode" TEXT,
    "eventTitle" TEXT,
    "ticketTypeId" TEXT,
    "ticketTypeName" TEXT,
    "paymentRequired" BOOLEAN NOT NULL DEFAULT false,
    "paymentAmount" DECIMAL(10,2),
    "paymentCurrency" TEXT DEFAULT 'KES',
    "paymentStatus" TEXT DEFAULT 'pending',
    "paymentReference" TEXT,
    "paymentReceiptNumber" TEXT,
    "paymentInitiatedAt" TIMESTAMP(3),
    "paymentCompletedAt" TIMESTAMP(3),
    "userId" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "cancelled" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "USSDSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServicePointSession" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "facilityId" TEXT,
    "phoneNumber" TEXT NOT NULL,
    "otp" TEXT NOT NULL,
    "otpExpiresAt" TIMESTAMP(3) NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "staffId" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "company" TEXT,
    "industry" TEXT,
    "jobTitle" TEXT,
    "ticketTypeId" TEXT,
    "registrationId" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "cancelled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServicePointSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventFeedback" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userType" TEXT NOT NULL,
    "npsScore" INTEGER NOT NULL,
    "comment" TEXT,
    "eventQuality" INTEGER,
    "platformUsability" INTEGER,
    "registrationProcess" INTEGER,
    "communicationQuality" INTEGER,
    "improvementAreas" TEXT[],
    "wouldUseAgain" BOOLEAN,
    "wouldRecommend" BOOLEAN,
    "emailSentAt" TIMESTAMP(3),
    "feedbackToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "submittedVia" TEXT NOT NULL DEFAULT 'PLATFORM',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserCredit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "balance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserCredit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditTransaction" (
    "id" TEXT NOT NULL,
    "creditId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "balanceAfter" DECIMAL(12,2) NOT NULL,
    "description" TEXT NOT NULL,
    "reference" TEXT,
    "referenceType" TEXT,
    "voucherCode" TEXT,
    "expiresAt" TIMESTAMP(3),
    "initiatedBy" TEXT,
    "eventId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Voucher" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "maxUses" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "usesPerUser" INTEGER NOT NULL DEFAULT 1,
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "eventId" TEXT,
    "organizerId" TEXT,
    "minPurchaseAmount" DECIMAL(12,2),
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Voucher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoucherRedemption" (
    "id" TEXT NOT NULL,
    "voucherId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "orderId" TEXT,
    "eventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VoucherRedemption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "SavedEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wage" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT,
    "employeeName" TEXT NOT NULL,
    "department" TEXT,
    "position" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "payPeriod" TEXT NOT NULL,
    "payDate" TIMESTAMP(3) NOT NULL,
    "status" "FinancialEntryStatus" NOT NULL DEFAULT 'PENDING',
    "paymentMethod" "PaymentMethodType" NOT NULL DEFAULT 'BANK_TRANSFER',
    "reference" TEXT,
    "notes" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Income" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "source" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "date" TIMESTAMP(3) NOT NULL,
    "status" "FinancialEntryStatus" NOT NULL DEFAULT 'COMPLETED',
    "paymentMethod" "PaymentMethodType",
    "reference" TEXT,
    "notes" TEXT,
    "eventId" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Income_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "recipient" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "date" TIMESTAMP(3) NOT NULL,
    "status" "FinancialEntryStatus" NOT NULL DEFAULT 'COMPLETED',
    "paymentMethod" "PaymentMethodType",
    "reference" TEXT,
    "notes" TEXT,
    "eventId" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BadgeTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "width" DOUBLE PRECISION NOT NULL DEFAULT 101.6,
    "height" DOUBLE PRECISION NOT NULL DEFAULT 76.2,
    "sizePreset" TEXT NOT NULL DEFAULT '4x3',
    "orientation" TEXT NOT NULL DEFAULT 'landscape',
    "backgroundColor" TEXT NOT NULL DEFAULT '#ffffff',
    "backgroundImage" TEXT,
    "elements" JSONB NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "organizerId" TEXT,
    "eventId" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BadgeTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BadgePrintJob" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "error" TEXT,
    "printedAt" TIMESTAMP(3),
    "printedBy" TEXT,
    "printerInfo" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BadgePrintJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendeeImport" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "importedBy" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "totalRows" INTEGER NOT NULL,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "sendWelcomeEmails" BOOLEAN NOT NULL DEFAULT false,
    "errors" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "AttendeeImport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacilityZone" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "maxCapacity" INTEGER,
    "currentOccupancy" INTEGER NOT NULL DEFAULT 0,
    "accessStart" TIMESTAMP(3),
    "accessEnd" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FacilityZone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacilityZoneMapping" (
    "id" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FacilityZoneMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendeeZoneAccess" (
    "id" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "grantedBy" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "accessCount" INTEGER NOT NULL DEFAULT 0,
    "lastAccessAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendeeZoneAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacilityMovement" (
    "id" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "fromZoneId" TEXT,
    "toZoneId" TEXT NOT NULL,
    "movementType" TEXT NOT NULL,
    "sequenceNumber" INTEGER NOT NULL,
    "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scannedBy" TEXT NOT NULL,
    "deviceInfo" JSONB,

    CONSTRAINT "FacilityMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Printer" (
    "id" TEXT NOT NULL,
    "eventId" TEXT,
    "name" TEXT NOT NULL,
    "driver" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "host" TEXT,
    "port" INTEGER,
    "apiKey" TEXT,
    "supportedSizes" TEXT[],
    "paperSize" TEXT,
    "orientation" TEXT,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastChecked" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "Printer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrintJob" (
    "id" TEXT NOT NULL,
    "printerId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "copies" INTEGER NOT NULL DEFAULT 1,
    "pdfUrl" TEXT,
    "sentToPrinter" TIMESTAMP(3),
    "printedAt" TIMESTAMP(3),
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "errorMessage" TEXT,
    "jobMetadata" JSONB,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrintJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CartReservation" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT NOT NULL,
    "fingerprint" TEXT,
    "status" "CartStatus" NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "reservedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CartReservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CartItem" (
    "id" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "ticketType" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "seatIds" TEXT[],
    "promoCodeId" TEXT,
    "discountAmount" DECIMAL(10,2),
    "inventoryLocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareerInquiry" (
    "id" TEXT NOT NULL,
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareerInquiry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StaffProfile_userId_key" ON "StaffProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "StaffProfile_employeeId_key" ON "StaffProfile"("employeeId");

-- CreateIndex
CREATE INDEX "StaffProfile_department_idx" ON "StaffProfile"("department");

-- CreateIndex
CREATE INDEX "StaffProfile_employeeId_idx" ON "StaffProfile"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizerProfile_userId_key" ON "OrganizerProfile"("userId");

-- CreateIndex
CREATE INDEX "OrganizerProfile_userId_idx" ON "OrganizerProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "EmergencyContact_userId_key" ON "EmergencyContact"("userId");

-- CreateIndex
CREATE INDEX "EmergencyContact_userId_idx" ON "EmergencyContact"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AttendeeConsent_registrationId_key" ON "AttendeeConsent"("registrationId");

-- CreateIndex
CREATE INDEX "AttendeeConsent_attendeeId_idx" ON "AttendeeConsent"("attendeeId");

-- CreateIndex
CREATE INDEX "AttendeeConsent_eventId_idx" ON "AttendeeConsent"("eventId");

-- CreateIndex
CREATE INDEX "AttendeeConsent_registrationId_idx" ON "AttendeeConsent"("registrationId");

-- CreateIndex
CREATE INDEX "AttendeeConsent_marketingConsent_idx" ON "AttendeeConsent"("marketingConsent");

-- CreateIndex
CREATE INDEX "AttendeeConsent_demographicsConsent_idx" ON "AttendeeConsent"("demographicsConsent");

-- CreateIndex
CREATE INDEX "AttendeeConsent_analyticsConsent_idx" ON "AttendeeConsent"("analyticsConsent");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizerSubscription_organizerId_key" ON "OrganizerSubscription"("organizerId");

-- CreateIndex
CREATE INDEX "OrganizerSubscription_organizerId_idx" ON "OrganizerSubscription"("organizerId");

-- CreateIndex
CREATE INDEX "OrganizerSubscription_tier_idx" ON "OrganizerSubscription"("tier");

-- CreateIndex
CREATE INDEX "OrganizerSubscription_isActive_idx" ON "OrganizerSubscription"("isActive");

-- CreateIndex
CREATE INDEX "OrganizerSubscription_expiresAt_idx" ON "OrganizerSubscription"("expiresAt");

-- CreateIndex
CREATE INDEX "DataAccessAuditLog_organizerId_idx" ON "DataAccessAuditLog"("organizerId");

-- CreateIndex
CREATE INDEX "DataAccessAuditLog_attendeeId_idx" ON "DataAccessAuditLog"("attendeeId");

-- CreateIndex
CREATE INDEX "DataAccessAuditLog_eventId_idx" ON "DataAccessAuditLog"("eventId");

-- CreateIndex
CREATE INDEX "DataAccessAuditLog_timestamp_idx" ON "DataAccessAuditLog"("timestamp");

-- CreateIndex
CREATE INDEX "DataAccessAuditLog_action_idx" ON "DataAccessAuditLog"("action");

-- CreateIndex
CREATE INDEX "DataAccessAuditLog_dataType_idx" ON "DataAccessAuditLog"("dataType");

-- CreateIndex
CREATE INDEX "EventFacility_eventId_idx" ON "EventFacility"("eventId");

-- CreateIndex
CREATE INDEX "EventFacility_eventId_isActive_idx" ON "EventFacility"("eventId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "EventFacility_eventId_code_key" ON "EventFacility"("eventId", "code");

-- CreateIndex
CREATE INDEX "Checkpoint_eventId_idx" ON "Checkpoint"("eventId");

-- CreateIndex
CREATE INDEX "Checkpoint_type_idx" ON "Checkpoint"("type");

-- CreateIndex
CREATE INDEX "Checkpoint_isActive_idx" ON "Checkpoint"("isActive");

-- CreateIndex
CREATE INDEX "Checkpoint_activeFrom_activeTo_idx" ON "Checkpoint"("activeFrom", "activeTo");

-- CreateIndex
CREATE UNIQUE INDEX "Checkpoint_eventId_stationCode_key" ON "Checkpoint"("eventId", "stationCode");

-- CreateIndex
CREATE INDEX "CheckpointScan_checkpointId_idx" ON "CheckpointScan"("checkpointId");

-- CreateIndex
CREATE INDEX "CheckpointScan_registrationId_idx" ON "CheckpointScan"("registrationId");

-- CreateIndex
CREATE INDEX "CheckpointScan_eventId_idx" ON "CheckpointScan"("eventId");

-- CreateIndex
CREATE INDEX "CheckpointScan_scannedAt_idx" ON "CheckpointScan"("scannedAt");

-- CreateIndex
CREATE INDEX "CheckpointScan_scannedBy_idx" ON "CheckpointScan"("scannedBy");

-- CreateIndex
CREATE INDEX "CheckpointStaff_checkpointId_idx" ON "CheckpointStaff"("checkpointId");

-- CreateIndex
CREATE INDEX "CheckpointStaff_staffId_idx" ON "CheckpointStaff"("staffId");

-- CreateIndex
CREATE INDEX "CheckpointStaff_isActive_idx" ON "CheckpointStaff"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "CheckpointStaff_checkpointId_staffId_key" ON "CheckpointStaff"("checkpointId", "staffId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentWebhookEvent_gatewayEventId_key" ON "PaymentWebhookEvent"("gatewayEventId");

-- CreateIndex
CREATE INDEX "PaymentWebhookEvent_gateway_idx" ON "PaymentWebhookEvent"("gateway");

-- CreateIndex
CREATE INDEX "PaymentWebhookEvent_eventType_idx" ON "PaymentWebhookEvent"("eventType");

-- CreateIndex
CREATE INDEX "PaymentWebhookEvent_reference_idx" ON "PaymentWebhookEvent"("reference");

-- CreateIndex
CREATE INDEX "PaymentWebhookEvent_registrationId_idx" ON "PaymentWebhookEvent"("registrationId");

-- CreateIndex
CREATE INDEX "PaymentWebhookEvent_processedAt_idx" ON "PaymentWebhookEvent"("processedAt");

-- CreateIndex
CREATE INDEX "EmailDigestQueue_userId_status_idx" ON "EmailDigestQueue"("userId", "status");

-- CreateIndex
CREATE INDEX "EmailDigestQueue_digestType_status_idx" ON "EmailDigestQueue"("digestType", "status");

-- CreateIndex
CREATE INDEX "EmailDigestQueue_createdAt_idx" ON "EmailDigestQueue"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");

-- CreateIndex
CREATE INDEX "PushSubscription_userId_idx" ON "PushSubscription"("userId");

-- CreateIndex
CREATE INDEX "PushSubscription_isActive_idx" ON "PushSubscription"("isActive");

-- CreateIndex
CREATE INDEX "PushSubscription_endpoint_idx" ON "PushSubscription"("endpoint");

-- CreateIndex
CREATE UNIQUE INDEX "MobileDevice_fcmToken_key" ON "MobileDevice"("fcmToken");

-- CreateIndex
CREATE INDEX "MobileDevice_userId_idx" ON "MobileDevice"("userId");

-- CreateIndex
CREATE INDEX "MobileDevice_isActive_idx" ON "MobileDevice"("isActive");

-- CreateIndex
CREATE INDEX "MobileDevice_fcmToken_idx" ON "MobileDevice"("fcmToken");

-- CreateIndex
CREATE INDEX "MobileDevice_platform_idx" ON "MobileDevice"("platform");

-- CreateIndex
CREATE UNIQUE INDEX "DataExportRequest_token_key" ON "DataExportRequest"("token");

-- CreateIndex
CREATE INDEX "DataExportRequest_userId_idx" ON "DataExportRequest"("userId");

-- CreateIndex
CREATE INDEX "DataExportRequest_token_idx" ON "DataExportRequest"("token");

-- CreateIndex
CREATE INDEX "DataExportRequest_expiresAt_idx" ON "DataExportRequest"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "USSDSession_sessionId_key" ON "USSDSession"("sessionId");

-- CreateIndex
CREATE INDEX "USSDSession_sessionId_idx" ON "USSDSession"("sessionId");

-- CreateIndex
CREATE INDEX "USSDSession_phoneNumber_idx" ON "USSDSession"("phoneNumber");

-- CreateIndex
CREATE INDEX "USSDSession_eventCode_idx" ON "USSDSession"("eventCode");

-- CreateIndex
CREATE INDEX "USSDSession_paymentReference_idx" ON "USSDSession"("paymentReference");

-- CreateIndex
CREATE INDEX "USSDSession_expiresAt_idx" ON "USSDSession"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "ServicePointSession_registrationId_key" ON "ServicePointSession"("registrationId");

-- CreateIndex
CREATE INDEX "ServicePointSession_eventId_idx" ON "ServicePointSession"("eventId");

-- CreateIndex
CREATE INDEX "ServicePointSession_phoneNumber_idx" ON "ServicePointSession"("phoneNumber");

-- CreateIndex
CREATE INDEX "ServicePointSession_otp_idx" ON "ServicePointSession"("otp");

-- CreateIndex
CREATE INDEX "ServicePointSession_staffId_idx" ON "ServicePointSession"("staffId");

-- CreateIndex
CREATE INDEX "ServicePointSession_verified_idx" ON "ServicePointSession"("verified");

-- CreateIndex
CREATE INDEX "ServicePointSession_otpExpiresAt_idx" ON "ServicePointSession"("otpExpiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "EventFeedback_feedbackToken_key" ON "EventFeedback"("feedbackToken");

-- CreateIndex
CREATE INDEX "EventFeedback_eventId_idx" ON "EventFeedback"("eventId");

-- CreateIndex
CREATE INDEX "EventFeedback_userId_idx" ON "EventFeedback"("userId");

-- CreateIndex
CREATE INDEX "EventFeedback_userType_idx" ON "EventFeedback"("userType");

-- CreateIndex
CREATE INDEX "EventFeedback_npsScore_idx" ON "EventFeedback"("npsScore");

-- CreateIndex
CREATE INDEX "EventFeedback_createdAt_idx" ON "EventFeedback"("createdAt");

-- CreateIndex
CREATE INDEX "EventFeedback_feedbackToken_idx" ON "EventFeedback"("feedbackToken");

-- CreateIndex
CREATE UNIQUE INDEX "EventFeedback_eventId_userId_key" ON "EventFeedback"("eventId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserCredit_userId_key" ON "UserCredit"("userId");

-- CreateIndex
CREATE INDEX "UserCredit_userId_idx" ON "UserCredit"("userId");

-- CreateIndex
CREATE INDEX "CreditTransaction_creditId_idx" ON "CreditTransaction"("creditId");

-- CreateIndex
CREATE INDEX "CreditTransaction_type_idx" ON "CreditTransaction"("type");

-- CreateIndex
CREATE INDEX "CreditTransaction_createdAt_idx" ON "CreditTransaction"("createdAt");

-- CreateIndex
CREATE INDEX "CreditTransaction_voucherCode_idx" ON "CreditTransaction"("voucherCode");

-- CreateIndex
CREATE UNIQUE INDEX "Voucher_code_key" ON "Voucher"("code");

-- CreateIndex
CREATE INDEX "Voucher_code_idx" ON "Voucher"("code");

-- CreateIndex
CREATE INDEX "Voucher_eventId_idx" ON "Voucher"("eventId");

-- CreateIndex
CREATE INDEX "Voucher_organizerId_idx" ON "Voucher"("organizerId");

-- CreateIndex
CREATE INDEX "Voucher_validUntil_idx" ON "Voucher"("validUntil");

-- CreateIndex
CREATE INDEX "VoucherRedemption_voucherId_idx" ON "VoucherRedemption"("voucherId");

-- CreateIndex
CREATE INDEX "VoucherRedemption_userId_idx" ON "VoucherRedemption"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VoucherRedemption_voucherId_userId_key" ON "VoucherRedemption"("voucherId", "userId");

-- CreateIndex
CREATE INDEX "SavedEvent_userId_idx" ON "SavedEvent"("userId");

-- CreateIndex
CREATE INDEX "SavedEvent_eventId_idx" ON "SavedEvent"("eventId");

-- CreateIndex
CREATE INDEX "SavedEvent_savedAt_idx" ON "SavedEvent"("savedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SavedEvent_userId_eventId_key" ON "SavedEvent"("userId", "eventId");

-- CreateIndex
CREATE INDEX "Wage_employeeId_idx" ON "Wage"("employeeId");

-- CreateIndex
CREATE INDEX "Wage_payDate_idx" ON "Wage"("payDate");

-- CreateIndex
CREATE INDEX "Wage_status_idx" ON "Wage"("status");

-- CreateIndex
CREATE INDEX "Wage_department_idx" ON "Wage"("department");

-- CreateIndex
CREATE INDEX "Income_category_idx" ON "Income"("category");

-- CreateIndex
CREATE INDEX "Income_date_idx" ON "Income"("date");

-- CreateIndex
CREATE INDEX "Income_status_idx" ON "Income"("status");

-- CreateIndex
CREATE INDEX "Income_eventId_idx" ON "Income"("eventId");

-- CreateIndex
CREATE INDEX "Expense_category_idx" ON "Expense"("category");

-- CreateIndex
CREATE INDEX "Expense_date_idx" ON "Expense"("date");

-- CreateIndex
CREATE INDEX "Expense_status_idx" ON "Expense"("status");

-- CreateIndex
CREATE INDEX "Expense_eventId_idx" ON "Expense"("eventId");

-- CreateIndex
CREATE INDEX "BadgeTemplate_organizerId_idx" ON "BadgeTemplate"("organizerId");

-- CreateIndex
CREATE INDEX "BadgeTemplate_eventId_idx" ON "BadgeTemplate"("eventId");

-- CreateIndex
CREATE INDEX "BadgeTemplate_isDefault_idx" ON "BadgeTemplate"("isDefault");

-- CreateIndex
CREATE INDEX "BadgeTemplate_isActive_idx" ON "BadgeTemplate"("isActive");

-- CreateIndex
CREATE INDEX "BadgePrintJob_eventId_idx" ON "BadgePrintJob"("eventId");

-- CreateIndex
CREATE INDEX "BadgePrintJob_registrationId_idx" ON "BadgePrintJob"("registrationId");

-- CreateIndex
CREATE INDEX "BadgePrintJob_status_idx" ON "BadgePrintJob"("status");

-- CreateIndex
CREATE INDEX "BadgePrintJob_printedAt_idx" ON "BadgePrintJob"("printedAt");

-- CreateIndex
CREATE INDEX "AttendeeImport_eventId_idx" ON "AttendeeImport"("eventId");

-- CreateIndex
CREATE INDEX "AttendeeImport_status_idx" ON "AttendeeImport"("status");

-- CreateIndex
CREATE INDEX "AttendeeImport_createdAt_idx" ON "AttendeeImport"("createdAt");

-- CreateIndex
CREATE INDEX "FacilityZone_eventId_isActive_idx" ON "FacilityZone"("eventId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "FacilityZone_eventId_code_key" ON "FacilityZone"("eventId", "code");

-- CreateIndex
CREATE INDEX "FacilityZoneMapping_facilityId_idx" ON "FacilityZoneMapping"("facilityId");

-- CreateIndex
CREATE INDEX "FacilityZoneMapping_zoneId_idx" ON "FacilityZoneMapping"("zoneId");

-- CreateIndex
CREATE UNIQUE INDEX "FacilityZoneMapping_facilityId_zoneId_key" ON "FacilityZoneMapping"("facilityId", "zoneId");

-- CreateIndex
CREATE INDEX "AttendeeZoneAccess_registrationId_idx" ON "AttendeeZoneAccess"("registrationId");

-- CreateIndex
CREATE INDEX "AttendeeZoneAccess_zoneId_isActive_idx" ON "AttendeeZoneAccess"("zoneId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "AttendeeZoneAccess_registrationId_zoneId_key" ON "AttendeeZoneAccess"("registrationId", "zoneId");

-- CreateIndex
CREATE INDEX "FacilityMovement_registrationId_scannedAt_idx" ON "FacilityMovement"("registrationId", "scannedAt");

-- CreateIndex
CREATE INDEX "FacilityMovement_eventId_scannedAt_idx" ON "FacilityMovement"("eventId", "scannedAt");

-- CreateIndex
CREATE INDEX "FacilityMovement_fromZoneId_idx" ON "FacilityMovement"("fromZoneId");

-- CreateIndex
CREATE INDEX "FacilityMovement_toZoneId_idx" ON "FacilityMovement"("toZoneId");

-- CreateIndex
CREATE INDEX "Printer_eventId_isActive_idx" ON "Printer"("eventId", "isActive");

-- CreateIndex
CREATE INDEX "Printer_driver_isOnline_idx" ON "Printer"("driver", "isOnline");

-- CreateIndex
CREATE INDEX "PrintJob_printerId_status_idx" ON "PrintJob"("printerId", "status");

-- CreateIndex
CREATE INDEX "PrintJob_status_priority_createdAt_idx" ON "PrintJob"("status", "priority", "createdAt");

-- CreateIndex
CREATE INDEX "PrintJob_registrationId_idx" ON "PrintJob"("registrationId");

-- CreateIndex
CREATE INDEX "PrintJob_templateId_idx" ON "PrintJob"("templateId");

-- CreateIndex
CREATE INDEX "PrintJob_createdAt_idx" ON "PrintJob"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CartReservation_sessionId_key" ON "CartReservation"("sessionId");

-- CreateIndex
CREATE INDEX "CartReservation_userId_idx" ON "CartReservation"("userId");

-- CreateIndex
CREATE INDEX "CartReservation_sessionId_idx" ON "CartReservation"("sessionId");

-- CreateIndex
CREATE INDEX "CartReservation_status_idx" ON "CartReservation"("status");

-- CreateIndex
CREATE INDEX "CartReservation_expiresAt_idx" ON "CartReservation"("expiresAt");

-- CreateIndex
CREATE INDEX "CartItem_cartId_idx" ON "CartItem"("cartId");

-- CreateIndex
CREATE INDEX "CartItem_eventId_idx" ON "CartItem"("eventId");

-- CreateIndex
CREATE INDEX "CartItem_ticketType_idx" ON "CartItem"("ticketType");

-- CreateIndex
CREATE INDEX "CareerInquiry_email_idx" ON "CareerInquiry"("email");

-- CreateIndex
CREATE INDEX "CareerInquiry_status_idx" ON "CareerInquiry"("status");

-- CreateIndex
CREATE INDEX "CareerInquiry_createdAt_idx" ON "CareerInquiry"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "EventPaymentTransaction_idempotencyKey_key" ON "EventPaymentTransaction"("idempotencyKey");

-- CreateIndex
CREATE INDEX "EventPaymentTransaction_idempotencyKey_idx" ON "EventPaymentTransaction"("idempotencyKey");

-- CreateIndex
CREATE INDEX "PromoCode_scope_idx" ON "PromoCode"("scope");

-- CreateIndex
CREATE INDEX "PromoCode_batchId_idx" ON "PromoCode"("batchId");

-- CreateIndex
CREATE INDEX "SMSSession_paymentReference_idx" ON "SMSSession"("paymentReference");

-- CreateIndex
CREATE INDEX "SMSSession_paymentStatus_idx" ON "SMSSession"("paymentStatus");

-- CreateIndex
CREATE INDEX "TicketScan_facilityId_idx" ON "TicketScan"("facilityId");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- AddForeignKey
ALTER TABLE "StaffProfile" ADD CONSTRAINT "StaffProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizerProfile" ADD CONSTRAINT "OrganizerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmergencyContact" ADD CONSTRAINT "EmergencyContact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendeeConsent" ADD CONSTRAINT "AttendeeConsent_attendeeId_fkey" FOREIGN KEY ("attendeeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendeeConsent" ADD CONSTRAINT "AttendeeConsent_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendeeConsent" ADD CONSTRAINT "AttendeeConsent_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "EventRegistration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizerSubscription" ADD CONSTRAINT "OrganizerSubscription_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataAccessAuditLog" ADD CONSTRAINT "DataAccessAuditLog_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromoCode" ADD CONSTRAINT "PromoCode_referrerUserId_fkey" FOREIGN KEY ("referrerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketScan" ADD CONSTRAINT "TicketScan_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "EventFacility"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventFacility" ADD CONSTRAINT "EventFacility_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Checkpoint" ADD CONSTRAINT "Checkpoint_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckpointScan" ADD CONSTRAINT "CheckpointScan_checkpointId_fkey" FOREIGN KEY ("checkpointId") REFERENCES "Checkpoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckpointScan" ADD CONSTRAINT "CheckpointScan_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "EventRegistration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckpointScan" ADD CONSTRAINT "CheckpointScan_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckpointStaff" ADD CONSTRAINT "CheckpointStaff_checkpointId_fkey" FOREIGN KEY ("checkpointId") REFERENCES "Checkpoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckpointStaff" ADD CONSTRAINT "CheckpointStaff_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailDigestQueue" ADD CONSTRAINT "EmailDigestQueue_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MobileDevice" ADD CONSTRAINT "MobileDevice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataExportRequest" ADD CONSTRAINT "DataExportRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "USSDSession" ADD CONSTRAINT "USSDSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServicePointSession" ADD CONSTRAINT "ServicePointSession_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServicePointSession" ADD CONSTRAINT "ServicePointSession_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "EventFacility"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServicePointSession" ADD CONSTRAINT "ServicePointSession_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServicePointSession" ADD CONSTRAINT "ServicePointSession_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "EventRegistration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventFeedback" ADD CONSTRAINT "EventFeedback_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventFeedback" ADD CONSTRAINT "EventFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketTransfer" ADD CONSTRAINT "TicketTransfer_parentTransferId_fkey" FOREIGN KEY ("parentTransferId") REFERENCES "TicketTransfer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCredit" ADD CONSTRAINT "UserCredit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditTransaction" ADD CONSTRAINT "CreditTransaction_creditId_fkey" FOREIGN KEY ("creditId") REFERENCES "UserCredit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditTransaction" ADD CONSTRAINT "CreditTransaction_initiatedBy_fkey" FOREIGN KEY ("initiatedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditTransaction" ADD CONSTRAINT "CreditTransaction_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voucher" ADD CONSTRAINT "Voucher_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voucher" ADD CONSTRAINT "Voucher_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voucher" ADD CONSTRAINT "Voucher_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoucherRedemption" ADD CONSTRAINT "VoucherRedemption_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "Voucher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoucherRedemption" ADD CONSTRAINT "VoucherRedemption_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedEvent" ADD CONSTRAINT "SavedEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedEvent" ADD CONSTRAINT "SavedEvent_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Income" ADD CONSTRAINT "Income_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BadgeTemplate" ADD CONSTRAINT "BadgeTemplate_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "OrganizerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BadgeTemplate" ADD CONSTRAINT "BadgeTemplate_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BadgePrintJob" ADD CONSTRAINT "BadgePrintJob_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BadgePrintJob" ADD CONSTRAINT "BadgePrintJob_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "EventRegistration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendeeImport" ADD CONSTRAINT "AttendeeImport_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacilityZone" ADD CONSTRAINT "FacilityZone_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacilityZoneMapping" ADD CONSTRAINT "FacilityZoneMapping_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "EventFacility"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacilityZoneMapping" ADD CONSTRAINT "FacilityZoneMapping_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "FacilityZone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendeeZoneAccess" ADD CONSTRAINT "AttendeeZoneAccess_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "EventRegistration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendeeZoneAccess" ADD CONSTRAINT "AttendeeZoneAccess_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "FacilityZone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacilityMovement" ADD CONSTRAINT "FacilityMovement_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "EventRegistration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacilityMovement" ADD CONSTRAINT "FacilityMovement_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacilityMovement" ADD CONSTRAINT "FacilityMovement_fromZoneId_fkey" FOREIGN KEY ("fromZoneId") REFERENCES "FacilityZone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacilityMovement" ADD CONSTRAINT "FacilityMovement_toZoneId_fkey" FOREIGN KEY ("toZoneId") REFERENCES "FacilityZone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Printer" ADD CONSTRAINT "Printer_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrintJob" ADD CONSTRAINT "PrintJob_printerId_fkey" FOREIGN KEY ("printerId") REFERENCES "Printer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrintJob" ADD CONSTRAINT "PrintJob_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "BadgeTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrintJob" ADD CONSTRAINT "PrintJob_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "EventRegistration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartReservation" ADD CONSTRAINT "CartReservation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "CartReservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
