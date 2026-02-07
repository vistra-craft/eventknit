-- CreateEnum
CREATE TYPE "DataAccessLevel" AS ENUM ('RESTRICTED', 'STANDARD', 'FULL');

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "organizerDataAccess" "DataAccessLevel" NOT NULL DEFAULT 'RESTRICTED';
