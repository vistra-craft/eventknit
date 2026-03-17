/**
 * Test cleanup helper.
 *
 * Uses the app's shared Prisma client. Flushes tracked background tasks
 * before truncating data. Uses TRUNCATE CASCADE for reliable cleanup
 * regardless of FK constraint order.
 */

import { prisma } from '../src/config/database';
import { backgroundTasks } from '../src/utils/background-tasks';

/**
 * Clean up all test data.
 *
 * 1. Flush tracked background tasks (emails, notifications, etc.)
 * 2. TRUNCATE User and Event with CASCADE — this reliably removes all
 *    dependent rows regardless of FK constraint type (Cascade, Restrict, SetNull).
 */
export async function cleanupTestData(_tx?: any) {
  await backgroundTasks.flush();

  // TRUNCATE CASCADE removes all rows and cascades to all referencing tables,
  // bypassing onDelete: Restrict constraints that block regular DELETE.
  try {
    await prisma.$executeRawUnsafe(
      'TRUNCATE "User", "Event" CASCADE',
    );
  } catch (e: any) {
    // Fallback to individual deletes if TRUNCATE fails
    console.warn('[cleanup] TRUNCATE failed, falling back to DELETE:', e?.message);
    const tables = [
      'SupportResponse', 'SupportQuery', 'SocialMessage',
      'TicketTransfer', 'TicketResale', 'ServicePointSession',
      'SubscriptionOverride', 'Invoice', 'PaymentPlan',
      'TeamRolePermission', 'TeamRoleTemplate',
      'RefreshToken', 'AuditLog', 'StaffInvitation', 'StaffProfile',
      'Event', 'User',
    ];
    for (const table of tables) {
      try {
        await prisma.$executeRawUnsafe(`DELETE FROM "${table}"`);
      } catch (delErr: any) {
        const msg = (delErr?.message || '').toLowerCase();
        if (!msg.includes('does not exist') && !msg.includes('relation')) {
          console.warn(`[cleanup] DELETE FROM "${table}" failed: ${delErr?.message}`);
        }
      }
    }
  }
}
