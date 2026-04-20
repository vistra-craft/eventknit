-- CreateEnum
CREATE TYPE "EventApprovalMessageType" AS ENUM ('REQUEST_INFO', 'APPROVED', 'REJECTED', 'ORGANIZER_RESPONSE');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('PENDING', 'VIEWED', 'RESPONDED');

-- CreateTable
CREATE TABLE "SubscriptionPlan" (
    "id" TEXT NOT NULL,
    "tier" "SubscriptionTier" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "features" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionOverride" (
    "id" TEXT NOT NULL,
    "organizerId" TEXT NOT NULL,
    "tier" "SubscriptionTier" NOT NULL,
    "reason" TEXT,
    "grantedBy" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionOverride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventApprovalMessage" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "organizerId" TEXT NOT NULL,
    "type" "EventApprovalMessageType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "senderRole" TEXT NOT NULL,
    "senderName" TEXT NOT NULL,
    "senderEmail" TEXT,
    "attachedDocuments" TEXT[],
    "status" "MessageStatus" NOT NULL DEFAULT 'PENDING',
    "responseMessage" TEXT,
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventApprovalMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPlan_tier_key" ON "SubscriptionPlan"("tier");

-- CreateIndex
CREATE INDEX "SubscriptionPlan_tier_idx" ON "SubscriptionPlan"("tier");

-- CreateIndex
CREATE INDEX "SubscriptionOverride_organizerId_idx" ON "SubscriptionOverride"("organizerId");

-- CreateIndex
CREATE INDEX "SubscriptionOverride_isActive_idx" ON "SubscriptionOverride"("isActive");

-- CreateIndex
CREATE INDEX "EventApprovalMessage_eventId_idx" ON "EventApprovalMessage"("eventId");

-- CreateIndex
CREATE INDEX "EventApprovalMessage_organizerId_idx" ON "EventApprovalMessage"("organizerId");

-- CreateIndex
CREATE INDEX "EventApprovalMessage_type_idx" ON "EventApprovalMessage"("type");

-- CreateIndex
CREATE INDEX "EventApprovalMessage_status_idx" ON "EventApprovalMessage"("status");

-- CreateIndex
CREATE INDEX "EventApprovalMessage_createdAt_idx" ON "EventApprovalMessage"("createdAt");

-- AddForeignKey
ALTER TABLE "SubscriptionOverride" ADD CONSTRAINT "SubscriptionOverride_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionOverride" ADD CONSTRAINT "SubscriptionOverride_grantedBy_fkey" FOREIGN KEY ("grantedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventApprovalMessage" ADD CONSTRAINT "EventApprovalMessage_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventApprovalMessage" ADD CONSTRAINT "EventApprovalMessage_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
