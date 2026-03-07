import { prisma } from '../config/database.js';
import { emailService } from './email.service.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

const CLAIM_BASE_URL = process.env.CLIENT_URL ?? 'http://localhost:5173';

export class TicketIssuanceService {
  /**
   * Issue complementary tickets to one or more email addresses.
   * Each email gets its own issuance record with a unique claim token.
   */
  static async issue(
    packageId: string,
    organizerId: string,
    emails: string[],
    quantity: number,
    note?: string,
    expiresAt?: Date,
  ) {
    const pkg = await prisma.ticketPackage.findUnique({
      where: { id: packageId },
      include: { event: { select: { id: true, title: true } } },
    });

    if (!pkg) {
      throw new NotFoundError('Ticket package not found');
    }

    if (pkg.organizerId !== organizerId) {
      throw new ValidationError('You do not have permission to issue tickets for this package');
    }

    if (pkg.type !== 'complementary') {
      throw new ValidationError('Only complementary packages can be issued directly');
    }

    if (!emails.length || emails.length > 50) {
      throw new ValidationError('Provide between 1 and 50 email addresses');
    }

    if (quantity < 1 || quantity > 20) {
      throw new ValidationError('Quantity must be between 1 and 20 per recipient');
    }

    // Create issuance records
    const issuances = await prisma.$transaction(
      emails.map(email =>
        prisma.ticketIssuance.create({
          data: {
            packageId,
            email: email.toLowerCase().trim(),
            quantity,
            note: note || null,
            expiresAt: expiresAt || null,
          },
        }),
      ),
    );

    // Send emails (best-effort — don't fail the whole request on email error)
    await Promise.allSettled(
      issuances.map(issuance =>
        emailService.sendEmail({
          to: issuance.email,
          subject: `You've received a complimentary ticket to ${pkg.event.title}`,
          html: buildIssuanceEmail({
            eventTitle: pkg.event.title,
            packageName: pkg.name,
            quantity: issuance.quantity,
            claimUrl: `${CLAIM_BASE_URL}/claim/${issuance.claimToken}`,
            expiresAt: issuance.expiresAt,
          }),
        }),
      ),
    );

    return issuances;
  }

  /**
   * List all issuances for a package (organizer view).
   */
  static async listForPackage(packageId: string, organizerId: string) {
    const pkg = await prisma.ticketPackage.findUnique({ where: { id: packageId } });

    if (!pkg) throw new NotFoundError('Ticket package not found');
    if (pkg.organizerId !== organizerId) {
      throw new ValidationError('Access denied');
    }

    return prisma.ticketIssuance.findMany({
      where: { packageId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Cancel a pending issuance.
   */
  static async cancel(issuanceId: string, organizerId: string) {
    const issuance = await prisma.ticketIssuance.findUnique({
      where: { id: issuanceId },
      include: { package: true },
    });

    if (!issuance) throw new NotFoundError('Issuance not found');
    if (issuance.package.organizerId !== organizerId) throw new ValidationError('Access denied');
    if (issuance.status === 'CLAIMED') throw new ValidationError('Cannot cancel a claimed issuance');

    return prisma.ticketIssuance.update({
      where: { id: issuanceId },
      data: { status: 'CANCELLED' },
    });
  }

  /**
   * List all issuances across all events (admin view).
   */
  static async listAll(filters: {
    status?: string;
    eventId?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const { status, eventId, page = 1, limit = 50 } = filters;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (eventId) {
      where.package = { event: { id: eventId } };
    }

    const [issuances, total] = await Promise.all([
      prisma.ticketIssuance.findMany({
        where,
        include: {
          package: {
            select: {
              id: true,
              name: true,
              type: true,
              event: { select: { id: true, title: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.ticketIssuance.count({ where }),
    ]);

    return { issuances, total, page, limit };
  }

  /**
   * Admin cancel — no organizer ownership check.
   */
  static async adminCancel(issuanceId: string) {
    const issuance = await prisma.ticketIssuance.findUnique({ where: { id: issuanceId } });
    if (!issuance) throw new NotFoundError('Issuance not found');
    if (issuance.status === 'CLAIMED') throw new ValidationError('Cannot cancel a claimed issuance');

    return prisma.ticketIssuance.update({
      where: { id: issuanceId },
      data: { status: 'CANCELLED' },
    });
  }

  /**
   * Claim a ticket via token (attendee-facing).
   * Returns the issuance so the caller can create a registration.
   */
  static async claim(token: string, userId: string) {
    const issuance = await prisma.ticketIssuance.findUnique({
      where: { claimToken: token },
      include: { package: { include: { event: true } } },
    });

    if (!issuance) throw new NotFoundError('Claim link not found or already used');

    if (issuance.status !== 'PENDING') {
      throw new ValidationError(
        issuance.status === 'CLAIMED'
          ? 'This ticket has already been claimed'
          : 'This claim link is no longer valid',
      );
    }

    if (issuance.expiresAt && issuance.expiresAt < new Date()) {
      await prisma.ticketIssuance.update({ where: { id: issuance.id }, data: { status: 'EXPIRED' } });
      throw new ValidationError('This claim link has expired');
    }

    return prisma.ticketIssuance.update({
      where: { id: issuance.id },
      data: {
        status: 'CLAIMED',
        claimedAt: new Date(),
        claimedByUserId: userId,
      },
      include: { package: { include: { event: true } } },
    });
  }
}

// ---------------------------------------------------------------------------
// Email template
// ---------------------------------------------------------------------------

function buildIssuanceEmail({
  eventTitle,
  packageName,
  quantity,
  claimUrl,
  expiresAt,
}: {
  eventTitle: string;
  packageName: string;
  quantity: number;
  claimUrl: string;
  expiresAt: Date | null;
}) {
  const expiryLine = expiresAt
    ? `<p style="color:#6b7280;font-size:14px;">This link expires on <strong>${new Date(expiresAt).toLocaleDateString('en-US', { dateStyle: 'long' })}</strong>.</p>`
    : '';

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family:system-ui,sans-serif;max-width:560px;margin:40px auto;color:#111827;padding:0 16px;">
  <h2 style="margin-bottom:4px;">You're on the list! 🎟️</h2>
  <p style="color:#6b7280;margin-top:0;">You've received a complimentary ticket.</p>

  <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:24px;margin:24px 0;">
    <p style="margin:0 0 4px 0;font-size:14px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Event</p>
    <p style="margin:0 0 16px 0;font-size:18px;font-weight:600;">${eventTitle}</p>
    <p style="margin:0 0 4px 0;font-size:14px;color:#6b7280;">Package</p>
    <p style="margin:0 0 16px 0;font-weight:500;">${packageName}</p>
    <p style="margin:0 0 4px 0;font-size:14px;color:#6b7280;">Tickets</p>
    <p style="margin:0;">${quantity} complimentary ticket${quantity !== 1 ? 's' : ''}</p>
  </div>

  ${expiryLine}

  <a href="${claimUrl}"
     style="display:inline-block;background:#6366f1;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;margin:8px 0;">
    Claim My Ticket${quantity !== 1 ? 's' : ''}
  </a>

  <p style="color:#9ca3af;font-size:12px;margin-top:32px;">
    This link is personal to you — please do not share it.
    If you did not expect this, you can safely ignore this email.
  </p>
</body>
</html>`;
}
