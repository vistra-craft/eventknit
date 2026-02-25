-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "allowResale" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "TicketResale" ADD COLUMN     "paymentReference" TEXT,
ADD COLUMN     "paymentStatus" TEXT,
ADD COLUMN     "reservedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "EventReport" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "reportedBy" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "submittedIp" TEXT,
    "userAgent" TEXT,
    "reviewNotes" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EventReport_eventId_idx" ON "EventReport"("eventId");

-- CreateIndex
CREATE INDEX "EventReport_reportedBy_idx" ON "EventReport"("reportedBy");

-- CreateIndex
CREATE INDEX "EventReport_status_idx" ON "EventReport"("status");

-- CreateIndex
CREATE INDEX "EventReport_category_idx" ON "EventReport"("category");

-- CreateIndex
CREATE UNIQUE INDEX "EventReport_eventId_reportedBy_key" ON "EventReport"("eventId", "reportedBy");

-- AddForeignKey
ALTER TABLE "EventReport" ADD CONSTRAINT "EventReport_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventReport" ADD CONSTRAINT "EventReport_reportedBy_fkey" FOREIGN KEY ("reportedBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
