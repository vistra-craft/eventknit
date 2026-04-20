-- CreateTable
CREATE TABLE "SubscriptionPayment" (
    "id" TEXT NOT NULL,
    "organizerId" TEXT NOT NULL,
    "tier" "SubscriptionTier" NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "gateway" TEXT NOT NULL DEFAULT 'PAYSTACK',
    "gatewayReference" TEXT NOT NULL,
    "gatewayTransactionId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "billingEmail" TEXT NOT NULL,
    "paymentDate" TIMESTAMP(3),
    "gatewayMetadata" JSONB,
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPayment_gatewayReference_key" ON "SubscriptionPayment"("gatewayReference");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPayment_idempotencyKey_key" ON "SubscriptionPayment"("idempotencyKey");

-- CreateIndex
CREATE INDEX "SubscriptionPayment_organizerId_idx" ON "SubscriptionPayment"("organizerId");

-- CreateIndex
CREATE INDEX "SubscriptionPayment_gatewayReference_idx" ON "SubscriptionPayment"("gatewayReference");

-- CreateIndex
CREATE INDEX "SubscriptionPayment_status_idx" ON "SubscriptionPayment"("status");

-- AddForeignKey
ALTER TABLE "SubscriptionPayment" ADD CONSTRAINT "SubscriptionPayment_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
