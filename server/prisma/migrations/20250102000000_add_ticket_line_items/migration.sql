-- CreateTable
CREATE TABLE "TicketLineItem" (
    "id" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "ticketType" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "totalPrice" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TicketLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TicketLineItem_registrationId_idx" ON "TicketLineItem"("registrationId");

-- CreateIndex
CREATE INDEX "TicketLineItem_ticketType_idx" ON "TicketLineItem"("ticketType");

-- AddForeignKey
ALTER TABLE "TicketLineItem" ADD CONSTRAINT "TicketLineItem_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "EventRegistration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
