/*
  Warnings:

  - Added the required column `grossAmount` to the `Wage` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "StaffPayType" AS ENUM ('PERMANENT', 'CONTRACT', 'EVENT');

-- AlterTable
ALTER TABLE "Wage" ADD COLUMN     "bonuses" DECIMAL(10,2),
ADD COLUMN     "dailyRate" DECIMAL(10,2),
ADD COLUMN     "deductions" DECIMAL(10,2),
ADD COLUMN     "eventDays" INTEGER,
ADD COLUMN     "eventId" TEXT,
ADD COLUMN     "grossAmount" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "hourlyRate" DECIMAL(10,2),
ADD COLUMN     "hoursWorked" DECIMAL(8,2),
ADD COLUMN     "overtimeHours" DECIMAL(8,2),
ADD COLUMN     "overtimeRate" DECIMAL(10,2),
ADD COLUMN     "staffType" "StaffPayType" NOT NULL DEFAULT 'PERMANENT';

-- CreateIndex
CREATE INDEX "Wage_eventId_idx" ON "Wage"("eventId");

-- CreateIndex
CREATE INDEX "Wage_staffType_idx" ON "Wage"("staffType");

-- AddForeignKey
ALTER TABLE "Wage" ADD CONSTRAINT "Wage_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;
