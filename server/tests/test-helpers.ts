/**
 * Helper functions for test cleanup
 * Ensures proper deletion order to avoid foreign key constraint violations
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Clean up all test data in the correct order
 * This ensures foreign key constraints are respected
 */
export async function cleanupTestData(tx?: any) {
  const client = tx || prisma;

  // Delete in order: child records first, then parent records
  await client.sMSSession.deleteMany().catch(() => {}); // May not exist in all schemas
  await client.ticketScan.deleteMany();
  await client.eventStaff.deleteMany().catch(() => {}); // May not exist in all schemas
  await client.eventPaymentTransaction.deleteMany().catch(() => {}); // May not exist in all schemas
  await client.platformFee.deleteMany().catch(() => {}); // May not exist in all schemas
  await client.eventRegistration.deleteMany();
  await client.featuredEvent.deleteMany();
  await client.ticketTemplate.deleteMany();
  await client.eventInvitation.deleteMany();
  await client.organizerDisbursement.deleteMany();
  await client.bulkMessage.deleteMany();
  await client.emailTemplate.deleteMany();
  await client.refund.deleteMany();
  await client.paymentReconciliation.deleteMany();
  await client.kYCDocument.deleteMany();
  await client.notificationPreference.deleteMany();
  await client.notification.deleteMany();
  await client.event.deleteMany();
  await client.auditLog.deleteMany();
  await client.refreshToken.deleteMany();
  await client.magicLinkToken.deleteMany().catch(() => {}); // May not exist in all schemas
  await client.passwordReset.deleteMany();
  await client.emailVerification.deleteMany();
  await client.user.deleteMany();
}

