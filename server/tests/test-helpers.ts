/**
 * Helper functions for test cleanup
 * Ensures proper deletion order to avoid foreign key constraint violations
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Clean up all test data in the correct order
 * This ensures foreign key constraints are respected
 * 
 * IMPORTANT: In PostgreSQL, if ANY operation in a transaction fails, the entire transaction
 * is aborted and subsequent commands are ignored. We use savepoints to handle this.
 */
export async function cleanupTestData(tx?: any) {
  const client = tx || prisma;
  const isInTransaction = !!tx;

  // Helper to safely execute delete operations using savepoints in transactions
  const safeDelete = async (operation: () => Promise<any>, operationName: string) => {
    if (isInTransaction) {
      // In a transaction, use savepoints to handle errors without aborting the transaction
      // Generate a unique savepoint name
      const savepointId = Math.random().toString(36).substring(7);
      const savepointName = `sp_${operationName}_${savepointId}`;

      try {
        // Create a savepoint before the operation using Prisma's $executeRaw
        // Note: We need to use Prisma.sql for dynamic identifiers
        const { Prisma } = await import('@prisma/client');
        await (client as any).$executeRaw(Prisma.sql`SAVEPOINT ${Prisma.raw(savepointName)}`);
        await operation();
        // Release savepoint on success
        await (client as any).$executeRaw(Prisma.sql`RELEASE SAVEPOINT ${Prisma.raw(savepointName)}`);
      } catch (error) {
        // Rollback to savepoint on error - this prevents transaction abortion
        try {
          const { Prisma } = await import('@prisma/client');
          await (client as any).$executeRaw(Prisma.sql`ROLLBACK TO SAVEPOINT ${Prisma.raw(savepointName)}`);
        } catch (_rollbackError) {
          // If rollback fails, transaction might already be aborted - that's okay
          // The outer transaction will handle the rollback
        }
        // Don't throw - some tables may not exist or may be empty
        // Log non-critical errors for debugging
        if (error instanceof Error) {
          const errorMessage = error.message.toLowerCase();
          if (!errorMessage.includes('does not exist') &&
            !errorMessage.includes('relation') &&
            !errorMessage.includes('table')) {
            console.warn(`[cleanupTestData] Non-critical cleanup error for ${operationName}:`, error.message);
          }
        }
      }
    } else {
      // Not in a transaction - simple try-catch is sufficient
      try {
        await operation();
      } catch (error) {
        // Some tables may not exist in all test environments (e.g., sMSSession, magicLinkToken)
        // This is expected and not a test failure - we log but don't throw
        if (error instanceof Error) {
          // Only ignore "does not exist" or "relation does not exist" errors
          const errorMessage = error.message.toLowerCase();
          if (errorMessage.includes('does not exist') ||
            errorMessage.includes('relation') ||
            errorMessage.includes('table')) {
            // Expected - table doesn't exist in this schema, skip silently
            return;
          }
          // For other errors, log them but don't fail the test
          // This helps identify real issues without breaking test isolation
          console.warn(`[cleanupTestData] Non-critical cleanup error for ${operationName}:`, error.message);
        }
      }
    }
  };

  // Delete in order: child records first, then parent records
  // TicketLineItem must be deleted before EventRegistration (foreign key constraint)
  await safeDelete(() => client.ticketLineItem.deleteMany(), 'ticketLineItem');
  await safeDelete(() => client.sMSSession.deleteMany(), 'sMSSession');
  await safeDelete(() => client.ticketScan.deleteMany(), 'ticketScan');
  await safeDelete(() => client.eventStaff.deleteMany(), 'eventStaff');
  await safeDelete(() => client.eventPaymentTransaction.deleteMany(), 'eventPaymentTransaction');
  await safeDelete(() => client.platformFee.deleteMany(), 'platformFee');
  await safeDelete(() => client.eventRegistration.deleteMany(), 'eventRegistration');
  await safeDelete(() => client.featuredEvent.deleteMany(), 'featuredEvent');
  await safeDelete(() => client.ticketTemplate.deleteMany(), 'ticketTemplate');
  await safeDelete(() => client.eventInvitation.deleteMany(), 'eventInvitation');
  await safeDelete(() => client.organizerDisbursement.deleteMany(), 'organizerDisbursement');
  await safeDelete(() => client.bulkMessage.deleteMany(), 'bulkMessage');
  await safeDelete(() => client.emailTemplate.deleteMany(), 'emailTemplate');
  await safeDelete(() => client.refund.deleteMany(), 'refund');
  await safeDelete(() => client.paymentReconciliation.deleteMany(), 'paymentReconciliation');
  await safeDelete(() => client.dataAccessAuditLog.deleteMany(), 'dataAccessAuditLog');
  await safeDelete(() => client.platformIncome.deleteMany(), 'platformIncome');
  await safeDelete(() => client.subscriptionPayment.deleteMany(), 'subscriptionPayment');
  await safeDelete(() => client.subscriptionOverride.deleteMany(), 'subscriptionOverride');
  await safeDelete(() => client.organizerSubscription.deleteMany(), 'organizerSubscription');
  await safeDelete(() => client.attendeeConsent.deleteMany(), 'attendeeConsent');
  await safeDelete(() => client.dataAccessAuditLog.deleteMany(), 'dataAccessAuditLog');
  await safeDelete(() => client.organizerDirector.deleteMany(), 'organizerDirector');
  await safeDelete(() => client.kYCDocument.deleteMany(), 'kYCDocument');
  await safeDelete(() => client.notificationPreference.deleteMany(), 'notificationPreference');
  await safeDelete(() => client.notification.deleteMany(), 'notification');
  await safeDelete(() => client.event.deleteMany(), 'event');
  // Permission system cleanup (must be before user cleanup due to foreign keys)
  await safeDelete(() => client.teamRolePermission.deleteMany(), 'teamRolePermission');
  await safeDelete(() => client.teamRoleTemplate.deleteMany(), 'teamRoleTemplate');
  await safeDelete(() => client.permission.deleteMany(), 'permission');

  await safeDelete(() => client.auditLog.deleteMany(), 'auditLog');
  await safeDelete(() => client.refreshToken.deleteMany(), 'refreshToken');
  await safeDelete(() => client.magicLinkToken.deleteMany(), 'magicLinkToken');
  await safeDelete(() => client.passwordReset.deleteMany(), 'passwordReset');
  await safeDelete(() => client.emailVerification.deleteMany(), 'emailVerification');
  await safeDelete(() => client.user.deleteMany(), 'user');
}




