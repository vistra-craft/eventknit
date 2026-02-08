-- CreateTable
CREATE TABLE "Configuration" (
    "id" TEXT NOT NULL,
    "mailTrap" JSONB NOT NULL DEFAULT '{"trap":true,"toAddress":[],"ccAddress":[]}',
    "isSystemUnderMaintenance" BOOLEAN NOT NULL DEFAULT false,
    "maintenanceMessage" TEXT,
    "maintenanceStartTime" TIMESTAMP(3),
    "maintenanceEndTime" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Configuration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Configuration_createdBy_idx" ON "Configuration"("createdBy");

-- CreateIndex
CREATE INDEX "Configuration_updatedBy_idx" ON "Configuration"("updatedBy");
