-- CreateTable TicketIssuance
CREATE TABLE "TicketIssuance" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "claimToken" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "claimedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "claimedByUserId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TicketIssuance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TicketIssuance_claimToken_key" ON "TicketIssuance"("claimToken");

-- CreateIndex
CREATE INDEX "TicketIssuance_packageId_idx" ON "TicketIssuance"("packageId");

-- CreateIndex
CREATE INDEX "TicketIssuance_claimToken_idx" ON "TicketIssuance"("claimToken");

-- CreateIndex
CREATE INDEX "TicketIssuance_email_idx" ON "TicketIssuance"("email");

-- AddForeignKey
ALTER TABLE "TicketIssuance" ADD CONSTRAINT "TicketIssuance_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "TicketPackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
