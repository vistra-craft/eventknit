/*
  Warnings:

  - You are about to drop the `EventApprovalMessage` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "EventApprovalMessage" DROP CONSTRAINT "EventApprovalMessage_eventId_fkey";

-- DropForeignKey
ALTER TABLE "EventApprovalMessage" DROP CONSTRAINT "EventApprovalMessage_organizerId_fkey";

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "recallAction" TEXT,
ADD COLUMN     "recallReason" TEXT,
ADD COLUMN     "recalledAt" TIMESTAMP(3),
ADD COLUMN     "recalledBy" TEXT;

-- DropTable
DROP TABLE "EventApprovalMessage";

-- DropEnum
DROP TYPE "EventApprovalMessageType";

-- DropEnum
DROP TYPE "MessageStatus";
