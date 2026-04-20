-- CreateEnum
CREATE TYPE "StaffInvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED');

-- CreateTable
CREATE TABLE "StaffInvitation" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "invitedById" TEXT NOT NULL,
    "organizationName" TEXT,
    "scope" TEXT NOT NULL DEFAULT 'PLATFORM',
    "status" "StaffInvitationStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "acceptedUserId" TEXT,
    "revokedAt" TIMESTAMP(3),
    "revokedById" TEXT,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StaffInvitation_token_key" ON "StaffInvitation"("token");

-- CreateIndex
CREATE INDEX "StaffInvitation_email_idx" ON "StaffInvitation"("email");

-- CreateIndex
CREATE INDEX "StaffInvitation_token_idx" ON "StaffInvitation"("token");

-- CreateIndex
CREATE INDEX "StaffInvitation_status_idx" ON "StaffInvitation"("status");

-- CreateIndex
CREATE INDEX "StaffInvitation_invitedById_idx" ON "StaffInvitation"("invitedById");

-- CreateIndex
CREATE INDEX "StaffInvitation_expiresAt_idx" ON "StaffInvitation"("expiresAt");

-- AddForeignKey
ALTER TABLE "StaffInvitation" ADD CONSTRAINT "StaffInvitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
