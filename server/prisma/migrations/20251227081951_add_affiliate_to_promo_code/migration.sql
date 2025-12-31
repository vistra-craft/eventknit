-- AlterTable
ALTER TABLE "PromoCode" ADD COLUMN     "affiliateId" TEXT;

-- CreateIndex
CREATE INDEX "PromoCode_affiliateId_idx" ON "PromoCode"("affiliateId");

-- AddForeignKey
ALTER TABLE "PromoCode" ADD CONSTRAINT "PromoCode_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "Affiliate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
