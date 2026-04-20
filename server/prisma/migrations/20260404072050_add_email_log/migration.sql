/*
  Warnings:

  - You are about to drop the column `analyticsConsent` on the `AttendeeConsent` table. All the data in the column will be lost.
  - You are about to drop the column `demographicsConsent` on the `AttendeeConsent` table. All the data in the column will be lost.
  - You are about to drop the column `operationalConsent` on the `AttendeeConsent` table. All the data in the column will be lost.
  - You are about to alter the column `currency` on the `Event` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(3)`.
  - You are about to alter the column `currency` on the `EventExpense` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(3)`.
  - You are about to alter the column `currency` on the `EventPaymentTransaction` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(3)`.
  - You are about to alter the column `currency` on the `Expense` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(3)`.
  - You are about to alter the column `currency` on the `FinancialGoal` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(3)`.
  - You are about to alter the column `currency` on the `Income` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(3)`.
  - You are about to alter the column `currency` on the `Invoice` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(3)`.
  - You are about to alter the column `currency` on the `OrganizerDisbursement` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(3)`.
  - You are about to alter the column `currency` on the `PaymentInstallment` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(3)`.
  - You are about to alter the column `currency` on the `PaymentPlan` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(3)`.
  - You are about to alter the column `currency` on the `PlatformExpense` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(3)`.
  - You are about to alter the column `currency` on the `PlatformFee` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(3)`.
  - You are about to alter the column `currency` on the `PlatformIncome` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(3)`.
  - You are about to alter the column `currency` on the `Refund` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(3)`.
  - You are about to alter the column `amount` on the `SubscriptionPayment` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `currency` on the `SubscriptionPayment` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(3)`.
  - You are about to alter the column `price` on the `SubscriptionPlan` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `currency` on the `SubscriptionPlan` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(3)`.
  - You are about to alter the column `currency` on the `TicketResale` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(3)`.
  - You are about to alter the column `currency` on the `UserCredit` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(3)`.
  - You are about to alter the column `currency` on the `Voucher` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(3)`.
  - You are about to alter the column `currency` on the `Wage` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(3)`.

*/
-- DropIndex
DROP INDEX "AttendeeConsent_analyticsConsent_idx";

-- DropIndex
DROP INDEX "AttendeeConsent_demographicsConsent_idx";

-- AlterTable
ALTER TABLE "AttendeeConsent" DROP COLUMN "analyticsConsent",
DROP COLUMN "demographicsConsent",
DROP COLUMN "operationalConsent";

-- AlterTable
ALTER TABLE "Event" ALTER COLUMN "currency" SET DATA TYPE VARCHAR(3);

-- AlterTable
ALTER TABLE "EventExpense" ALTER COLUMN "currency" SET DATA TYPE VARCHAR(3);

-- AlterTable
ALTER TABLE "EventPaymentTransaction" ALTER COLUMN "currency" SET DATA TYPE VARCHAR(3);

-- AlterTable
ALTER TABLE "Expense" ALTER COLUMN "currency" SET DATA TYPE VARCHAR(3);

-- AlterTable
ALTER TABLE "FinancialGoal" ALTER COLUMN "currency" SET DATA TYPE VARCHAR(3);

-- AlterTable
ALTER TABLE "Income" ALTER COLUMN "currency" SET DATA TYPE VARCHAR(3);

-- AlterTable
ALTER TABLE "Invoice" ALTER COLUMN "currency" SET DATA TYPE VARCHAR(3);

-- AlterTable
ALTER TABLE "OrganizerDisbursement" ALTER COLUMN "currency" SET DATA TYPE VARCHAR(3);

-- AlterTable
ALTER TABLE "PaymentInstallment" ALTER COLUMN "currency" SET DATA TYPE VARCHAR(3);

-- AlterTable
ALTER TABLE "PaymentPlan" ALTER COLUMN "currency" SET DATA TYPE VARCHAR(3);

-- AlterTable
ALTER TABLE "PlatformExpense" ALTER COLUMN "currency" SET DATA TYPE VARCHAR(3);

-- AlterTable
ALTER TABLE "PlatformFee" ALTER COLUMN "currency" SET DATA TYPE VARCHAR(3);

-- AlterTable
ALTER TABLE "PlatformIncome" ALTER COLUMN "currency" SET DATA TYPE VARCHAR(3);

-- AlterTable
ALTER TABLE "Refund" ALTER COLUMN "currency" SET DATA TYPE VARCHAR(3);

-- AlterTable
ALTER TABLE "SubscriptionPayment" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "currency" SET DATA TYPE VARCHAR(3);

-- AlterTable
ALTER TABLE "SubscriptionPlan" ALTER COLUMN "price" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "currency" SET DATA TYPE VARCHAR(3);

-- AlterTable
ALTER TABLE "TicketResale" ALTER COLUMN "currency" SET DATA TYPE VARCHAR(3);

-- AlterTable
ALTER TABLE "UserCredit" ALTER COLUMN "currency" SET DATA TYPE VARCHAR(3);

-- AlterTable
ALTER TABLE "Voucher" ALTER COLUMN "currency" SET DATA TYPE VARCHAR(3);

-- AlterTable
ALTER TABLE "Wage" ALTER COLUMN "currency" SET DATA TYPE VARCHAR(3);

-- CreateTable
CREATE TABLE "EmailLog" (
    "id" TEXT NOT NULL,
    "from" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "cc" TEXT,
    "bcc" TEXT,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "text" TEXT,
    "attachments" JSONB,
    "success" BOOLEAN NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "errorMessage" TEXT,
    "mailTrapped" BOOLEAN NOT NULL DEFAULT false,
    "originalTo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventSurvey" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Event Feedback Survey',
    "description" TEXT,
    "includeNps" BOOLEAN NOT NULL DEFAULT false,
    "includeVenueRating" BOOLEAN NOT NULL DEFAULT false,
    "includeSpeakerRating" BOOLEAN NOT NULL DEFAULT false,
    "includeContentRating" BOOLEAN NOT NULL DEFAULT false,
    "includeOrgRating" BOOLEAN NOT NULL DEFAULT false,
    "includeValueRating" BOOLEAN NOT NULL DEFAULT false,
    "customQuestions" JSONB,
    "triggerAfterHours" INTEGER NOT NULL DEFAULT 24,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventSurvey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SurveyResponse" (
    "id" TEXT NOT NULL,
    "surveyId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "attendeeId" TEXT NOT NULL,
    "registrationId" TEXT,
    "overallRating" INTEGER NOT NULL,
    "npsScore" INTEGER,
    "venueRating" INTEGER,
    "speakerRating" INTEGER,
    "contentRating" INTEGER,
    "orgRating" INTEGER,
    "valueRating" INTEGER,
    "customAnswers" JSONB,
    "comment" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SurveyResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmailLog_to_idx" ON "EmailLog"("to");

-- CreateIndex
CREATE INDEX "EmailLog_createdAt_idx" ON "EmailLog"("createdAt");

-- CreateIndex
CREATE INDEX "EmailLog_success_idx" ON "EmailLog"("success");

-- CreateIndex
CREATE INDEX "EventSurvey_createdById_idx" ON "EventSurvey"("createdById");

-- CreateIndex
CREATE INDEX "EventSurvey_isActive_idx" ON "EventSurvey"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "EventSurvey_eventId_key" ON "EventSurvey"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "SurveyResponse_registrationId_key" ON "SurveyResponse"("registrationId");

-- CreateIndex
CREATE INDEX "SurveyResponse_eventId_idx" ON "SurveyResponse"("eventId");

-- CreateIndex
CREATE INDEX "SurveyResponse_attendeeId_idx" ON "SurveyResponse"("attendeeId");

-- CreateIndex
CREATE INDEX "SurveyResponse_overallRating_idx" ON "SurveyResponse"("overallRating");

-- CreateIndex
CREATE INDEX "SurveyResponse_submittedAt_idx" ON "SurveyResponse"("submittedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SurveyResponse_surveyId_attendeeId_key" ON "SurveyResponse"("surveyId", "attendeeId");

-- AddForeignKey
ALTER TABLE "EventSurvey" ADD CONSTRAINT "EventSurvey_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventSurvey" ADD CONSTRAINT "EventSurvey_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyResponse" ADD CONSTRAINT "SurveyResponse_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "EventSurvey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyResponse" ADD CONSTRAINT "SurveyResponse_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyResponse" ADD CONSTRAINT "SurveyResponse_attendeeId_fkey" FOREIGN KEY ("attendeeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyResponse" ADD CONSTRAINT "SurveyResponse_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "EventRegistration"("id") ON DELETE SET NULL ON UPDATE CASCADE;
