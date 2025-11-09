/*
  Warnings:

  - Added the required column `email` to the `EmailVerification` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "EmailVerification" ADD COLUMN     "code" TEXT,
ADD COLUMN     "email" TEXT NOT NULL,
ALTER COLUMN "userId" DROP NOT NULL,
ALTER COLUMN "token" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "identityVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "isIdentityVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "payoutLimit" DECIMAL(10,2),
ADD COLUMN     "verificationLevel" INTEGER NOT NULL DEFAULT 1,
ALTER COLUMN "password" DROP NOT NULL,
ALTER COLUMN "firstName" DROP NOT NULL,
ALTER COLUMN "lastName" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "EmailVerification_code_idx" ON "EmailVerification"("code");

-- CreateIndex
CREATE INDEX "EmailVerification_email_idx" ON "EmailVerification"("email");
