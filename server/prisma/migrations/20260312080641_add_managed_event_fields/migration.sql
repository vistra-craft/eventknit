-- CreateEnum
CREATE TYPE "ManagedClientType" AS ENUM ('CORPORATE', 'NGO', 'GOVERNMENT', 'PLATFORM', 'OTHER');

-- AlterEnum
ALTER TYPE "ScanType" ADD VALUE 'VOID';

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "clientContactEmail" TEXT,
ADD COLUMN     "clientContactPhone" TEXT,
ADD COLUMN     "clientContractRef" TEXT,
ADD COLUMN     "clientName" TEXT,
ADD COLUMN     "clientType" "ManagedClientType",
ADD COLUMN     "isManaged" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "managedByAdminId" TEXT;

-- AlterTable
ALTER TABLE "TicketScan" ADD COLUMN     "notes" TEXT;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_managedByAdminId_fkey" FOREIGN KEY ("managedByAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
