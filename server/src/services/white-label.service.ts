/* global URL */
import { BrandingStatus, CustomDomainStatus } from '@prisma/client';
import { NotFoundError, ValidationError } from '../utils/errors';
import { logger } from '../utils/logger.js';
import { prisma } from '../config/database.js';

export interface CreateBrandingData {
  logoUrl?: string;
  logoLightUrl?: string;
  logoDarkUrl?: string;
  faviconUrl?: string;
  coverImageUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
  linkColor?: string;
  fontFamily?: string;
  headingFont?: string;
  brandName?: string;
  tagline?: string;
  supportEmail?: string;
  supportPhone?: string;
  websiteUrl?: string;
  emailHeaderImage?: string;
  emailFooterText?: string;
  emailSignature?: string;
  socialLinks?: Record<string, string>;
  metadata?: Record<string, unknown>;
}

export interface UpdateBrandingData extends Partial<CreateBrandingData> {
  status?: BrandingStatus;
}

export interface CreateCustomDomainData {
  domain: string;
  subdomain?: string;
  isPrimary?: boolean;
  cnameTarget?: string;
  ipAddress?: string;
}

export interface UpdateCustomDomainData {
  isPrimary?: boolean;
  status?: CustomDomainStatus;
  sslEnabled?: boolean;
  sslCertificate?: string;
  sslKey?: string;
}

export class WhiteLabelService {
  /**
   * Simple creator used by tests to ensure organizer scoped record
   */
  static async createBranding(
    organizerId: string,
    data: { domain: string; theme?: Record<string, unknown> },
  ) {
    const branding = await prisma.whiteLabelBranding.create({
      data: {
        organizerId,
        brandName: data.domain,
        metadata: { domain: data.domain, theme: data.theme || {} } as any,
      },
    });

    return branding;
  }

  /**
   * Update branding scoped to organizer
   */
  static async updateBranding(
    organizerId: string,
    brandingId: string,
    data: { domain?: string; theme?: Record<string, unknown> },
  ) {
    const existing = await prisma.whiteLabelBranding.findFirst({
      where: {
        id: brandingId,
        organizerId,
      },
    });

    if (!existing) {
      // Distinguish cross-org from missing
      const ownedByOther = await prisma.whiteLabelBranding.findFirst({
        where: { id: brandingId },
      });
      if (ownedByOther) {
        throw new ValidationError('Branding does not belong to organizer');
      }
      throw new NotFoundError('Branding not found');
    }

    const updated = await prisma.whiteLabelBranding.update({
      where: { id: brandingId },
      data: {
        ...(data.domain ? { brandName: data.domain } : {}),
        ...(data.domain || data.theme
          ? {
            metadata: {
              ...(existing.metadata as any),
              ...(data.domain ? { domain: data.domain } : {}),
              ...(data.theme ? { theme: data.theme } : {}),
            } as any,
          }
          : {}),
      },
    });

    return updated;
  }

  /**
   * Get or create branding for organizer
   */
  static async getOrCreateBranding(organizerId: string) {
    try {
      let branding = await prisma.whiteLabelBranding.findUnique({
        where: { organizerId },
      });

      if (!branding) {
        branding = await prisma.whiteLabelBranding.create({
          data: {
            organizerId,
            status: BrandingStatus.PENDING_APPROVAL,
            isActive: false,
          },
        });
        logger.info(`Created new branding for organizer ${organizerId}`);
      }

      return branding;
    } catch (error) {
      logger.error('Failed to get or create branding:', error);
      throw error;
    }
  }

  /**
   * Get branding by organizer ID
   */
  static async getBrandingByOrganizerId(organizerId: string) {
    try {
      const branding = await prisma.whiteLabelBranding.findUnique({
        where: { organizerId },
        include: {
          organizer: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              organizationName: true,
            },
          },
        },
      });

      if (!branding) {
        throw new NotFoundError('Branding not found for this organizer');
      }

      return branding;
    } catch (error) {
      logger.error('Failed to get branding:', error);
      throw error;
    }
  }

  /**
   * Create or update branding
   */
  static async upsertBranding(
    organizerId: string,
    data: CreateBrandingData,
  ) {
    try {
      // Validate color formats if provided
      const colorFields = [
        'primaryColor',
        'secondaryColor',
        'accentColor',
        'backgroundColor',
        'textColor',
        'linkColor',
      ];
      for (const field of colorFields) {
        const raw = data[field as keyof CreateBrandingData];
        const value = typeof raw === 'string' ? raw : null;
        if (value && !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value)) {
          throw new ValidationError(`Invalid color format for ${field}. Use hex format (e.g., #FF5733)`);
        }
      }

      // Validate email format if provided
      if (data.supportEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.supportEmail)) {
        throw new ValidationError('Invalid support email format');
      }

      // Validate URL formats if provided
      const urlFields = ['logoUrl', 'logoLightUrl', 'logoDarkUrl', 'faviconUrl', 'coverImageUrl', 'websiteUrl', 'emailHeaderImage'];
      for (const field of urlFields) {
        const value = data[field as keyof CreateBrandingData];
        if (value) {
          try {
            new URL(value);
          } catch {
            throw new ValidationError(`Invalid URL format for ${field}`);
          }
        }
      }

      const branding = await prisma.whiteLabelBranding.upsert({
        where: { organizerId },
        create: {
          organizerId,
          ...data,
          socialLinks: data.socialLinks ? (data.socialLinks as any) : undefined,
          metadata: data.metadata ? (data.metadata as any) : undefined,
          status: BrandingStatus.PENDING_APPROVAL,
          isActive: false,
        },
        update: {
          ...data,
          socialLinks: data.socialLinks ? (data.socialLinks as any) : undefined,
          metadata: data.metadata ? (data.metadata as any) : undefined,
          status: BrandingStatus.PENDING_APPROVAL, // Reset to pending on update
          isActive: false,
        },
      });

      logger.info(`Branding upserted for organizer ${organizerId}`);
      return branding;
    } catch (error) {
      logger.error('Failed to upsert branding:', error);
      throw error;
    }
  }

  /**
   * Update branding status (admin only)
   */
  static async updateBrandingStatus(
    brandingId: string,
    status: BrandingStatus,
    approvedBy: string,
    rejectionReason?: string,
  ) {
    try {
      const branding = await prisma.whiteLabelBranding.findUnique({
        where: { id: brandingId },
      });

      if (!branding) {
        throw new NotFoundError('Branding not found');
      }

      const updated = await prisma.whiteLabelBranding.update({
        where: { id: brandingId },
        data: {
          status,
          isActive: status === BrandingStatus.ACTIVE,
          approvedBy: status === BrandingStatus.ACTIVE ? approvedBy : null,
          approvedAt: status === BrandingStatus.ACTIVE ? new Date() : null,
          rejectionReason: status === BrandingStatus.ACTIVE ? null : rejectionReason,
        },
      });

      logger.info(`Branding status updated: ${brandingId} to ${status} by ${approvedBy}`);
      return updated;
    } catch (error) {
      logger.error('Failed to update branding status:', error);
      throw error;
    }
  }

  /**
   * Get all brandings (admin only)
   */
  static async getAllBrandings(filters?: {
    status?: BrandingStatus;
    isActive?: boolean;
    search?: string;
  }) {
    try {
      const where: any = {};

      if (filters?.status) {
        where.status = filters.status;
      }

      if (filters?.isActive !== undefined) {
        where.isActive = filters.isActive;
      }

      if (filters?.search) {
        where.OR = [
          { brandName: { contains: filters.search, mode: 'insensitive' } },
          { organizer: { organizationName: { contains: filters.search, mode: 'insensitive' } } },
          { organizer: { email: { contains: filters.search, mode: 'insensitive' } } },
        ];
      }

      const brandings = await prisma.whiteLabelBranding.findMany({
        where,
        include: {
          organizer: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              organizationName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return brandings;
    } catch (error) {
      logger.error('Failed to get all brandings:', error);
      throw error;
    }
  }

  /**
   * Add custom domain
   */
  static async addCustomDomain(
    organizerId: string,
    data: CreateCustomDomainData,
  ) {
    try {
      // Validate domain format
      const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;
      if (!domainRegex.test(data.domain)) {
        throw new ValidationError('Invalid domain format');
      }

      // Check if domain already exists
      const existing = await prisma.customDomain.findUnique({
        where: { domain: data.domain },
      });

      if (existing) {
        throw new ValidationError('Domain already exists');
      }

      // Generate verification code
      const verificationCode = `eventknit-verify=${Buffer.from(`${organizerId}-${data.domain}`).toString('base64')}`;
      const verificationToken = Buffer.from(`${organizerId}-${data.domain}-${Date.now()}`).toString('base64');

      // If this is set as primary, unset other primary domains
      if (data.isPrimary) {
        await prisma.customDomain.updateMany({
          where: {
            organizerId,
            isPrimary: true,
          },
          data: {
            isPrimary: false,
          },
        });
      }

      const customDomain = await prisma.customDomain.create({
        data: {
          organizerId,
          domain: data.domain,
          subdomain: data.subdomain,
          isPrimary: data.isPrimary ?? false,
          cnameTarget: data.cnameTarget,
          ipAddress: data.ipAddress,
          status: CustomDomainStatus.PENDING,
          verificationCode,
          verificationToken,
        },
      });

      logger.info(`Custom domain added: ${data.domain} for organizer ${organizerId}`);
      return customDomain;
    } catch (error) {
      logger.error('Failed to add custom domain:', error);
      throw error;
    }
  }

  /**
   * Get custom domains for organizer
   */
  static async getCustomDomains(organizerId: string) {
    try {
      const domains = await prisma.customDomain.findMany({
        where: { organizerId },
        orderBy: [
          { isPrimary: 'desc' },
          { createdAt: 'desc' },
        ],
      });

      return domains;
    } catch (error) {
      logger.error('Failed to get custom domains:', error);
      throw error;
    }
  }

  /**
   * Get custom domain by ID
   */
  static async getCustomDomainById(domainId: string, organizerId?: string) {
    try {
      const where: any = { id: domainId };
      if (organizerId) {
        where.organizerId = organizerId;
      }

      const domain = await prisma.customDomain.findFirst({
        where,
        include: {
          organizer: {
            select: {
              id: true,
              email: true,
              organizationName: true,
            },
          },
        },
      });

      if (!domain) {
        throw new NotFoundError('Custom domain not found');
      }

      return domain;
    } catch (error) {
      logger.error('Failed to get custom domain:', error);
      throw error;
    }
  }

  /**
   * Update custom domain
   */
  static async updateCustomDomain(
    domainId: string,
    organizerId: string,
    data: UpdateCustomDomainData,
  ) {
    try {
      const domain = await prisma.customDomain.findFirst({
        where: {
          id: domainId,
          organizerId,
        },
      });

      if (!domain) {
        throw new NotFoundError('Custom domain not found');
      }

      // If setting as primary, unset other primary domains
      if (data.isPrimary) {
        await prisma.customDomain.updateMany({
          where: {
            organizerId,
            id: { not: domainId },
            isPrimary: true,
          },
          data: {
            isPrimary: false,
          },
        });
      }

      const updated = await prisma.customDomain.update({
        where: { id: domainId },
        data,
      });

      logger.info(`Custom domain updated: ${domainId}`);
      return updated;
    } catch (error) {
      logger.error('Failed to update custom domain:', error);
      throw error;
    }
  }

  /**
   * Verify custom domain (admin only)
   */
  static async verifyCustomDomain(
    domainId: string,
    verifiedBy: string,
    status: CustomDomainStatus,
    failureReason?: string,
  ) {
    try {
      const domain = await prisma.customDomain.findUnique({
        where: { id: domainId },
      });

      if (!domain) {
        throw new NotFoundError('Custom domain not found');
      }

      const updated = await prisma.customDomain.update({
        where: { id: domainId },
        data: {
          status,
          verifiedBy: status === CustomDomainStatus.VERIFIED ? verifiedBy : null,
          verifiedAt: status === CustomDomainStatus.VERIFIED ? new Date() : null,
          isActive: status === CustomDomainStatus.VERIFIED,
          failureReason: status === CustomDomainStatus.FAILED ? failureReason : null,
          lastCheckedAt: new Date(),
        },
      });

      logger.info(`Custom domain verified: ${domainId} by ${verifiedBy}`);
      return updated;
    } catch (error) {
      logger.error('Failed to verify custom domain:', error);
      throw error;
    }
  }

  /**
   * Delete custom domain
   */
  static async deleteCustomDomain(domainId: string, organizerId: string) {
    try {
      const domain = await prisma.customDomain.findFirst({
        where: {
          id: domainId,
          organizerId,
        },
      });

      if (!domain) {
        throw new NotFoundError('Custom domain not found');
      }

      await prisma.customDomain.delete({
        where: { id: domainId },
      });

      logger.info(`Custom domain deleted: ${domainId}`);
      return { success: true };
    } catch (error) {
      logger.error('Failed to delete custom domain:', error);
      throw error;
    }
  }

  /**
   * Get active branding for organizer (public API)
   */
  static async getActiveBranding(organizerId: string) {
    try {
      const branding = await prisma.whiteLabelBranding.findUnique({
        where: {
          organizerId,
          status: BrandingStatus.ACTIVE,
          isActive: true,
        },
      });

      return branding;
    } catch (error) {
      logger.error('Failed to get active branding:', error);
      throw error;
    }
  }

  /**
   * Get active custom domain for organizer (public API)
   */
  static async getActiveCustomDomain(organizerId: string) {
    try {
      const domain = await prisma.customDomain.findFirst({
        where: {
          organizerId,
          status: CustomDomainStatus.VERIFIED,
          isActive: true,
        },
        orderBy: { isPrimary: 'desc' },
      });

      return domain;
    } catch (error) {
      logger.error('Failed to get active custom domain:', error);
      throw error;
    }
  }

  /**
   * Render branded email template
   */
  static async renderBrandedEmail(
    organizerId: string,
    htmlContent: string,
    subject?: string,
  ): Promise<{ html: string; subject: string }> {
    try {
      const branding = await this.getActiveBranding(organizerId);

      if (!branding) {
        // Return unmodified if no branding
        return { html: htmlContent, subject: subject || '' };
      }

      // Build email wrapper with branding
      const brandedHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${subject || 'Email'}</title>
            ${branding.fontFamily ? `<style>body { font-family: ${branding.fontFamily}, sans-serif; }</style>` : ''}
          </head>
          <body style="margin: 0; padding: 0; background-color: ${branding.backgroundColor || '#f5f5f5'};">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${branding.backgroundColor || '#f5f5f5'}; padding: 20px 0;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
                    ${branding.emailHeaderImage || branding.logoUrl ? `
                      <tr>
                        <td align="center" style="padding: 30px 20px; background-color: ${branding.primaryColor || '#4a6cf7'};">
                          ${branding.emailHeaderImage ? 
    `<img src="${branding.emailHeaderImage}" alt="${branding.brandName || 'Logo'}" style="max-width: 200px; height: auto;">` :
    branding.logoUrl ? 
      `<img src="${branding.logoUrl}" alt="${branding.brandName || 'Logo'}" style="max-width: 200px; height: auto;">` :
      ''
}
                        </td>
                      </tr>
                    ` : ''}
                    <tr>
                      <td style="padding: 30px 20px; color: ${branding.textColor || '#333333'};">
                        ${htmlContent}
                      </td>
                    </tr>
                    ${branding.emailFooterText || branding.emailSignature ? `
                      <tr>
                        <td style="padding: 20px; background-color: ${branding.backgroundColor || '#f5f5f5'}; border-top: 1px solid #e0e0e0; color: ${branding.textColor || '#666666'}; font-size: 12px; text-align: center;">
                          ${branding.emailFooterText || ''}
                          ${branding.emailSignature ? `<div style="margin-top: 10px;">${branding.emailSignature}</div>` : ''}
                          ${branding.supportEmail ? `<p>Contact: <a href="mailto:${branding.supportEmail}" style="color: ${branding.linkColor || branding.primaryColor || '#4a6cf7'}; text-decoration: none;">${branding.supportEmail}</a></p>` : ''}
                          ${branding.websiteUrl ? `<p><a href="${branding.websiteUrl}" style="color: ${branding.linkColor || branding.primaryColor || '#4a6cf7'}; text-decoration: none;">${branding.websiteUrl}</a></p>` : ''}
                        </td>
                      </tr>
                    ` : ''}
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `;

      return {
        html: brandedHtml,
        subject: subject || '',
      };
    } catch (error) {
      logger.error('Failed to render branded email:', error);
      // Return unmodified on error
      return { html: htmlContent, subject: subject || '' };
    }
  }
}
