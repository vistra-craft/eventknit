/*
  Warnings:

  - You are about to drop the column `paystackAmount` on the `EventPaymentTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `paystackMetadata` on the `EventPaymentTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `paystackReference` on the `EventPaymentTransaction` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[gatewayReference]` on the table `EventPaymentTransaction` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `gatewayAmount` to the `EventPaymentTransaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gatewayReference` to the `EventPaymentTransaction` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SeatStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'BOOKED', 'BLOCKED', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "SeatType" AS ENUM ('STANDARD', 'VIP', 'PREMIUM', 'WHEELCHAIR', 'COMPANION', 'STANDING');

-- CreateEnum
CREATE TYPE "CustomDomainStatus" AS ENUM ('PENDING', 'VERIFIED', 'FAILED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "BrandingStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING_APPROVAL');

-- DropIndex
DROP INDEX "EventPaymentTransaction_paystackReference_idx";

-- DropIndex
DROP INDEX "EventPaymentTransaction_paystackReference_key";

-- AlterTable
ALTER TABLE "BulkMessage" ALTER COLUMN "createdBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "EmailTemplate" ALTER COLUMN "createdBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "agenda" JSONB,
ADD COLUMN     "exhibitors" JSONB,
ADD COLUMN     "socialLinks" JSONB;

-- AlterTable
ALTER TABLE "EventInvitation" ALTER COLUMN "createdBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "EventPaymentTransaction" DROP COLUMN "paystackAmount",
DROP COLUMN "paystackMetadata",
DROP COLUMN "paystackReference",
ADD COLUMN     "gateway" TEXT NOT NULL DEFAULT 'PAYSTACK',
ADD COLUMN     "gatewayAmount" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "gatewayMetadata" JSONB,
ADD COLUMN     "gatewayReference" TEXT NOT NULL,
ADD COLUMN     "gatewayTransactionId" TEXT;

-- AlterTable
ALTER TABLE "FeaturedEvent" ALTER COLUMN "createdBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "OrganizerDisbursement" ALTER COLUMN "createdBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "PaymentReconciliation" ALTER COLUMN "reconciledBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Refund" ALTER COLUMN "requestedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "TicketTemplate" ALTER COLUMN "createdBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "twoFactorBackupCodes" TEXT[],
ADD COLUMN     "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "twoFactorSecret" TEXT,
ADD COLUMN     "twoFactorVerifiedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "subtotal" DECIMAL(10,2) NOT NULL,
    "taxAmount" DECIMAL(10,2),
    "discountAmount" DECIMAL(10,2),
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "billToName" TEXT NOT NULL,
    "billToEmail" TEXT NOT NULL,
    "billToAddress" TEXT,
    "billToCity" TEXT,
    "billToState" TEXT,
    "billToCountry" TEXT,
    "billToZipCode" TEXT,
    "templateId" TEXT,
    "templateData" JSONB,
    "pdfUrl" TEXT,
    "pdfGeneratedAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "sentTo" TEXT,
    "notes" TEXT,
    "terms" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceItem" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "totalPrice" DECIMAL(10,2) NOT NULL,
    "itemType" TEXT,
    "itemId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvoiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'STANDARD',
    "htmlContent" TEXT NOT NULL,
    "cssContent" TEXT,
    "variables" JSONB,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvoiceTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxRate" (
    "id" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "state" TEXT,
    "city" TEXT,
    "rate" DECIMAL(5,2) NOT NULL,
    "taxType" TEXT NOT NULL DEFAULT 'SALES_TAX',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxExemption" (
    "id" TEXT NOT NULL,
    "exemptionType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "state" TEXT,
    "taxType" TEXT,
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "exemptionNumber" TEXT,
    "certificateUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxExemption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookEndpoint" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "description" TEXT,
    "eventTypes" TEXT[],
    "secret" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "headers" JSONB,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "retryDelay" INTEGER NOT NULL DEFAULT 1000,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "lastTriggeredAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebhookEndpoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookDelivery" (
    "id" TEXT NOT NULL,
    "endpointId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventId" TEXT,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "responseCode" INTEGER,
    "responseBody" TEXT,
    "errorMessage" TEXT,
    "triggeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),
    "nextRetryAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebhookDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "description" TEXT,
    "permissions" TEXT[],
    "rateLimit" INTEGER NOT NULL DEFAULT 100,
    "rateLimitWindow" INTEGER NOT NULL DEFAULT 3600,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "requestCount" INTEGER NOT NULL DEFAULT 0,
    "lastRequestAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiRequest" (
    "id" TEXT NOT NULL,
    "apiKeyId" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "responseTime" INTEGER,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "requestBody" JSONB,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentPlan" (
    "id" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "planName" TEXT NOT NULL,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "installmentCount" INTEGER NOT NULL,
    "installmentAmount" DECIMAL(10,2) NOT NULL,
    "frequency" TEXT NOT NULL DEFAULT 'MONTHLY',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "autoPaymentEnabled" BOOLEAN NOT NULL DEFAULT true,
    "paymentMethod" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentInstallment" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "installmentNumber" INTEGER NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidAmount" DECIMAL(10,2),
    "paidAt" TIMESTAMP(3),
    "paymentTransactionId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "lastRetryAt" TIMESTAMP(3),
    "nextRetryAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentInstallment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventReview" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "registrationId" TEXT,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "review" TEXT,
    "pros" TEXT[],
    "cons" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "moderatedBy" TEXT,
    "moderatedAt" TIMESTAMP(3),
    "moderationReason" TEXT,
    "helpfulCount" INTEGER NOT NULL DEFAULT 0,
    "reportCount" INTEGER NOT NULL DEFAULT 0,
    "isVerifiedAttendee" BOOLEAN NOT NULL DEFAULT false,
    "attendedDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketTransfer" (
    "id" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "toEmail" TEXT,
    "transferToken" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TicketTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventCollection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "coverImage" TEXT,
    "shareToken" TEXT,
    "isShared" BOOLEAN NOT NULL DEFAULT false,
    "eventCount" INTEGER NOT NULL DEFAULT 0,
    "followerCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventCollection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventCollectionItem" (
    "id" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "EventCollectionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionFollower" (
    "id" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "followedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CollectionFollower_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketResale" (
    "id" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "originalPrice" DECIMAL(10,2) NOT NULL,
    "resalePrice" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "status" TEXT NOT NULL DEFAULT 'LISTED',
    "listedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "soldAt" TIMESTAMP(3),
    "buyerId" TEXT,
    "platformFee" DECIMAL(10,2),
    "sellerPayout" DECIMAL(10,2),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TicketResale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DigitalWallet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "autoAddTickets" BOOLEAN NOT NULL DEFAULT true,
    "backupEnabled" BOOLEAN NOT NULL DEFAULT true,
    "appleWalletId" TEXT,
    "googlePayId" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DigitalWallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletTicket" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "passData" JSONB,
    "qrCodeUrl" TEXT,
    "backupCode" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastAccessedAt" TIMESTAMP(3),

    CONSTRAINT "WalletTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventCalendarSync" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "calendarType" TEXT NOT NULL,
    "calendarId" TEXT,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSyncedAt" TIMESTAMP(3),
    "syncStatus" TEXT NOT NULL DEFAULT 'ACTIVE',
    "reminderEnabled" BOOLEAN NOT NULL DEFAULT true,
    "reminderMinutes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventCalendarSync_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonalEventFeed" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "preferences" JSONB NOT NULL,
    "filters" JSONB,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonalEventFeed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedItem" (
    "id" TEXT NOT NULL,
    "feedId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "relevanceScore" DECIMAL(5,2),
    "reason" TEXT,
    "viewed" BOOLEAN NOT NULL DEFAULT false,
    "viewedAt" TIMESTAMP(3),
    "dismissed" BOOLEAN NOT NULL DEFAULT false,
    "dismissedAt" TIMESTAMP(3),
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventUpdateSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "updateTypes" TEXT[],
    "channels" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "subscribedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unsubscribedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventUpdateSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserInterest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "tags" TEXT[],
    "weight" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserInterest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DirectMessage" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "subject" TEXT,
    "content" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "eventId" TEXT,
    "registrationId" TEXT,
    "parentMessageId" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DirectMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserFollow" (
    "id" TEXT NOT NULL,
    "followerId" TEXT NOT NULL,
    "followingId" TEXT NOT NULL,
    "followedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserFollow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventShare" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT,
    "platform" TEXT NOT NULL,
    "shareUrl" TEXT,
    "referrer" TEXT,
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "conversionCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedSearch" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "searchQuery" TEXT NOT NULL,
    "filters" JSONB,
    "notifyOnNewEvents" BOOLEAN NOT NULL DEFAULT false,
    "notificationFrequency" TEXT NOT NULL DEFAULT 'DAILY',
    "lastSearchedAt" TIMESTAMP(3),
    "resultCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedSearch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "activityType" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "eventId" TEXT,
    "registrationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventTemplate" (
    "id" TEXT NOT NULL,
    "organizerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "tags" TEXT[],
    "templateData" JSONB NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "isShared" BOOLEAN NOT NULL DEFAULT false,
    "shareToken" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "parentId" TEXT,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),
    "thumbnail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "EventTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventDraft" (
    "id" TEXT NOT NULL,
    "organizerId" TEXT NOT NULL,
    "draftData" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "parentId" TEXT,
    "scheduledPublishAt" TIMESTAMP(3),
    "collaborators" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "EventDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendeeSegment" (
    "id" TEXT NOT NULL,
    "organizerId" TEXT NOT NULL,
    "eventId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "criteria" JSONB NOT NULL,
    "isDynamic" BOOLEAN NOT NULL DEFAULT true,
    "memberCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendeeSegment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendeeSegmentMember" (
    "id" TEXT NOT NULL,
    "segmentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttendeeSegmentMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendeeTag" (
    "id" TEXT NOT NULL,
    "organizerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "description" TEXT,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendeeTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendeeTaggedUser" (
    "id" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventId" TEXT,
    "taggedBy" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttendeeTaggedUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromoCodeVariant" (
    "id" TEXT NOT NULL,
    "promoCodeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "discountType" "DiscountType" NOT NULL,
    "discountValue" DECIMAL(10,2) NOT NULL,
    "trafficPercentage" INTEGER NOT NULL DEFAULT 50,
    "isControl" BOOLEAN NOT NULL DEFAULT false,
    "views" INTEGER NOT NULL DEFAULT 0,
    "redemptions" INTEGER NOT NULL DEFAULT 0,
    "revenue" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromoCodeVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventExpense" (
    "id" TEXT NOT NULL,
    "organizerId" TEXT NOT NULL,
    "eventId" TEXT,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "receiptUrl" TEXT,
    "receiptDate" TIMESTAMP(3),
    "taxAmount" DECIMAL(10,2),
    "taxRate" DECIMAL(5,2),
    "isTaxDeductible" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "expenseDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialGoal" (
    "id" TEXT NOT NULL,
    "organizerId" TEXT NOT NULL,
    "eventId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "targetAmount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "currentAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "progressPercentage" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "FinancialGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayoutPreference" (
    "id" TEXT NOT NULL,
    "organizerId" TEXT NOT NULL,
    "primaryMethod" TEXT NOT NULL,
    "bankName" TEXT,
    "accountName" TEXT,
    "accountNumber" TEXT,
    "bankCode" TEXT,
    "routingNumber" TEXT,
    "paystackRecipientCode" TEXT,
    "alternativeMethods" JSONB,
    "autoPayoutEnabled" BOOLEAN NOT NULL DEFAULT false,
    "autoPayoutThreshold" DECIMAL(10,2),
    "autoPayoutSchedule" TEXT,
    "taxId" TEXT,
    "taxCountry" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayoutPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventCollaborator" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "collaboratorId" TEXT NOT NULL,
    "canEdit" BOOLEAN NOT NULL DEFAULT false,
    "canManageAttendees" BOOLEAN NOT NULL DEFAULT false,
    "canManageTickets" BOOLEAN NOT NULL DEFAULT false,
    "canViewAnalytics" BOOLEAN NOT NULL DEFAULT true,
    "canManageStaff" BOOLEAN NOT NULL DEFAULT false,
    "canPublish" BOOLEAN NOT NULL DEFAULT false,
    "role" TEXT,
    "invitedBy" TEXT,
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventCollaborator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventActivityLog" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "description" TEXT NOT NULL,
    "changes" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketPackage" (
    "id" TEXT NOT NULL,
    "organizerId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "price" DECIMAL(10,2),
    "minQuantity" INTEGER,
    "maxQuantity" INTEGER,
    "bundleItems" JSONB,
    "isDonation" BOOLEAN NOT NULL DEFAULT false,
    "minDonation" DECIMAL(10,2),
    "maxDonation" DECIMAL(10,2),
    "suggestedAmounts" JSONB,
    "hasReservedSeating" BOOLEAN NOT NULL DEFAULT false,
    "seatingChart" JSONB,
    "availableFrom" TIMESTAMP(3),
    "availableUntil" TIMESTAMP(3),
    "quantity" INTEGER,
    "soldQuantity" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TicketPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DynamicPricingRule" (
    "id" TEXT NOT NULL,
    "organizerId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "demandThreshold" INTEGER,
    "priceMultiplier" DECIMAL(5,2),
    "minGroupSize" INTEGER,
    "discountType" TEXT,
    "discountValue" DECIMAL(10,2),
    "loyaltyTierId" TEXT,
    "loyaltyDiscount" DECIMAL(10,2),
    "applicableTicketTypes" TEXT[],
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DynamicPricingRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AffiliateProgram" (
    "id" TEXT NOT NULL,
    "organizerId" TEXT NOT NULL,
    "eventId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "commissionType" TEXT NOT NULL,
    "commissionValue" DECIMAL(10,2) NOT NULL,
    "minCommission" DECIMAL(10,2),
    "maxCommission" DECIMAL(10,2),
    "cookieDuration" INTEGER NOT NULL DEFAULT 30,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AffiliateProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Affiliate" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "affiliateCode" TEXT NOT NULL,
    "customLink" TEXT,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "totalRevenue" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalCommission" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "paidCommission" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Affiliate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AffiliateConversion" (
    "id" TEXT NOT NULL,
    "affiliateId" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "revenueAmount" DECIMAL(10,2) NOT NULL,
    "commissionAmount" DECIMAL(10,2) NOT NULL,
    "commissionStatus" TEXT NOT NULL DEFAULT 'pending',
    "convertedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "AffiliateConversion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailCampaign" (
    "id" TEXT NOT NULL,
    "organizerId" TEXT NOT NULL,
    "eventId" TEXT,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "plainText" TEXT,
    "recipientType" TEXT NOT NULL,
    "segmentId" TEXT,
    "tagId" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'draft',
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "deliveredCount" INTEGER NOT NULL DEFAULT 0,
    "openedCount" INTEGER NOT NULL DEFAULT 0,
    "clickedCount" INTEGER NOT NULL DEFAULT 0,
    "bouncedCount" INTEGER NOT NULL DEFAULT 0,
    "unsubscribedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailAutomationRule" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "organizerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "triggerConditions" JSONB,
    "delayType" TEXT,
    "delayValue" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailAutomationRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialMediaPost" (
    "id" TEXT NOT NULL,
    "organizerId" TEXT NOT NULL,
    "eventId" TEXT,
    "platform" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "mediaUrls" TEXT[],
    "scheduledAt" TIMESTAMP(3),
    "postedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'draft',
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "externalPostId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialMediaPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialMediaCalendar" (
    "id" TEXT NOT NULL,
    "organizerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "autoPostEnabled" BOOLEAN NOT NULL DEFAULT false,
    "platforms" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialMediaCalendar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialMediaPostTemplate" (
    "id" TEXT NOT NULL,
    "organizerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "platform" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "variables" TEXT[],
    "mediaPlaceholders" TEXT[],
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialMediaPostTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Venue" (
    "id" TEXT NOT NULL,
    "organizerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "postalCode" TEXT,
    "coordinates" JSONB,
    "capacity" INTEGER,
    "venueType" TEXT,
    "amenities" TEXT[],
    "defaultSeatMap" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Venue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeatMap" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "venueId" TEXT,
    "name" TEXT,
    "layout" JSONB NOT NULL,
    "pricing" JSONB,
    "imageUrl" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeatMap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Seat" (
    "id" TEXT NOT NULL,
    "seatMapId" TEXT NOT NULL,
    "seatIdentifier" TEXT NOT NULL,
    "sectionId" TEXT,
    "rowId" TEXT,
    "rowLabel" TEXT,
    "seatLabel" TEXT,
    "seatType" "SeatType" NOT NULL DEFAULT 'STANDARD',
    "status" "SeatStatus" NOT NULL DEFAULT 'AVAILABLE',
    "basePrice" DECIMAL(10,2),
    "currentPrice" DECIMAL(10,2),
    "x" DOUBLE PRECISION,
    "y" DOUBLE PRECISION,
    "angle" DOUBLE PRECISION,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Seat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeatReservation" (
    "id" TEXT NOT NULL,
    "seatId" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "reservedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reservedUntil" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "priceAtReservation" DECIMAL(10,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'reserved',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeatReservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamRoleTemplate" (
    "id" TEXT NOT NULL,
    "organizerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "canEdit" BOOLEAN NOT NULL DEFAULT false,
    "canManageAttendees" BOOLEAN NOT NULL DEFAULT false,
    "canManageTickets" BOOLEAN NOT NULL DEFAULT false,
    "canViewAnalytics" BOOLEAN NOT NULL DEFAULT true,
    "canManageStaff" BOOLEAN NOT NULL DEFAULT false,
    "canPublish" BOOLEAN NOT NULL DEFAULT false,
    "canManageCollaborators" BOOLEAN NOT NULL DEFAULT false,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamRoleTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamActivityFeed" (
    "id" TEXT NOT NULL,
    "organizerId" TEXT NOT NULL,
    "eventId" TEXT,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamActivityFeed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamPerformanceMetric" (
    "id" TEXT NOT NULL,
    "organizerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventsCreated" INTEGER NOT NULL DEFAULT 0,
    "ticketsSold" INTEGER NOT NULL DEFAULT 0,
    "revenueGenerated" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "attendeesManaged" INTEGER NOT NULL DEFAULT 0,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamPerformanceMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformExpense" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "paymentMethod" TEXT,
    "recipient" TEXT,
    "reference" TEXT,
    "receiptUrl" TEXT,
    "receiptDate" TIMESTAMP(3),
    "taxAmount" DECIMAL(10,2),
    "taxRate" DECIMAL(5,2),
    "isTaxDeductible" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "recordedBy" TEXT,
    "approvedBy" TEXT,
    "expenseDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformIncome" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "source" TEXT,
    "reference" TEXT,
    "paymentMethod" TEXT,
    "eventId" TEXT,
    "transactionId" TEXT,
    "taxAmount" DECIMAL(10,2),
    "taxRate" DECIMAL(5,2),
    "status" TEXT NOT NULL DEFAULT 'received',
    "recordedBy" TEXT,
    "incomeDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformIncome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhiteLabelBranding" (
    "id" TEXT NOT NULL,
    "organizerId" TEXT NOT NULL,
    "logoUrl" TEXT,
    "logoLightUrl" TEXT,
    "logoDarkUrl" TEXT,
    "faviconUrl" TEXT,
    "coverImageUrl" TEXT,
    "primaryColor" TEXT,
    "secondaryColor" TEXT,
    "accentColor" TEXT,
    "backgroundColor" TEXT,
    "textColor" TEXT,
    "linkColor" TEXT,
    "fontFamily" TEXT,
    "headingFont" TEXT,
    "brandName" TEXT,
    "tagline" TEXT,
    "supportEmail" TEXT,
    "supportPhone" TEXT,
    "websiteUrl" TEXT,
    "emailHeaderImage" TEXT,
    "emailFooterText" TEXT,
    "emailSignature" TEXT,
    "socialLinks" JSONB,
    "status" "BrandingStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhiteLabelBranding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomDomain" (
    "id" TEXT NOT NULL,
    "organizerId" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "subdomain" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "status" "CustomDomainStatus" NOT NULL DEFAULT 'PENDING',
    "verificationToken" TEXT,
    "verificationCode" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "sslEnabled" BOOLEAN NOT NULL DEFAULT false,
    "sslCertificate" TEXT,
    "sslKey" TEXT,
    "sslExpiresAt" TIMESTAMP(3),
    "cnameTarget" TEXT,
    "ipAddress" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "lastCheckedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomDomain_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_transactionId_key" ON "Invoice"("transactionId");

-- CreateIndex
CREATE INDEX "Invoice_invoiceNumber_idx" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "Invoice_transactionId_idx" ON "Invoice"("transactionId");

-- CreateIndex
CREATE INDEX "Invoice_registrationId_idx" ON "Invoice"("registrationId");

-- CreateIndex
CREATE INDEX "Invoice_eventId_idx" ON "Invoice"("eventId");

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");

-- CreateIndex
CREATE INDEX "Invoice_issueDate_idx" ON "Invoice"("issueDate");

-- CreateIndex
CREATE INDEX "InvoiceItem_invoiceId_idx" ON "InvoiceItem"("invoiceId");

-- CreateIndex
CREATE INDEX "InvoiceTemplate_type_idx" ON "InvoiceTemplate"("type");

-- CreateIndex
CREATE INDEX "InvoiceTemplate_isDefault_idx" ON "InvoiceTemplate"("isDefault");

-- CreateIndex
CREATE INDEX "InvoiceTemplate_isActive_idx" ON "InvoiceTemplate"("isActive");

-- CreateIndex
CREATE INDEX "TaxRate_country_idx" ON "TaxRate"("country");

-- CreateIndex
CREATE INDEX "TaxRate_state_idx" ON "TaxRate"("state");

-- CreateIndex
CREATE INDEX "TaxRate_isActive_idx" ON "TaxRate"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "TaxRate_country_state_city_key" ON "TaxRate"("country", "state", "city");

-- CreateIndex
CREATE INDEX "TaxExemption_entityId_entityType_idx" ON "TaxExemption"("entityId", "entityType");

-- CreateIndex
CREATE INDEX "TaxExemption_country_idx" ON "TaxExemption"("country");

-- CreateIndex
CREATE INDEX "TaxExemption_isActive_idx" ON "TaxExemption"("isActive");

-- CreateIndex
CREATE INDEX "TaxExemption_validUntil_idx" ON "TaxExemption"("validUntil");

-- CreateIndex
CREATE INDEX "WebhookEndpoint_isActive_idx" ON "WebhookEndpoint"("isActive");

-- CreateIndex
CREATE INDEX "WebhookEndpoint_createdBy_idx" ON "WebhookEndpoint"("createdBy");

-- CreateIndex
CREATE INDEX "WebhookEndpoint_createdAt_idx" ON "WebhookEndpoint"("createdAt");

-- CreateIndex
CREATE INDEX "WebhookDelivery_endpointId_idx" ON "WebhookDelivery"("endpointId");

-- CreateIndex
CREATE INDEX "WebhookDelivery_status_idx" ON "WebhookDelivery"("status");

-- CreateIndex
CREATE INDEX "WebhookDelivery_eventType_idx" ON "WebhookDelivery"("eventType");

-- CreateIndex
CREATE INDEX "WebhookDelivery_triggeredAt_idx" ON "WebhookDelivery"("triggeredAt");

-- CreateIndex
CREATE INDEX "WebhookDelivery_nextRetryAt_idx" ON "WebhookDelivery"("nextRetryAt");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_keyHash_key" ON "ApiKey"("keyHash");

-- CreateIndex
CREATE INDEX "ApiKey_keyHash_idx" ON "ApiKey"("keyHash");

-- CreateIndex
CREATE INDEX "ApiKey_isActive_idx" ON "ApiKey"("isActive");

-- CreateIndex
CREATE INDEX "ApiKey_createdBy_idx" ON "ApiKey"("createdBy");

-- CreateIndex
CREATE INDEX "ApiKey_expiresAt_idx" ON "ApiKey"("expiresAt");

-- CreateIndex
CREATE INDEX "ApiRequest_apiKeyId_idx" ON "ApiRequest"("apiKeyId");

-- CreateIndex
CREATE INDEX "ApiRequest_createdAt_idx" ON "ApiRequest"("createdAt");

-- CreateIndex
CREATE INDEX "ApiRequest_statusCode_idx" ON "ApiRequest"("statusCode");

-- CreateIndex
CREATE INDEX "ApiRequest_method_path_idx" ON "ApiRequest"("method", "path");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentPlan_registrationId_key" ON "PaymentPlan"("registrationId");

-- CreateIndex
CREATE INDEX "PaymentPlan_registrationId_idx" ON "PaymentPlan"("registrationId");

-- CreateIndex
CREATE INDEX "PaymentPlan_eventId_idx" ON "PaymentPlan"("eventId");

-- CreateIndex
CREATE INDEX "PaymentPlan_status_idx" ON "PaymentPlan"("status");

-- CreateIndex
CREATE INDEX "PaymentPlan_startDate_idx" ON "PaymentPlan"("startDate");

-- CreateIndex
CREATE INDEX "PaymentInstallment_planId_idx" ON "PaymentInstallment"("planId");

-- CreateIndex
CREATE INDEX "PaymentInstallment_status_idx" ON "PaymentInstallment"("status");

-- CreateIndex
CREATE INDEX "PaymentInstallment_dueDate_idx" ON "PaymentInstallment"("dueDate");

-- CreateIndex
CREATE INDEX "PaymentInstallment_nextRetryAt_idx" ON "PaymentInstallment"("nextRetryAt");

-- CreateIndex
CREATE UNIQUE INDEX "EventReview_registrationId_key" ON "EventReview"("registrationId");

-- CreateIndex
CREATE INDEX "EventReview_eventId_idx" ON "EventReview"("eventId");

-- CreateIndex
CREATE INDEX "EventReview_userId_idx" ON "EventReview"("userId");

-- CreateIndex
CREATE INDEX "EventReview_status_idx" ON "EventReview"("status");

-- CreateIndex
CREATE INDEX "EventReview_rating_idx" ON "EventReview"("rating");

-- CreateIndex
CREATE INDEX "EventReview_createdAt_idx" ON "EventReview"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "EventReview_eventId_userId_key" ON "EventReview"("eventId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "TicketTransfer_transferToken_key" ON "TicketTransfer"("transferToken");

-- CreateIndex
CREATE INDEX "TicketTransfer_registrationId_idx" ON "TicketTransfer"("registrationId");

-- CreateIndex
CREATE INDEX "TicketTransfer_fromUserId_idx" ON "TicketTransfer"("fromUserId");

-- CreateIndex
CREATE INDEX "TicketTransfer_toUserId_idx" ON "TicketTransfer"("toUserId");

-- CreateIndex
CREATE INDEX "TicketTransfer_status_idx" ON "TicketTransfer"("status");

-- CreateIndex
CREATE INDEX "TicketTransfer_transferToken_idx" ON "TicketTransfer"("transferToken");

-- CreateIndex
CREATE INDEX "TicketTransfer_expiresAt_idx" ON "TicketTransfer"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "EventCollection_shareToken_key" ON "EventCollection"("shareToken");

-- CreateIndex
CREATE INDEX "EventCollection_userId_idx" ON "EventCollection"("userId");

-- CreateIndex
CREATE INDEX "EventCollection_isPublic_idx" ON "EventCollection"("isPublic");

-- CreateIndex
CREATE INDEX "EventCollection_shareToken_idx" ON "EventCollection"("shareToken");

-- CreateIndex
CREATE INDEX "EventCollectionItem_collectionId_idx" ON "EventCollectionItem"("collectionId");

-- CreateIndex
CREATE INDEX "EventCollectionItem_eventId_idx" ON "EventCollectionItem"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "EventCollectionItem_collectionId_eventId_key" ON "EventCollectionItem"("collectionId", "eventId");

-- CreateIndex
CREATE INDEX "CollectionFollower_collectionId_idx" ON "CollectionFollower"("collectionId");

-- CreateIndex
CREATE INDEX "CollectionFollower_userId_idx" ON "CollectionFollower"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CollectionFollower_collectionId_userId_key" ON "CollectionFollower"("collectionId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "TicketResale_registrationId_key" ON "TicketResale"("registrationId");

-- CreateIndex
CREATE INDEX "TicketResale_sellerId_idx" ON "TicketResale"("sellerId");

-- CreateIndex
CREATE INDEX "TicketResale_buyerId_idx" ON "TicketResale"("buyerId");

-- CreateIndex
CREATE INDEX "TicketResale_status_idx" ON "TicketResale"("status");

-- CreateIndex
CREATE INDEX "TicketResale_listedAt_idx" ON "TicketResale"("listedAt");

-- CreateIndex
CREATE INDEX "TicketResale_expiresAt_idx" ON "TicketResale"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "DigitalWallet_userId_key" ON "DigitalWallet"("userId");

-- CreateIndex
CREATE INDEX "DigitalWallet_userId_idx" ON "DigitalWallet"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WalletTicket_registrationId_key" ON "WalletTicket"("registrationId");

-- CreateIndex
CREATE INDEX "WalletTicket_walletId_idx" ON "WalletTicket"("walletId");

-- CreateIndex
CREATE INDEX "WalletTicket_registrationId_idx" ON "WalletTicket"("registrationId");

-- CreateIndex
CREATE INDEX "WalletTicket_isActive_idx" ON "WalletTicket"("isActive");

-- CreateIndex
CREATE INDEX "EventCalendarSync_userId_idx" ON "EventCalendarSync"("userId");

-- CreateIndex
CREATE INDEX "EventCalendarSync_registrationId_idx" ON "EventCalendarSync"("registrationId");

-- CreateIndex
CREATE INDEX "EventCalendarSync_calendarType_idx" ON "EventCalendarSync"("calendarType");

-- CreateIndex
CREATE INDEX "EventCalendarSync_syncStatus_idx" ON "EventCalendarSync"("syncStatus");

-- CreateIndex
CREATE UNIQUE INDEX "EventCalendarSync_userId_registrationId_calendarType_key" ON "EventCalendarSync"("userId", "registrationId", "calendarType");

-- CreateIndex
CREATE UNIQUE INDEX "PersonalEventFeed_userId_key" ON "PersonalEventFeed"("userId");

-- CreateIndex
CREATE INDEX "PersonalEventFeed_userId_idx" ON "PersonalEventFeed"("userId");

-- CreateIndex
CREATE INDEX "FeedItem_feedId_idx" ON "FeedItem"("feedId");

-- CreateIndex
CREATE INDEX "FeedItem_eventId_idx" ON "FeedItem"("eventId");

-- CreateIndex
CREATE INDEX "FeedItem_viewed_idx" ON "FeedItem"("viewed");

-- CreateIndex
CREATE INDEX "FeedItem_addedAt_idx" ON "FeedItem"("addedAt");

-- CreateIndex
CREATE UNIQUE INDEX "FeedItem_feedId_eventId_key" ON "FeedItem"("feedId", "eventId");

-- CreateIndex
CREATE INDEX "EventUpdateSubscription_userId_idx" ON "EventUpdateSubscription"("userId");

-- CreateIndex
CREATE INDEX "EventUpdateSubscription_eventId_idx" ON "EventUpdateSubscription"("eventId");

-- CreateIndex
CREATE INDEX "EventUpdateSubscription_isActive_idx" ON "EventUpdateSubscription"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "EventUpdateSubscription_userId_eventId_key" ON "EventUpdateSubscription"("userId", "eventId");

-- CreateIndex
CREATE INDEX "UserInterest_userId_idx" ON "UserInterest"("userId");

-- CreateIndex
CREATE INDEX "UserInterest_category_idx" ON "UserInterest"("category");

-- CreateIndex
CREATE UNIQUE INDEX "UserInterest_userId_category_key" ON "UserInterest"("userId", "category");

-- CreateIndex
CREATE INDEX "DirectMessage_senderId_idx" ON "DirectMessage"("senderId");

-- CreateIndex
CREATE INDEX "DirectMessage_recipientId_idx" ON "DirectMessage"("recipientId");

-- CreateIndex
CREATE INDEX "DirectMessage_eventId_idx" ON "DirectMessage"("eventId");

-- CreateIndex
CREATE INDEX "DirectMessage_isRead_idx" ON "DirectMessage"("isRead");

-- CreateIndex
CREATE INDEX "DirectMessage_createdAt_idx" ON "DirectMessage"("createdAt");

-- CreateIndex
CREATE INDEX "UserFollow_followerId_idx" ON "UserFollow"("followerId");

-- CreateIndex
CREATE INDEX "UserFollow_followingId_idx" ON "UserFollow"("followingId");

-- CreateIndex
CREATE UNIQUE INDEX "UserFollow_followerId_followingId_key" ON "UserFollow"("followerId", "followingId");

-- CreateIndex
CREATE INDEX "EventShare_eventId_idx" ON "EventShare"("eventId");

-- CreateIndex
CREATE INDEX "EventShare_userId_idx" ON "EventShare"("userId");

-- CreateIndex
CREATE INDEX "EventShare_platform_idx" ON "EventShare"("platform");

-- CreateIndex
CREATE INDEX "EventShare_createdAt_idx" ON "EventShare"("createdAt");

-- CreateIndex
CREATE INDEX "SavedSearch_userId_idx" ON "SavedSearch"("userId");

-- CreateIndex
CREATE INDEX "SavedSearch_notifyOnNewEvents_idx" ON "SavedSearch"("notifyOnNewEvents");

-- CreateIndex
CREATE INDEX "ActivityHistory_userId_idx" ON "ActivityHistory"("userId");

-- CreateIndex
CREATE INDEX "ActivityHistory_activityType_idx" ON "ActivityHistory"("activityType");

-- CreateIndex
CREATE INDEX "ActivityHistory_entityType_idx" ON "ActivityHistory"("entityType");

-- CreateIndex
CREATE INDEX "ActivityHistory_createdAt_idx" ON "ActivityHistory"("createdAt");

-- CreateIndex
CREATE INDEX "ActivityHistory_eventId_idx" ON "ActivityHistory"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "EventTemplate_shareToken_key" ON "EventTemplate"("shareToken");

-- CreateIndex
CREATE INDEX "EventTemplate_organizerId_idx" ON "EventTemplate"("organizerId");

-- CreateIndex
CREATE INDEX "EventTemplate_isPublic_idx" ON "EventTemplate"("isPublic");

-- CreateIndex
CREATE INDEX "EventTemplate_category_idx" ON "EventTemplate"("category");

-- CreateIndex
CREATE INDEX "EventTemplate_shareToken_idx" ON "EventTemplate"("shareToken");

-- CreateIndex
CREATE INDEX "EventTemplate_parentId_idx" ON "EventTemplate"("parentId");

-- CreateIndex
CREATE INDEX "EventTemplate_createdAt_idx" ON "EventTemplate"("createdAt");

-- CreateIndex
CREATE INDEX "EventDraft_organizerId_idx" ON "EventDraft"("organizerId");

-- CreateIndex
CREATE INDEX "EventDraft_parentId_idx" ON "EventDraft"("parentId");

-- CreateIndex
CREATE INDEX "EventDraft_scheduledPublishAt_idx" ON "EventDraft"("scheduledPublishAt");

-- CreateIndex
CREATE INDEX "EventDraft_createdAt_idx" ON "EventDraft"("createdAt");

-- CreateIndex
CREATE INDEX "AttendeeSegment_organizerId_idx" ON "AttendeeSegment"("organizerId");

-- CreateIndex
CREATE INDEX "AttendeeSegment_eventId_idx" ON "AttendeeSegment"("eventId");

-- CreateIndex
CREATE INDEX "AttendeeSegment_isDynamic_idx" ON "AttendeeSegment"("isDynamic");

-- CreateIndex
CREATE INDEX "AttendeeSegment_createdAt_idx" ON "AttendeeSegment"("createdAt");

-- CreateIndex
CREATE INDEX "AttendeeSegmentMember_segmentId_idx" ON "AttendeeSegmentMember"("segmentId");

-- CreateIndex
CREATE INDEX "AttendeeSegmentMember_userId_idx" ON "AttendeeSegmentMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AttendeeSegmentMember_segmentId_userId_key" ON "AttendeeSegmentMember"("segmentId", "userId");

-- CreateIndex
CREATE INDEX "AttendeeTag_organizerId_idx" ON "AttendeeTag"("organizerId");

-- CreateIndex
CREATE INDEX "AttendeeTag_name_idx" ON "AttendeeTag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "AttendeeTag_organizerId_name_key" ON "AttendeeTag"("organizerId", "name");

-- CreateIndex
CREATE INDEX "AttendeeTaggedUser_tagId_idx" ON "AttendeeTaggedUser"("tagId");

-- CreateIndex
CREATE INDEX "AttendeeTaggedUser_userId_idx" ON "AttendeeTaggedUser"("userId");

-- CreateIndex
CREATE INDEX "AttendeeTaggedUser_eventId_idx" ON "AttendeeTaggedUser"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "AttendeeTaggedUser_tagId_userId_eventId_key" ON "AttendeeTaggedUser"("tagId", "userId", "eventId");

-- CreateIndex
CREATE INDEX "PromoCodeVariant_promoCodeId_idx" ON "PromoCodeVariant"("promoCodeId");

-- CreateIndex
CREATE UNIQUE INDEX "PromoCodeVariant_promoCodeId_code_key" ON "PromoCodeVariant"("promoCodeId", "code");

-- CreateIndex
CREATE INDEX "EventExpense_organizerId_idx" ON "EventExpense"("organizerId");

-- CreateIndex
CREATE INDEX "EventExpense_eventId_idx" ON "EventExpense"("eventId");

-- CreateIndex
CREATE INDEX "EventExpense_category_idx" ON "EventExpense"("category");

-- CreateIndex
CREATE INDEX "EventExpense_expenseDate_idx" ON "EventExpense"("expenseDate");

-- CreateIndex
CREATE INDEX "FinancialGoal_organizerId_idx" ON "FinancialGoal"("organizerId");

-- CreateIndex
CREATE INDEX "FinancialGoal_eventId_idx" ON "FinancialGoal"("eventId");

-- CreateIndex
CREATE INDEX "FinancialGoal_status_idx" ON "FinancialGoal"("status");

-- CreateIndex
CREATE INDEX "FinancialGoal_endDate_idx" ON "FinancialGoal"("endDate");

-- CreateIndex
CREATE UNIQUE INDEX "PayoutPreference_organizerId_key" ON "PayoutPreference"("organizerId");

-- CreateIndex
CREATE INDEX "PayoutPreference_organizerId_idx" ON "PayoutPreference"("organizerId");

-- CreateIndex
CREATE INDEX "EventCollaborator_eventId_idx" ON "EventCollaborator"("eventId");

-- CreateIndex
CREATE INDEX "EventCollaborator_collaboratorId_idx" ON "EventCollaborator"("collaboratorId");

-- CreateIndex
CREATE UNIQUE INDEX "EventCollaborator_eventId_collaboratorId_key" ON "EventCollaborator"("eventId", "collaboratorId");

-- CreateIndex
CREATE INDEX "EventActivityLog_eventId_idx" ON "EventActivityLog"("eventId");

-- CreateIndex
CREATE INDEX "EventActivityLog_userId_idx" ON "EventActivityLog"("userId");

-- CreateIndex
CREATE INDEX "EventActivityLog_action_idx" ON "EventActivityLog"("action");

-- CreateIndex
CREATE INDEX "EventActivityLog_createdAt_idx" ON "EventActivityLog"("createdAt");

-- CreateIndex
CREATE INDEX "TicketPackage_organizerId_idx" ON "TicketPackage"("organizerId");

-- CreateIndex
CREATE INDEX "TicketPackage_eventId_idx" ON "TicketPackage"("eventId");

-- CreateIndex
CREATE INDEX "TicketPackage_type_idx" ON "TicketPackage"("type");

-- CreateIndex
CREATE INDEX "DynamicPricingRule_organizerId_idx" ON "DynamicPricingRule"("organizerId");

-- CreateIndex
CREATE INDEX "DynamicPricingRule_eventId_idx" ON "DynamicPricingRule"("eventId");

-- CreateIndex
CREATE INDEX "DynamicPricingRule_type_idx" ON "DynamicPricingRule"("type");

-- CreateIndex
CREATE INDEX "DynamicPricingRule_isActive_idx" ON "DynamicPricingRule"("isActive");

-- CreateIndex
CREATE INDEX "AffiliateProgram_organizerId_idx" ON "AffiliateProgram"("organizerId");

-- CreateIndex
CREATE INDEX "AffiliateProgram_eventId_idx" ON "AffiliateProgram"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "Affiliate_affiliateCode_key" ON "Affiliate"("affiliateCode");

-- CreateIndex
CREATE INDEX "Affiliate_userId_idx" ON "Affiliate"("userId");

-- CreateIndex
CREATE INDEX "Affiliate_programId_idx" ON "Affiliate"("programId");

-- CreateIndex
CREATE INDEX "Affiliate_affiliateCode_idx" ON "Affiliate"("affiliateCode");

-- CreateIndex
CREATE UNIQUE INDEX "Affiliate_programId_userId_key" ON "Affiliate"("programId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "AffiliateConversion_registrationId_key" ON "AffiliateConversion"("registrationId");

-- CreateIndex
CREATE INDEX "AffiliateConversion_affiliateId_idx" ON "AffiliateConversion"("affiliateId");

-- CreateIndex
CREATE INDEX "AffiliateConversion_registrationId_idx" ON "AffiliateConversion"("registrationId");

-- CreateIndex
CREATE UNIQUE INDEX "AffiliateConversion_affiliateId_registrationId_key" ON "AffiliateConversion"("affiliateId", "registrationId");

-- CreateIndex
CREATE INDEX "EmailCampaign_organizerId_idx" ON "EmailCampaign"("organizerId");

-- CreateIndex
CREATE INDEX "EmailCampaign_eventId_idx" ON "EmailCampaign"("eventId");

-- CreateIndex
CREATE INDEX "EmailCampaign_status_idx" ON "EmailCampaign"("status");

-- CreateIndex
CREATE INDEX "EmailCampaign_scheduledAt_idx" ON "EmailCampaign"("scheduledAt");

-- CreateIndex
CREATE INDEX "EmailAutomationRule_campaignId_idx" ON "EmailAutomationRule"("campaignId");

-- CreateIndex
CREATE INDEX "EmailAutomationRule_organizerId_idx" ON "EmailAutomationRule"("organizerId");

-- CreateIndex
CREATE INDEX "EmailAutomationRule_trigger_idx" ON "EmailAutomationRule"("trigger");

-- CreateIndex
CREATE INDEX "SocialMediaPost_organizerId_idx" ON "SocialMediaPost"("organizerId");

-- CreateIndex
CREATE INDEX "SocialMediaPost_eventId_idx" ON "SocialMediaPost"("eventId");

-- CreateIndex
CREATE INDEX "SocialMediaPost_platform_idx" ON "SocialMediaPost"("platform");

-- CreateIndex
CREATE INDEX "SocialMediaPost_status_idx" ON "SocialMediaPost"("status");

-- CreateIndex
CREATE INDEX "SocialMediaPost_scheduledAt_idx" ON "SocialMediaPost"("scheduledAt");

-- CreateIndex
CREATE INDEX "SocialMediaCalendar_organizerId_idx" ON "SocialMediaCalendar"("organizerId");

-- CreateIndex
CREATE INDEX "SocialMediaPostTemplate_organizerId_idx" ON "SocialMediaPostTemplate"("organizerId");

-- CreateIndex
CREATE INDEX "SocialMediaPostTemplate_platform_idx" ON "SocialMediaPostTemplate"("platform");

-- CreateIndex
CREATE INDEX "SocialMediaPostTemplate_isPublic_idx" ON "SocialMediaPostTemplate"("isPublic");

-- CreateIndex
CREATE INDEX "Venue_organizerId_idx" ON "Venue"("organizerId");

-- CreateIndex
CREATE INDEX "Venue_isActive_idx" ON "Venue"("isActive");

-- CreateIndex
CREATE INDEX "Venue_venueType_idx" ON "Venue"("venueType");

-- CreateIndex
CREATE UNIQUE INDEX "SeatMap_eventId_key" ON "SeatMap"("eventId");

-- CreateIndex
CREATE INDEX "SeatMap_eventId_idx" ON "SeatMap"("eventId");

-- CreateIndex
CREATE INDEX "SeatMap_venueId_idx" ON "SeatMap"("venueId");

-- CreateIndex
CREATE INDEX "SeatMap_isActive_idx" ON "SeatMap"("isActive");

-- CreateIndex
CREATE INDEX "Seat_seatMapId_idx" ON "Seat"("seatMapId");

-- CreateIndex
CREATE INDEX "Seat_status_idx" ON "Seat"("status");

-- CreateIndex
CREATE INDEX "Seat_seatType_idx" ON "Seat"("seatType");

-- CreateIndex
CREATE INDEX "Seat_sectionId_rowId_idx" ON "Seat"("sectionId", "rowId");

-- CreateIndex
CREATE UNIQUE INDEX "Seat_seatMapId_seatIdentifier_key" ON "Seat"("seatMapId", "seatIdentifier");

-- CreateIndex
CREATE UNIQUE INDEX "SeatReservation_registrationId_key" ON "SeatReservation"("registrationId");

-- CreateIndex
CREATE INDEX "SeatReservation_seatId_idx" ON "SeatReservation"("seatId");

-- CreateIndex
CREATE INDEX "SeatReservation_registrationId_idx" ON "SeatReservation"("registrationId");

-- CreateIndex
CREATE INDEX "SeatReservation_status_idx" ON "SeatReservation"("status");

-- CreateIndex
CREATE INDEX "SeatReservation_reservedUntil_idx" ON "SeatReservation"("reservedUntil");

-- CreateIndex
CREATE INDEX "TeamRoleTemplate_organizerId_idx" ON "TeamRoleTemplate"("organizerId");

-- CreateIndex
CREATE INDEX "TeamActivityFeed_organizerId_idx" ON "TeamActivityFeed"("organizerId");

-- CreateIndex
CREATE INDEX "TeamActivityFeed_eventId_idx" ON "TeamActivityFeed"("eventId");

-- CreateIndex
CREATE INDEX "TeamActivityFeed_userId_idx" ON "TeamActivityFeed"("userId");

-- CreateIndex
CREATE INDEX "TeamActivityFeed_createdAt_idx" ON "TeamActivityFeed"("createdAt");

-- CreateIndex
CREATE INDEX "TeamPerformanceMetric_organizerId_idx" ON "TeamPerformanceMetric"("organizerId");

-- CreateIndex
CREATE INDEX "TeamPerformanceMetric_userId_idx" ON "TeamPerformanceMetric"("userId");

-- CreateIndex
CREATE INDEX "TeamPerformanceMetric_periodStart_idx" ON "TeamPerformanceMetric"("periodStart");

-- CreateIndex
CREATE UNIQUE INDEX "TeamPerformanceMetric_organizerId_userId_periodStart_period_key" ON "TeamPerformanceMetric"("organizerId", "userId", "periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "PlatformExpense_category_idx" ON "PlatformExpense"("category");

-- CreateIndex
CREATE INDEX "PlatformExpense_expenseDate_idx" ON "PlatformExpense"("expenseDate");

-- CreateIndex
CREATE INDEX "PlatformExpense_status_idx" ON "PlatformExpense"("status");

-- CreateIndex
CREATE INDEX "PlatformExpense_createdAt_idx" ON "PlatformExpense"("createdAt");

-- CreateIndex
CREATE INDEX "PlatformIncome_category_idx" ON "PlatformIncome"("category");

-- CreateIndex
CREATE INDEX "PlatformIncome_incomeDate_idx" ON "PlatformIncome"("incomeDate");

-- CreateIndex
CREATE INDEX "PlatformIncome_status_idx" ON "PlatformIncome"("status");

-- CreateIndex
CREATE INDEX "PlatformIncome_createdAt_idx" ON "PlatformIncome"("createdAt");

-- CreateIndex
CREATE INDEX "PlatformIncome_eventId_idx" ON "PlatformIncome"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "WhiteLabelBranding_organizerId_key" ON "WhiteLabelBranding"("organizerId");

-- CreateIndex
CREATE INDEX "WhiteLabelBranding_organizerId_idx" ON "WhiteLabelBranding"("organizerId");

-- CreateIndex
CREATE INDEX "WhiteLabelBranding_status_idx" ON "WhiteLabelBranding"("status");

-- CreateIndex
CREATE INDEX "WhiteLabelBranding_isActive_idx" ON "WhiteLabelBranding"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "CustomDomain_domain_key" ON "CustomDomain"("domain");

-- CreateIndex
CREATE INDEX "CustomDomain_organizerId_idx" ON "CustomDomain"("organizerId");

-- CreateIndex
CREATE INDEX "CustomDomain_domain_idx" ON "CustomDomain"("domain");

-- CreateIndex
CREATE INDEX "CustomDomain_status_idx" ON "CustomDomain"("status");

-- CreateIndex
CREATE INDEX "CustomDomain_isActive_idx" ON "CustomDomain"("isActive");

-- CreateIndex
CREATE INDEX "CustomDomain_isPrimary_idx" ON "CustomDomain"("isPrimary");

-- CreateIndex
CREATE UNIQUE INDEX "EventPaymentTransaction_gatewayReference_key" ON "EventPaymentTransaction"("gatewayReference");

-- CreateIndex
CREATE INDEX "EventPaymentTransaction_gatewayReference_idx" ON "EventPaymentTransaction"("gatewayReference");

-- CreateIndex
CREATE INDEX "EventPaymentTransaction_gateway_idx" ON "EventPaymentTransaction"("gateway");

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "EventPaymentTransaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "EventRegistration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookDelivery" ADD CONSTRAINT "WebhookDelivery_endpointId_fkey" FOREIGN KEY ("endpointId") REFERENCES "WebhookEndpoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiRequest" ADD CONSTRAINT "ApiRequest_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "ApiKey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentPlan" ADD CONSTRAINT "PaymentPlan_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "EventRegistration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentPlan" ADD CONSTRAINT "PaymentPlan_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentInstallment" ADD CONSTRAINT "PaymentInstallment_planId_fkey" FOREIGN KEY ("planId") REFERENCES "PaymentPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventReview" ADD CONSTRAINT "EventReview_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventReview" ADD CONSTRAINT "EventReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventReview" ADD CONSTRAINT "EventReview_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "EventRegistration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketTransfer" ADD CONSTRAINT "TicketTransfer_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "EventRegistration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketTransfer" ADD CONSTRAINT "TicketTransfer_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketTransfer" ADD CONSTRAINT "TicketTransfer_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventCollection" ADD CONSTRAINT "EventCollection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventCollectionItem" ADD CONSTRAINT "EventCollectionItem_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "EventCollection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventCollectionItem" ADD CONSTRAINT "EventCollectionItem_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionFollower" ADD CONSTRAINT "CollectionFollower_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "EventCollection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionFollower" ADD CONSTRAINT "CollectionFollower_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketResale" ADD CONSTRAINT "TicketResale_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "EventRegistration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketResale" ADD CONSTRAINT "TicketResale_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketResale" ADD CONSTRAINT "TicketResale_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DigitalWallet" ADD CONSTRAINT "DigitalWallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTicket" ADD CONSTRAINT "WalletTicket_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "DigitalWallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTicket" ADD CONSTRAINT "WalletTicket_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "EventRegistration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventCalendarSync" ADD CONSTRAINT "EventCalendarSync_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventCalendarSync" ADD CONSTRAINT "EventCalendarSync_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "EventRegistration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalEventFeed" ADD CONSTRAINT "PersonalEventFeed_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedItem" ADD CONSTRAINT "FeedItem_feedId_fkey" FOREIGN KEY ("feedId") REFERENCES "PersonalEventFeed"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedItem" ADD CONSTRAINT "FeedItem_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventUpdateSubscription" ADD CONSTRAINT "EventUpdateSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventUpdateSubscription" ADD CONSTRAINT "EventUpdateSubscription_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserInterest" ADD CONSTRAINT "UserInterest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DirectMessage" ADD CONSTRAINT "DirectMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DirectMessage" ADD CONSTRAINT "DirectMessage_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DirectMessage" ADD CONSTRAINT "DirectMessage_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DirectMessage" ADD CONSTRAINT "DirectMessage_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "EventRegistration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DirectMessage" ADD CONSTRAINT "DirectMessage_parentMessageId_fkey" FOREIGN KEY ("parentMessageId") REFERENCES "DirectMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFollow" ADD CONSTRAINT "UserFollow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFollow" ADD CONSTRAINT "UserFollow_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventShare" ADD CONSTRAINT "EventShare_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventShare" ADD CONSTRAINT "EventShare_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedSearch" ADD CONSTRAINT "SavedSearch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityHistory" ADD CONSTRAINT "ActivityHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityHistory" ADD CONSTRAINT "ActivityHistory_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityHistory" ADD CONSTRAINT "ActivityHistory_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "EventRegistration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventTemplate" ADD CONSTRAINT "EventTemplate_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventTemplate" ADD CONSTRAINT "EventTemplate_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "EventTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventDraft" ADD CONSTRAINT "EventDraft_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventDraft" ADD CONSTRAINT "EventDraft_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "EventDraft"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendeeSegment" ADD CONSTRAINT "AttendeeSegment_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendeeSegment" ADD CONSTRAINT "AttendeeSegment_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendeeSegmentMember" ADD CONSTRAINT "AttendeeSegmentMember_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES "AttendeeSegment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendeeSegmentMember" ADD CONSTRAINT "AttendeeSegmentMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendeeTag" ADD CONSTRAINT "AttendeeTag_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendeeTaggedUser" ADD CONSTRAINT "AttendeeTaggedUser_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "AttendeeTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendeeTaggedUser" ADD CONSTRAINT "AttendeeTaggedUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendeeTaggedUser" ADD CONSTRAINT "AttendeeTaggedUser_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromoCodeVariant" ADD CONSTRAINT "PromoCodeVariant_promoCodeId_fkey" FOREIGN KEY ("promoCodeId") REFERENCES "PromoCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventExpense" ADD CONSTRAINT "EventExpense_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventExpense" ADD CONSTRAINT "EventExpense_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialGoal" ADD CONSTRAINT "FinancialGoal_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialGoal" ADD CONSTRAINT "FinancialGoal_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayoutPreference" ADD CONSTRAINT "PayoutPreference_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventCollaborator" ADD CONSTRAINT "EventCollaborator_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventCollaborator" ADD CONSTRAINT "EventCollaborator_collaboratorId_fkey" FOREIGN KEY ("collaboratorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventActivityLog" ADD CONSTRAINT "EventActivityLog_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventActivityLog" ADD CONSTRAINT "EventActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketPackage" ADD CONSTRAINT "TicketPackage_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketPackage" ADD CONSTRAINT "TicketPackage_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DynamicPricingRule" ADD CONSTRAINT "DynamicPricingRule_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DynamicPricingRule" ADD CONSTRAINT "DynamicPricingRule_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateProgram" ADD CONSTRAINT "AffiliateProgram_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateProgram" ADD CONSTRAINT "AffiliateProgram_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Affiliate" ADD CONSTRAINT "Affiliate_programId_fkey" FOREIGN KEY ("programId") REFERENCES "AffiliateProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Affiliate" ADD CONSTRAINT "Affiliate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateConversion" ADD CONSTRAINT "AffiliateConversion_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "Affiliate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateConversion" ADD CONSTRAINT "AffiliateConversion_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "EventRegistration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailCampaign" ADD CONSTRAINT "EmailCampaign_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailCampaign" ADD CONSTRAINT "EmailCampaign_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailAutomationRule" ADD CONSTRAINT "EmailAutomationRule_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "EmailCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailAutomationRule" ADD CONSTRAINT "EmailAutomationRule_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialMediaPost" ADD CONSTRAINT "SocialMediaPost_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialMediaPost" ADD CONSTRAINT "SocialMediaPost_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialMediaCalendar" ADD CONSTRAINT "SocialMediaCalendar_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialMediaPostTemplate" ADD CONSTRAINT "SocialMediaPostTemplate_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venue" ADD CONSTRAINT "Venue_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeatMap" ADD CONSTRAINT "SeatMap_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeatMap" ADD CONSTRAINT "SeatMap_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Seat" ADD CONSTRAINT "Seat_seatMapId_fkey" FOREIGN KEY ("seatMapId") REFERENCES "SeatMap"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeatReservation" ADD CONSTRAINT "SeatReservation_seatId_fkey" FOREIGN KEY ("seatId") REFERENCES "Seat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeatReservation" ADD CONSTRAINT "SeatReservation_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "EventRegistration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamRoleTemplate" ADD CONSTRAINT "TeamRoleTemplate_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamActivityFeed" ADD CONSTRAINT "TeamActivityFeed_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamActivityFeed" ADD CONSTRAINT "TeamActivityFeed_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamActivityFeed" ADD CONSTRAINT "TeamActivityFeed_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamPerformanceMetric" ADD CONSTRAINT "TeamPerformanceMetric_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamPerformanceMetric" ADD CONSTRAINT "TeamPerformanceMetric_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformIncome" ADD CONSTRAINT "PlatformIncome_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhiteLabelBranding" ADD CONSTRAINT "WhiteLabelBranding_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomDomain" ADD CONSTRAINT "CustomDomain_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
