-- CreateTable
CREATE TABLE "EventStaff" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "staffType" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT NOT NULL,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "shiftStart" TIMESTAMP(3),
    "shiftEnd" TIMESTAMP(3),
    "facility" TEXT,

    CONSTRAINT "EventStaff_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EventStaff_eventId_staffId_key" ON "EventStaff"("eventId", "staffId");

-- CreateIndex
CREATE INDEX "EventStaff_eventId_idx" ON "EventStaff"("eventId");

-- CreateIndex
CREATE INDEX "EventStaff_staffId_idx" ON "EventStaff"("staffId");

-- CreateIndex
CREATE INDEX "EventStaff_role_idx" ON "EventStaff"("role");

-- CreateIndex
CREATE INDEX "EventStaff_staffType_idx" ON "EventStaff"("staffType");

-- CreateIndex
CREATE INDEX "EventStaff_isActive_idx" ON "EventStaff"("isActive");

-- CreateIndex
CREATE INDEX "EventStaff_assignedAt_idx" ON "EventStaff"("assignedAt");

-- AddForeignKey
ALTER TABLE "EventStaff" ADD CONSTRAINT "EventStaff_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventStaff" ADD CONSTRAINT "EventStaff_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;




