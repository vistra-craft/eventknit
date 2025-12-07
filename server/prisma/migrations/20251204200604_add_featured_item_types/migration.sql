-- CreateEnum
CREATE TYPE "FeaturedItemType" AS ENUM ('EVENT', 'IMAGE');

-- AlterTable
ALTER TABLE "FeaturedEvent" ADD COLUMN     "description" TEXT,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "linkText" TEXT,
ADD COLUMN     "linkUrl" TEXT,
ADD COLUMN     "title" TEXT,
ADD COLUMN     "type" "FeaturedItemType" NOT NULL DEFAULT 'EVENT',
ALTER COLUMN "eventId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "FeaturedEvent_type_idx" ON "FeaturedEvent"("type");
