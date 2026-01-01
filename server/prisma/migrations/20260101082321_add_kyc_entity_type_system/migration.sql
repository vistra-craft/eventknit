/*
  Warnings:

  - You are about to drop the column `affiliateId` on the `PromoCode` table. All the data in the column will be lost.
  - Changed the type of `documentType` on the `KYCDocument` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "OrganizerEntityType" AS ENUM ('INDIVIDUAL', 'SOLE_PROPRIETOR', 'PARTNERSHIP', 'LIMITED_LIABILITY_COMPANY', 'LIMITED_LIABILITY_PARTNERSHIP', 'EMPLOYMENT_AGENCY_LLC', 'FOREIGN_COMPANY_COMPLIANCE', 'PRIVATE_HOSPITAL_SOLE_PROPRIETOR', 'PRIVATE_HOSPITAL_LLC', 'PUBLIC_HOSPITAL', 'PRIVATE_EDUCATION_SOLE_PROPRIETOR', 'PRIVATE_EDUCATION_LLC', 'INTERNATIONAL_EDUCATION_LLC', 'PUBLIC_EDUCATION', 'COOPERATIVE_SOCIETY', 'INSURANCE_REINSURANCE', 'NGO', 'EMBASSY_UN_WORLD_BANK', 'DENOMINATIONAL_CHURCH', 'PARTNERSHIP_PROFESSIONAL', 'TRUST');

-- CreateEnum
CREATE TYPE "KYCDocumentType" AS ENUM ('PP_NEW_CONTRACT', 'NATIONAL_ID', 'PASSPORT', 'ALIEN_ID', 'MILITARY_ID', 'KRA_PIN', 'CERTIFICATE_OF_REGISTRATION', 'CERTIFICATE_OF_INCORPORATION', 'COMPANY_KRA_PIN', 'BANK_STATEMENT', 'CANCELLED_CHEQUE', 'BANK_LETTER', 'LETTER_AUTHORIZING_ENTRY', 'CR12', 'CR13', 'PARTNERSHIP_DEED', 'AFFIDAVIT', 'MINISTRY_OF_HEALTH_LICENSE', 'KMPDB_LICENSE', 'MINISTRY_OF_EDUCATION_LICENSE', 'EPRA_LICENSE', 'IRA_LICENSE', 'TRA_MEMBERSHIP', 'KATO_MEMBERSHIP', 'KATA_MEMBERSHIP', 'KCAA_REGISTRATION', 'TOUR_OPERATOR_LICENSE', 'ORGANIZATION_CONSTITUTION', 'BOARD_ELECTION_MINUTES', 'TRUST_DEED', 'ACCREDITATION_LETTER', 'AGREEMENT_LETTER', 'LETTER_OF_INTRODUCTION', 'COUNTY_CONTRACT_FORM', 'COMPANY_PROFILE', 'ONLINE_LINK', 'TRADE_NAME_CERTIFICATE', 'GRANT_PROBATE', 'AUTHORIZED_SIGNATORY_LETTER', 'TILL_APPLICATION_FORM', 'MPESA_AUTHORIZATION_FORM', 'ANNUAL_RETURNS', 'DIRECTORS_LIST_LETTERHEAD');

-- DropForeignKey
ALTER TABLE "PromoCode" DROP CONSTRAINT "PromoCode_affiliateId_fkey";

-- DropIndex
DROP INDEX "PromoCode_affiliateId_idx";

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "timezone" TEXT;

-- AlterTable
ALTER TABLE "KYCDocument" ADD COLUMN     "documentCategory" TEXT,
ADD COLUMN     "expiryDate" TIMESTAMP(3),
ADD COLUMN     "isConditional" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isRequired" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "issueDate" TIMESTAMP(3),
DROP COLUMN "documentType",
ADD COLUMN     "documentType" "KYCDocumentType" NOT NULL;

-- AlterTable
ALTER TABLE "PromoCode" DROP COLUMN "affiliateId";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "organizerBusinessName" TEXT,
ADD COLUMN     "organizerCountry" TEXT DEFAULT 'KE',
ADD COLUMN     "organizerEntityType" "OrganizerEntityType",
ADD COLUMN     "organizerIndustry" TEXT,
ADD COLUMN     "organizerRegistrationNumber" TEXT;

-- CreateTable
CREATE TABLE "OrganizerDirector" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "nationality" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "documentType" TEXT NOT NULL,
    "documentNumber" TEXT NOT NULL,
    "kraPin" TEXT,
    "sharePercentage" DECIMAL(5,2),
    "isTopFive" BOOLEAN NOT NULL DEFAULT true,
    "position" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizerDirector_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrganizerDirector_userId_idx" ON "OrganizerDirector"("userId");

-- CreateIndex
CREATE INDEX "OrganizerDirector_userId_isTopFive_idx" ON "OrganizerDirector"("userId", "isTopFive");

-- CreateIndex
CREATE INDEX "KYCDocument_documentType_idx" ON "KYCDocument"("documentType");

-- CreateIndex
CREATE INDEX "KYCDocument_userId_documentType_idx" ON "KYCDocument"("userId", "documentType");

-- AddForeignKey
ALTER TABLE "OrganizerDirector" ADD CONSTRAINT "OrganizerDirector_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
