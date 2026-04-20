-- Migration: Add EntityRequirement table
-- This migration adds a table to store dynamic KYC document requirements per entity type

-- Create EntityRequirement table
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

-- Create unique constraint: each entity type can only have one requirement per document type
CREATE UNIQUE INDEX "EntityRequirement_entityType_documentType_key" ON "EntityRequirement"("entityType", "documentType");

-- Create index on entityType for faster lookups
CREATE INDEX "EntityRequirement_entityType_idx" ON "EntityRequirement"("entityType");

-- Note: Run this migration using:
-- psql -d your_database_name -f MIGRATION_add_entity_requirement.sql
-- OR through Prisma: npx prisma migrate dev --name add_entity_requirement_model
