-- CreateEnum
CREATE TYPE "EventApprovalMessageType" AS ENUM ('REQUEST_INFO', 'APPROVED', 'REJECTED', 'ORGANIZER_RESPONSE');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('PENDING', 'VIEWED', 'RESPONDED');

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
ALTER TABLE "EventApprovalMessage" ADD CONSTRAINT "EventApprovalMessage_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventApprovalMessage" ADD CONSTRAINT "EventApprovalMessage_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
