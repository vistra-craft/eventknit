/*
  Warnings:

  - A unique constraint covering the columns `[registrationCode]` on the table `Event` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('EVENT_REMINDER_24H', 'EVENT_REMINDER_1H', 'EVENT_UPDATE', 'EVENT_CANCELLED', 'EVENT_POSTPONED', 'EVENT_VENUE_CHANGED', 'EVENT_TIME_CHANGED', 'REGISTRATION_DEADLINE_REMINDER', 'REGISTRATION_DEADLINE_24H', 'REGISTRATION_DEADLINE_1H', 'WAITLIST_AVAILABLE', 'CAPACITY_FULL', 'EVENT_COMPLETED', 'EVENT_APPROVED', 'EVENT_REJECTED', 'EVENT_CANCELLED_BY_ADMIN', 'REGISTRATION_MILESTONE_50', 'REGISTRATION_MILESTONE_75', 'REGISTRATION_MILESTONE_100', 'CAPACITY_REACHED', 'PAYMENT_RECEIVED', 'REFUND_PROCESSED', 'EVENT_PERFORMANCE_SUMMARY', 'REGISTRATION_CONFIRMED', 'REGISTRATION_CANCELLED', 'PAYMENT_PENDING', 'PAYMENT_FAILED', 'PAYMENT_SUCCESS', 'REFUND_RECEIVED', 'STAFF_ASSIGNED_TO_EVENT', 'STAFF_REMOVED_FROM_EVENT', 'STAFF_ASSIGNMENT_UPDATED', 'EVENT_UPDATE_FOR_STAFF', 'EVENT_CANCELLED_FOR_STAFF', 'EVENT_REMINDER_FOR_STAFF', 'SYSTEM_ANNOUNCEMENT', 'PLATFORM_UPDATE', 'MAINTENANCE_SCHEDULED', 'SECURITY_ALERT', 'NEW_EVENT_AVAILABLE', 'PROMOTION_OFFER', 'EARLY_BIRD_REMINDER', 'ACCOUNT_VERIFIED', 'PASSWORD_CHANGED', 'LOGIN_ATTEMPT', 'ACCOUNT_SUSPENDED', 'ACCOUNT_ACTIVATED');

-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'FAILED');

-- CreateEnum
CREATE TYPE "BulkMessageStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'SENDING', 'SENT', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BulkMessageTargetAudience" AS ENUM ('ALL', 'ORGANIZERS', 'ATTENDEES', 'STAFF', 'SPECIFIC_EVENT');

-- CreateEnum
CREATE TYPE "SocialPlatform" AS ENUM ('FACEBOOK', 'INSTAGRAM', 'TWITTER', 'LINKEDIN', 'YOUTUBE', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "PostStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'PUBLISHED', 'FAILED');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('COMMENT', 'DIRECT_MESSAGE', 'MENTION', 'REVIEW');

-- CreateEnum
CREATE TYPE "SupportQueryStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'WAITING', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "SupportPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "countryCode" TEXT,
ADD COLUMN     "region" TEXT;

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "registrationCode" TEXT;

-- CreateTable
CREATE TABLE "EventPaymentTransaction" (
    "id" TEXT NOT NULL,
    "transactionNumber" TEXT NOT NULL,
    "paystackReference" TEXT NOT NULL,
    "paystackAmount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "amount" DECIMAL(10,2) NOT NULL,
    "paymentMethod" TEXT NOT NULL DEFAULT 'PAYSTACK',
    "paymentStatus" TEXT NOT NULL,
    "paymentDate" TIMESTAMP(3),
    "eventId" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "attendeeEmail" TEXT NOT NULL,
    "attendeeName" TEXT,
    "paystackMetadata" JSONB,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventPaymentTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformFee" (
    "id" TEXT NOT NULL,
    "feeNumber" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "grossAmount" DECIMAL(10,2) NOT NULL,
    "feePercentage" DECIMAL(5,2) NOT NULL,
    "feeAmount" DECIMAL(10,2) NOT NULL,
    "organizerAmount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "status" TEXT NOT NULL DEFAULT 'calculated',
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventId" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "disbursementId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformFee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizerDisbursement" (
    "id" TEXT NOT NULL,
    "disbursementNumber" TEXT NOT NULL,
    "organizerId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "paymentMethod" TEXT NOT NULL,
    "bankAccount" TEXT,
    "bankName" TEXT,
    "accountName" TEXT,
    "accountNumber" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "scheduledDate" TIMESTAMP(3),
    "processedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "paymentReference" TEXT,
    "failureReason" TEXT,
    "notes" TEXT,
    "metadata" JSONB,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizerDisbursement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Refund" (
    "id" TEXT NOT NULL,
    "refundNumber" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "refundAmount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "refundReason" TEXT NOT NULL,
    "refundType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "paymentMethod" TEXT NOT NULL,
    "refundReference" TEXT,
    "failureReason" TEXT,
    "eventId" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "platformFeeRefund" DECIMAL(10,2),
    "notes" TEXT,
    "metadata" JSONB,
    "requestedBy" TEXT NOT NULL,
    "processedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentReconciliation" (
    "id" TEXT NOT NULL,
    "reconciliationNumber" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "reconciliationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalPaystackTransactions" INTEGER NOT NULL,
    "totalSystemTransactions" INTEGER NOT NULL,
    "matchedTransactions" INTEGER NOT NULL,
    "unmatchedTransactions" INTEGER NOT NULL,
    "totalPaystackAmount" DECIMAL(10,2) NOT NULL,
    "totalSystemAmount" DECIMAL(10,2) NOT NULL,
    "discrepancyAmount" DECIMAL(10,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "discrepancies" JSONB,
    "eventId" TEXT,
    "notes" TEXT,
    "paystackData" JSONB,
    "reconciledBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentReconciliation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "channels" JSONB NOT NULL,
    "emailStatus" "DeliveryStatus",
    "smsStatus" "DeliveryStatus",
    "pushStatus" "DeliveryStatus",
    "inAppStatus" "DeliveryStatus" DEFAULT 'DELIVERED',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "priority" "NotificationPriority" NOT NULL DEFAULT 'MEDIUM',
    "expiresAt" TIMESTAMP(3),
    "eventId" TEXT,
    "registrationId" TEXT,
    "relatedUserId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "smsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT true,
    "inAppEnabled" BOOLEAN NOT NULL DEFAULT true,
    "eventReminders" BOOLEAN NOT NULL DEFAULT true,
    "eventUpdates" BOOLEAN NOT NULL DEFAULT true,
    "eventCancellations" BOOLEAN NOT NULL DEFAULT true,
    "paymentNotifications" BOOLEAN NOT NULL DEFAULT true,
    "marketingEmails" BOOLEAN NOT NULL DEFAULT true,
    "systemAnnouncements" BOOLEAN NOT NULL DEFAULT true,
    "registrationUpdates" BOOLEAN NOT NULL DEFAULT true,
    "staffNotifications" BOOLEAN NOT NULL DEFAULT true,
    "reminderFrequency" TEXT NOT NULL DEFAULT 'all',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemNotificationSettings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemNotificationSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSettings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "isEncrypted" BOOLEAN NOT NULL DEFAULT false,
    "environment" TEXT,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPreferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "theme" TEXT NOT NULL DEFAULT 'system',
    "primaryColor" TEXT,
    "dashboardLayout" TEXT NOT NULL DEFAULT 'spacious',
    "showMetrics" BOOLEAN NOT NULL DEFAULT true,
    "showCharts" BOOLEAN NOT NULL DEFAULT true,
    "language" TEXT NOT NULL DEFAULT 'en',
    "timezone" TEXT,
    "dateFormat" TEXT NOT NULL DEFAULT 'MM/DD/YYYY',
    "timeFormat" TEXT NOT NULL DEFAULT '12h',
    "profileVisibility" TEXT NOT NULL DEFAULT 'public',
    "showEmail" BOOLEAN NOT NULL DEFAULT false,
    "showPhone" BOOLEAN NOT NULL DEFAULT false,
    "allowMessages" BOOLEAN NOT NULL DEFAULT true,
    "sessionTimeout" INTEGER NOT NULL DEFAULT 30,
    "loginAlerts" BOOLEAN NOT NULL DEFAULT true,
    "twoFactorAuth" BOOLEAN NOT NULL DEFAULT false,
    "eventNotifications" BOOLEAN NOT NULL DEFAULT true,
    "registrationNotifications" BOOLEAN NOT NULL DEFAULT true,
    "paymentNotifications" BOOLEAN NOT NULL DEFAULT true,
    "marketingEmails" BOOLEAN NOT NULL DEFAULT false,
    "weeklyDigest" BOOLEAN NOT NULL DEFAULT true,
    "eventReminders" BOOLEAN NOT NULL DEFAULT true,
    "eventUpdates" BOOLEAN NOT NULL DEFAULT true,
    "promotionalOffers" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPreferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SettingsHistory" (
    "id" TEXT NOT NULL,
    "settingId" TEXT,
    "userId" TEXT,
    "key" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT NOT NULL,
    "changedBy" TEXT NOT NULL,
    "changeReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SettingsHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BulkMessage" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "targetAudience" "BulkMessageTargetAudience" NOT NULL,
    "eventId" TEXT,
    "campaignId" TEXT,
    "templateId" TEXT,
    "channels" JSONB NOT NULL,
    "status" "BulkMessageStatus" NOT NULL DEFAULT 'DRAFT',
    "scheduledAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "totalRecipients" INTEGER NOT NULL DEFAULT 0,
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "openedCount" INTEGER NOT NULL DEFAULT 0,
    "clickedCount" INTEGER NOT NULL DEFAULT 0,
    "unsubscribedCount" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BulkMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT,
    "htmlContent" TEXT NOT NULL,
    "textContent" TEXT,
    "description" TEXT,
    "category" TEXT,
    "variables" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SMSSession" (
    "id" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "sessionType" TEXT NOT NULL,
    "currentStep" TEXT,
    "state" JSONB,
    "eventCode" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SMSSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialAccount" (
    "id" TEXT NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "accountId" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "accountHandle" TEXT,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "tokenExpiry" TIMESTAMP(3),
    "followers" INTEGER NOT NULL DEFAULT 0,
    "following" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSyncedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialPost" (
    "id" TEXT NOT NULL,
    "socialAccountId" TEXT NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "postId" TEXT,
    "content" TEXT,
    "mediaUrls" JSONB,
    "status" "PostStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "scheduledAt" TIMESTAMP(3),
    "campaignId" TEXT,
    "createdBy" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialPostMetrics" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "views" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "reach" INTEGER NOT NULL DEFAULT 0,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "engagementRate" DOUBLE PRECISION,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialPostMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialMessage" (
    "id" TEXT NOT NULL,
    "socialAccountId" TEXT NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "messageId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "senderName" TEXT NOT NULL,
    "senderHandle" TEXT,
    "senderEmail" TEXT,
    "message" TEXT NOT NULL,
    "messageType" "MessageType" NOT NULL,
    "postId" TEXT,
    "status" "SupportQueryStatus" NOT NULL DEFAULT 'NEW',
    "priority" "SupportPriority" NOT NULL DEFAULT 'MEDIUM',
    "category" TEXT,
    "assignedTo" TEXT,
    "assignedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "campaignId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportResponse" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "sentBy" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialAnalytics" (
    "id" TEXT NOT NULL,
    "socialAccountId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "followers" INTEGER NOT NULL DEFAULT 0,
    "following" INTEGER NOT NULL DEFAULT 0,
    "posts" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "views" INTEGER NOT NULL DEFAULT 0,
    "reach" INTEGER NOT NULL DEFAULT 0,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "engagement" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EventPaymentTransaction_transactionNumber_key" ON "EventPaymentTransaction"("transactionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "EventPaymentTransaction_paystackReference_key" ON "EventPaymentTransaction"("paystackReference");

-- CreateIndex
CREATE UNIQUE INDEX "EventPaymentTransaction_registrationId_key" ON "EventPaymentTransaction"("registrationId");

-- CreateIndex
CREATE INDEX "EventPaymentTransaction_paystackReference_idx" ON "EventPaymentTransaction"("paystackReference");

-- CreateIndex
CREATE INDEX "EventPaymentTransaction_eventId_idx" ON "EventPaymentTransaction"("eventId");

-- CreateIndex
CREATE INDEX "EventPaymentTransaction_registrationId_idx" ON "EventPaymentTransaction"("registrationId");

-- CreateIndex
CREATE INDEX "EventPaymentTransaction_paymentStatus_idx" ON "EventPaymentTransaction"("paymentStatus");

-- CreateIndex
CREATE INDEX "EventPaymentTransaction_paymentDate_idx" ON "EventPaymentTransaction"("paymentDate");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformFee_feeNumber_key" ON "PlatformFee"("feeNumber");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformFee_transactionId_key" ON "PlatformFee"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformFee_registrationId_key" ON "PlatformFee"("registrationId");

-- CreateIndex
CREATE INDEX "PlatformFee_eventId_idx" ON "PlatformFee"("eventId");

-- CreateIndex
CREATE INDEX "PlatformFee_registrationId_idx" ON "PlatformFee"("registrationId");

-- CreateIndex
CREATE INDEX "PlatformFee_status_idx" ON "PlatformFee"("status");

-- CreateIndex
CREATE INDEX "PlatformFee_disbursementId_idx" ON "PlatformFee"("disbursementId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizerDisbursement_disbursementNumber_key" ON "OrganizerDisbursement"("disbursementNumber");

-- CreateIndex
CREATE INDEX "OrganizerDisbursement_organizerId_idx" ON "OrganizerDisbursement"("organizerId");

-- CreateIndex
CREATE INDEX "OrganizerDisbursement_eventId_idx" ON "OrganizerDisbursement"("eventId");

-- CreateIndex
CREATE INDEX "OrganizerDisbursement_status_idx" ON "OrganizerDisbursement"("status");

-- CreateIndex
CREATE INDEX "OrganizerDisbursement_scheduledDate_idx" ON "OrganizerDisbursement"("scheduledDate");

-- CreateIndex
CREATE UNIQUE INDEX "Refund_refundNumber_key" ON "Refund"("refundNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Refund_transactionId_key" ON "Refund"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "Refund_registrationId_key" ON "Refund"("registrationId");

-- CreateIndex
CREATE INDEX "Refund_transactionId_idx" ON "Refund"("transactionId");

-- CreateIndex
CREATE INDEX "Refund_eventId_idx" ON "Refund"("eventId");

-- CreateIndex
CREATE INDEX "Refund_registrationId_idx" ON "Refund"("registrationId");

-- CreateIndex
CREATE INDEX "Refund_status_idx" ON "Refund"("status");

-- CreateIndex
CREATE INDEX "Refund_requestedAt_idx" ON "Refund"("requestedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentReconciliation_reconciliationNumber_key" ON "PaymentReconciliation"("reconciliationNumber");

-- CreateIndex
CREATE INDEX "PaymentReconciliation_startDate_idx" ON "PaymentReconciliation"("startDate");

-- CreateIndex
CREATE INDEX "PaymentReconciliation_endDate_idx" ON "PaymentReconciliation"("endDate");

-- CreateIndex
CREATE INDEX "PaymentReconciliation_eventId_idx" ON "PaymentReconciliation"("eventId");

-- CreateIndex
CREATE INDEX "PaymentReconciliation_status_idx" ON "PaymentReconciliation"("status");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "Notification_type_idx" ON "Notification"("type");

-- CreateIndex
CREATE INDEX "Notification_eventId_idx" ON "Notification"("eventId");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_expiresAt_idx" ON "Notification"("expiresAt");

-- CreateIndex
CREATE INDEX "Notification_priority_idx" ON "Notification"("priority");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_userId_key" ON "NotificationPreference"("userId");

-- CreateIndex
CREATE INDEX "NotificationPreference_userId_idx" ON "NotificationPreference"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SystemNotificationSettings_key_key" ON "SystemNotificationSettings"("key");

-- CreateIndex
CREATE INDEX "SystemNotificationSettings_key_idx" ON "SystemNotificationSettings"("key");

-- CreateIndex
CREATE INDEX "SystemNotificationSettings_category_idx" ON "SystemNotificationSettings"("category");

-- CreateIndex
CREATE INDEX "SystemNotificationSettings_updatedBy_idx" ON "SystemNotificationSettings"("updatedBy");

-- CreateIndex
CREATE UNIQUE INDEX "SystemSettings_key_key" ON "SystemSettings"("key");

-- CreateIndex
CREATE INDEX "SystemSettings_key_idx" ON "SystemSettings"("key");

-- CreateIndex
CREATE INDEX "SystemSettings_category_idx" ON "SystemSettings"("category");

-- CreateIndex
CREATE INDEX "SystemSettings_environment_idx" ON "SystemSettings"("environment");

-- CreateIndex
CREATE INDEX "SystemSettings_createdBy_idx" ON "SystemSettings"("createdBy");

-- CreateIndex
CREATE INDEX "SystemSettings_updatedBy_idx" ON "SystemSettings"("updatedBy");

-- CreateIndex
CREATE UNIQUE INDEX "UserPreferences_userId_key" ON "UserPreferences"("userId");

-- CreateIndex
CREATE INDEX "UserPreferences_userId_idx" ON "UserPreferences"("userId");

-- CreateIndex
CREATE INDEX "SettingsHistory_settingId_idx" ON "SettingsHistory"("settingId");

-- CreateIndex
CREATE INDEX "SettingsHistory_userId_idx" ON "SettingsHistory"("userId");

-- CreateIndex
CREATE INDEX "SettingsHistory_key_idx" ON "SettingsHistory"("key");

-- CreateIndex
CREATE INDEX "SettingsHistory_createdAt_idx" ON "SettingsHistory"("createdAt");

-- CreateIndex
CREATE INDEX "BulkMessage_status_scheduledAt_idx" ON "BulkMessage"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "BulkMessage_createdBy_idx" ON "BulkMessage"("createdBy");

-- CreateIndex
CREATE INDEX "BulkMessage_eventId_idx" ON "BulkMessage"("eventId");

-- CreateIndex
CREATE INDEX "BulkMessage_targetAudience_idx" ON "BulkMessage"("targetAudience");

-- CreateIndex
CREATE INDEX "BulkMessage_campaignId_idx" ON "BulkMessage"("campaignId");

-- CreateIndex
CREATE INDEX "BulkMessage_templateId_idx" ON "BulkMessage"("templateId");

-- CreateIndex
CREATE INDEX "EmailTemplate_category_idx" ON "EmailTemplate"("category");

-- CreateIndex
CREATE INDEX "EmailTemplate_isActive_idx" ON "EmailTemplate"("isActive");

-- CreateIndex
CREATE INDEX "EmailTemplate_createdBy_idx" ON "EmailTemplate"("createdBy");

-- CreateIndex
CREATE INDEX "SMSSession_phoneNumber_sessionType_idx" ON "SMSSession"("phoneNumber", "sessionType");

-- CreateIndex
CREATE INDEX "SMSSession_eventCode_idx" ON "SMSSession"("eventCode");

-- CreateIndex
CREATE INDEX "SMSSession_expiresAt_idx" ON "SMSSession"("expiresAt");

-- CreateIndex
CREATE INDEX "SMSSession_completed_idx" ON "SMSSession"("completed");

-- CreateIndex
CREATE INDEX "SocialAccount_platform_idx" ON "SocialAccount"("platform");

-- CreateIndex
CREATE INDEX "SocialAccount_isActive_idx" ON "SocialAccount"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "SocialAccount_platform_accountId_key" ON "SocialAccount"("platform", "accountId");

-- CreateIndex
CREATE INDEX "SocialPost_socialAccountId_idx" ON "SocialPost"("socialAccountId");

-- CreateIndex
CREATE INDEX "SocialPost_platform_idx" ON "SocialPost"("platform");

-- CreateIndex
CREATE INDEX "SocialPost_status_idx" ON "SocialPost"("status");

-- CreateIndex
CREATE INDEX "SocialPost_scheduledAt_idx" ON "SocialPost"("scheduledAt");

-- CreateIndex
CREATE INDEX "SocialPost_publishedAt_idx" ON "SocialPost"("publishedAt");

-- CreateIndex
CREATE INDEX "SocialPost_campaignId_idx" ON "SocialPost"("campaignId");

-- CreateIndex
CREATE UNIQUE INDEX "SocialPost_platform_postId_key" ON "SocialPost"("platform", "postId");

-- CreateIndex
CREATE UNIQUE INDEX "SocialPostMetrics_postId_key" ON "SocialPostMetrics"("postId");

-- CreateIndex
CREATE INDEX "SocialPostMetrics_lastUpdated_idx" ON "SocialPostMetrics"("lastUpdated");

-- CreateIndex
CREATE INDEX "SocialMessage_socialAccountId_idx" ON "SocialMessage"("socialAccountId");

-- CreateIndex
CREATE INDEX "SocialMessage_platform_idx" ON "SocialMessage"("platform");

-- CreateIndex
CREATE INDEX "SocialMessage_status_idx" ON "SocialMessage"("status");

-- CreateIndex
CREATE INDEX "SocialMessage_priority_idx" ON "SocialMessage"("priority");

-- CreateIndex
CREATE INDEX "SocialMessage_assignedTo_idx" ON "SocialMessage"("assignedTo");

-- CreateIndex
CREATE INDEX "SocialMessage_postId_idx" ON "SocialMessage"("postId");

-- CreateIndex
CREATE INDEX "SocialMessage_createdAt_idx" ON "SocialMessage"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SocialMessage_platform_messageId_key" ON "SocialMessage"("platform", "messageId");

-- CreateIndex
CREATE INDEX "SupportResponse_messageId_idx" ON "SupportResponse"("messageId");

-- CreateIndex
CREATE INDEX "SupportResponse_sentBy_idx" ON "SupportResponse"("sentBy");

-- CreateIndex
CREATE INDEX "SupportResponse_sentAt_idx" ON "SupportResponse"("sentAt");

-- CreateIndex
CREATE INDEX "SocialAnalytics_socialAccountId_idx" ON "SocialAnalytics"("socialAccountId");

-- CreateIndex
CREATE INDEX "SocialAnalytics_date_idx" ON "SocialAnalytics"("date");

-- CreateIndex
CREATE INDEX "SocialAnalytics_platform_idx" ON "SocialAnalytics"("platform");

-- CreateIndex
CREATE UNIQUE INDEX "SocialAnalytics_socialAccountId_date_platform_key" ON "SocialAnalytics"("socialAccountId", "date", "platform");

-- CreateIndex
CREATE INDEX "AuditLog_countryCode_idx" ON "AuditLog"("countryCode");

-- CreateIndex
CREATE INDEX "AuditLog_ipAddress_idx" ON "AuditLog"("ipAddress");

-- CreateIndex
CREATE UNIQUE INDEX "Event_registrationCode_key" ON "Event"("registrationCode");

-- CreateIndex
CREATE INDEX "Event_registrationCode_idx" ON "Event"("registrationCode");

-- AddForeignKey
ALTER TABLE "EventPaymentTransaction" ADD CONSTRAINT "EventPaymentTransaction_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventPaymentTransaction" ADD CONSTRAINT "EventPaymentTransaction_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "EventRegistration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformFee" ADD CONSTRAINT "PlatformFee_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "EventPaymentTransaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformFee" ADD CONSTRAINT "PlatformFee_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformFee" ADD CONSTRAINT "PlatformFee_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "EventRegistration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformFee" ADD CONSTRAINT "PlatformFee_disbursementId_fkey" FOREIGN KEY ("disbursementId") REFERENCES "OrganizerDisbursement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizerDisbursement" ADD CONSTRAINT "OrganizerDisbursement_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizerDisbursement" ADD CONSTRAINT "OrganizerDisbursement_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizerDisbursement" ADD CONSTRAINT "OrganizerDisbursement_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "EventPaymentTransaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "EventRegistration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_requestedBy_fkey" FOREIGN KEY ("requestedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_processedBy_fkey" FOREIGN KEY ("processedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentReconciliation" ADD CONSTRAINT "PaymentReconciliation_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentReconciliation" ADD CONSTRAINT "PaymentReconciliation_reconciledBy_fkey" FOREIGN KEY ("reconciledBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "EventRegistration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemNotificationSettings" ADD CONSTRAINT "SystemNotificationSettings_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPreferences" ADD CONSTRAINT "UserPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettingsHistory" ADD CONSTRAINT "SettingsHistory_settingId_fkey" FOREIGN KEY ("settingId") REFERENCES "SystemSettings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BulkMessage" ADD CONSTRAINT "BulkMessage_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BulkMessage" ADD CONSTRAINT "BulkMessage_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BulkMessage" ADD CONSTRAINT "BulkMessage_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "EmailTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailTemplate" ADD CONSTRAINT "EmailTemplate_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialPost" ADD CONSTRAINT "SocialPost_socialAccountId_fkey" FOREIGN KEY ("socialAccountId") REFERENCES "SocialAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialPostMetrics" ADD CONSTRAINT "SocialPostMetrics_postId_fkey" FOREIGN KEY ("postId") REFERENCES "SocialPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialMessage" ADD CONSTRAINT "SocialMessage_socialAccountId_fkey" FOREIGN KEY ("socialAccountId") REFERENCES "SocialAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialMessage" ADD CONSTRAINT "SocialMessage_postId_fkey" FOREIGN KEY ("postId") REFERENCES "SocialPost"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialMessage" ADD CONSTRAINT "SocialMessage_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportResponse" ADD CONSTRAINT "SupportResponse_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "SocialMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportResponse" ADD CONSTRAINT "SupportResponse_sentBy_fkey" FOREIGN KEY ("sentBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialAnalytics" ADD CONSTRAINT "SocialAnalytics_socialAccountId_fkey" FOREIGN KEY ("socialAccountId") REFERENCES "SocialAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
