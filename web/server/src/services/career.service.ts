import { prisma } from '../config/database.js';
import { emailService } from './email.service.js';
import { logger } from '../utils/logger.js';

export interface CareerInquiryInput {
  email: string;
  source?: string;
  ipAddress?: string;
  userAgent?: string;
}

class CareerService {
  /**
   * Submit a career inquiry and send auto-reply email
   */
  async submitInquiry(data: CareerInquiryInput): Promise<{ id: string; email: string }> {
    // Check for recent submissions from same email (rate limiting)
    const recentInquiry = await prisma.careerInquiry.findFirst({
      where: {
        email: data.email.toLowerCase(),
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
    });

    if (recentInquiry) {
      logger.warn(`Duplicate career inquiry attempt from: ${data.email}`);
      // Still return success to prevent email enumeration
      return { id: recentInquiry.id, email: recentInquiry.email };
    }

    // Create the inquiry record
    const inquiry = await prisma.careerInquiry.create({
      data: {
        email: data.email.toLowerCase(),
        source: data.source,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        status: 'PENDING',
        emailSentAt: new Date(),
      },
    });

    // Send the auto-reply email
    try {
      await this.sendCareerEmail(data.email);
      logger.info(`Career inquiry email sent to: ${data.email}`);
    } catch (error) {
      logger.error(`Failed to send career email to: ${data.email}`, error);
      // Don't throw - the inquiry is still recorded
    }

    return { id: inquiry.id, email: inquiry.email };
  }

  /**
   * Send the career inquiry auto-reply email
   */
  private async sendCareerEmail(email: string): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Hello from EventKnit</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">

              <p style="font-size: 24px; margin: 0 0 24px 0;">Hey there</p>

              <p style="margin: 0 0 20px 0; color: #333;">Let us tell you a bit about ourselves.</p>

              <p style="margin: 0 0 20px 0; color: #333;"><strong style="color: #1D9BF0;">We're EventKnit.</strong></p>

              <p style="margin: 0 0 20px 0; color: #555;">
                We started because we believed event organizers deserved a partner, not just a platform. Someone who shows up, understands the pressure, and helps make things actually work.
              </p>

              <p style="margin: 0 0 20px 0; color: #555;">
                Over the years, we've worked with organizers across cities and event types; concerts, conferences, community meetups, and corporate functions. We've grown by listening, solving problems, and helping events succeed. Along the way, we've learned a lot about building trust, growing networks, and scaling ideas without losing the human touch.
              </p>

              <p style="margin: 0 0 20px 0; color: #555;">
                We're still learning, still growing, and still figuring out how to make EventKnit bigger and better, helping organizers, building partnerships, and connecting communities.
              </p>

              <div style="border-left: 3px solid #1D9BF0; padding-left: 20px; margin: 30px 0;">
                <p style="margin: 0 0 16px 0; color: #333; font-weight: 500;">
                  Now, we'd love to hear your story.
                </p>
            
              </div>

              <p style="margin: 20px 0; color: #555;">
                We're not looking for a polished resume, just your perspective. Your story tells us far more than a list of titles ever could.
              </p>

              <p style="margin: 20px 0; color: #333; font-weight: 500;">
                Whenever you're ready, hit reply and tell us what you'd like us to know.
              </p>

              <p style="margin: 30px 0 0 0; color: #333;">
                Excited to hear from you,
              </p>

              <p style="margin: 8px 0 0 0; color: #1D9BF0; font-weight: 600;">
                The EventKnit Team
              </p>

            </div>

            <p style="font-size: 12px; color: #999; text-align: center; margin-top: 30px;">
              EventKnit &middot; Making events work
            </p>
          </div>
        </body>
      </html>
    `;

    const text = `Hey there

Let us tell you a bit about ourselves.

We're EventKnit.

We started because we believed event organizers deserved a partner, not just a platform. Someone who shows up, understands the pressure, and helps make things actually work.

Over the years, we've worked with organizers across cities and event types; concerts, conferences, community meetups, and corporate functions. We've grown by listening, solving problems, and helping events succeed. Along the way, we've learned a lot about building trust, growing networks, and scaling ideas without losing the human touch.

We're still learning, still growing, and still figuring out how to make EventKnit bigger and better, helping organizers, building partnerships, and connecting communities.

Now, we'd love to hear your story.

How did you get here? What drives you? What projects, ideas, or challenges have shaped how you think and act?

We're not looking for a polished resume, just your perspective. Your story tells us far more than a list of titles ever could.

Whenever you're ready, hit reply and tell us what you'd like us to know.

Excited to hear from you,
The EventKnit Team`;

    await emailService.sendEmail({
      to: email,
      subject: 'Hello — we\'re EventKnit',
      html,
      text,
    });
  }

  /**
   * Get all career inquiries (admin only)
   */
  async getAllInquiries(options: {
    status?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const { status, page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const where = status ? { status } : {};

    const [inquiries, total] = await Promise.all([
      prisma.careerInquiry.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.careerInquiry.count({ where }),
    ]);

    return {
      inquiries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update inquiry status (admin only)
   */
  async updateInquiryStatus(
    id: string,
    data: {
      status: string;
      notes?: string;
      reviewedBy?: string;
    },
  ) {
    return prisma.careerInquiry.update({
      where: { id },
      data: {
        status: data.status,
        notes: data.notes,
        reviewedBy: data.reviewedBy,
        reviewedAt: new Date(),
      },
    });
  }
}

export const careerService = new CareerService();
