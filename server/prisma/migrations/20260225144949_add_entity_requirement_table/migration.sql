-- CreateTable
CREATE TABLE "EntityRequirement" (
    "id" TEXT NOT NULL,
    "entityType" "OrganizerEntityType" NOT NULL,
    "documentType" TEXT NOT NULL,
    "description" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "validityPeriodDays" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EntityRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EntityRequirement_entityType_idx" ON "EntityRequirement"("entityType");

-- CreateIndex
CREATE UNIQUE INDEX "EntityRequirement_entityType_documentType_key" ON "EntityRequirement"("entityType", "documentType");
