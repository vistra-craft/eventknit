-- AlterTable
ALTER TABLE "EventRegistration" ADD COLUMN     "ticketEmailError" TEXT,
ADD COLUMN     "ticketEmailSentAt" TIMESTAMP(3),
ADD COLUMN     "ticketEmailStatus" TEXT;
