-- AlterTable
ALTER TABLE "EventPaymentTransaction" ADD COLUMN     "paystackReference" TEXT;

-- AlterTable
ALTER TABLE "TicketTransfer" ALTER COLUMN "toUserId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "address" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "zipCode" TEXT;
