import { prisma } from '../config/database.js';
import { DiscountType, PromoCodeScope } from '@prisma/client';
import { ValidationError, NotFoundError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { Decimal } from '@prisma/client/runtime/library';
import { v4 as uuidv4 } from 'uuid';

export interface PromoCodeValidationResult {
  valid: boolean;
  error?: string;
  discountAmount?: number;
  promoCodeId?: string;
  promoCode?: {
    id: string;
    code: string;
    discountType: DiscountType;
    discountValue: number;
  };
}

export interface DiscountTier {
  minUsage: number;
  maxUsage: number | null;
  discountValue: number;
  discountType: DiscountType;
}

export interface CreatePromoCodeData {
  code: string;
  scope?: PromoCodeScope;
  eventId?: string;
  eventIds?: string[];
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  applicableTicketTypes?: string[];
  usageLimit?: number;
  maxUsesPerUser?: number;
  validFrom: Date | string;
  validUntil: Date | string;
  isActive?: boolean;
  firstTimeOnly?: boolean;
  isStackable?: boolean;
  isReferral?: boolean;
  referrerUserId?: string;
  codePrefix?: string;
  // Marketing fields
  campaignName?: string;
  campaignSource?: string;
  isTiered?: boolean;
  discountTiers?: DiscountTier[];
}

export interface BulkGenerateData {
  count: number;
  prefix: string;
  scope: PromoCodeScope;
  eventId?: string;
  eventIds?: string[];
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  usageLimit?: number;
  maxUsesPerUser?: number;
  validFrom: Date | string;
  validUntil: Date | string;
  firstTimeOnly?: boolean;
  // Marketing fields
  isReferral?: boolean;
  referrerUserId?: string;
  campaignName?: string;
  campaignSource?: string;
  isTiered?: boolean;
  discountTiers?: DiscountTier[];
}

export class PromoCodeService {
  /**
   * Validate a promo code for a specific registration
   */
  static async validatePromoCode(
    code: string,
    eventId: string,
    ticketType: string | null,
    totalAmount: number,
    userId: string,
  ): Promise<PromoCodeValidationResult> {
    // 1. Find promo code
    const promoCode = await prisma.promoCode.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!promoCode) {
      return {
        valid: false,
        error: 'Invalid promo code',
      };
    }

    // 2. Check if active
    if (!promoCode.isActive) {
      return {
        valid: false,
        error: 'This promo code is no longer active',
      };
    }

    // 3. Check validity dates
    const now = new Date();
    if (now < promoCode.validFrom) {
      return {
        valid: false,
        error: `This promo code is not valid yet. It will be available from ${promoCode.validFrom.toLocaleDateString()}`,
      };
    }

    if (now > promoCode.validUntil) {
      return {
        valid: false,
        error: 'This promo code has expired',
      };
    }

    // 4. Check scope-based event applicability
    const scope = promoCode.scope || PromoCodeScope.EVENT;

    switch (scope) {
    case PromoCodeScope.PLATFORM:
      // Platform-wide codes work on any event
      break;

    case PromoCodeScope.ORGANIZER:
      // Check if event belongs to the organizer who created this code
      if (promoCode.organizerId) {
        const event = await prisma.event.findUnique({
          where: { id: eventId },
          select: { organizerId: true },
        });
        if (!event || event.organizerId !== promoCode.organizerId) {
          return {
            valid: false,
            error: 'This promo code is not valid for this event',
          };
        }
      }
      break;

    case PromoCodeScope.MULTI_EVENT:
      // Check if event is in the eventIds array
      if (promoCode.eventIds.length > 0 && !promoCode.eventIds.includes(eventId)) {
        return {
          valid: false,
          error: 'This promo code is not valid for this event',
        };
      }
      break;

    case PromoCodeScope.EVENT:
    default:
      // Single event scope (backward compatible)
      if (promoCode.eventId && promoCode.eventId !== eventId) {
        return {
          valid: false,
          error: 'This promo code is not valid for this event',
        };
      }
      break;
    }

    // 5. Check ticket type applicability
    if (
      promoCode.applicableTicketTypes.length > 0 &&
      ticketType &&
      !promoCode.applicableTicketTypes.includes(ticketType)
    ) {
      return {
        valid: false,
        error: 'This promo code is not valid for the selected ticket type',
      };
    }

    // 6. Check minimum order amount
    if (promoCode.minOrderAmount && totalAmount < Number(promoCode.minOrderAmount)) {
      return {
        valid: false,
        error: `Minimum order amount of $${promoCode.minOrderAmount} required for this promo code`,
      };
    }

    // 7. Check usage limits
    if (promoCode.usageLimit && promoCode.usedCount >= promoCode.usageLimit) {
      return {
        valid: false,
        error: 'This promo code has reached its usage limit',
      };
    }

    // 8. Check user usage limit
    if (promoCode.maxUsesPerUser) {
      const userRedemptions = await prisma.promoCodeRedemption.count({
        where: {
          promoCodeId: promoCode.id,
          userId,
        },
      });

      if (userRedemptions >= promoCode.maxUsesPerUser) {
        return {
          valid: false,
          error: 'You have already used this promo code the maximum number of times',
        };
      }
    }

    // 9. Check first-time user restriction
    if (promoCode.firstTimeOnly) {
      const previousPurchases = await prisma.eventRegistration.count({
        where: {
          attendeeId: userId,
          paymentStatus: 'COMPLETED',
        },
      });

      if (previousPurchases > 0) {
        return {
          valid: false,
          error: 'This promo code is only valid for first-time customers',
        };
      }
    }

    // 10. Calculate discount (with tiered discount support)
    let effectiveDiscountType = promoCode.discountType;
    let effectiveDiscountValue = Number(promoCode.discountValue);

    // Check for tiered discounts
    if (promoCode.isTiered && promoCode.discountTiers) {
      const tiers = promoCode.discountTiers as unknown as DiscountTier[];
      const currentUsage = promoCode.usedCount;

      // Find applicable tier based on current usage
      const applicableTier = tiers.find(tier =>
        currentUsage >= tier.minUsage &&
        (tier.maxUsage === null || currentUsage < tier.maxUsage),
      );

      if (applicableTier) {
        effectiveDiscountValue = applicableTier.discountValue;
        effectiveDiscountType = applicableTier.discountType as DiscountType;
      } else {
        // No applicable tier found - code may be exhausted
        return {
          valid: false,
          error: 'This promo code has reached its maximum usage for all discount tiers',
        };
      }
    }

    let discountAmount = 0;
    if (effectiveDiscountType === DiscountType.PERCENTAGE) {
      discountAmount = (totalAmount * effectiveDiscountValue) / 100;
    } else {
      discountAmount = effectiveDiscountValue;
    }

    // Apply max discount cap if set
    if (promoCode.maxDiscount && discountAmount > Number(promoCode.maxDiscount)) {
      discountAmount = Number(promoCode.maxDiscount);
    }

    // Don't discount below zero
    discountAmount = Math.min(discountAmount, totalAmount);

    return {
      valid: true,
      discountAmount,
      promoCodeId: promoCode.id,
      promoCode: {
        id: promoCode.id,
        code: promoCode.code,
        discountType: effectiveDiscountType,
        discountValue: effectiveDiscountValue,
      },
    };
  }

  /**
   * Apply a promo code to a registration
   */
  static async applyPromoCode(
    promoCodeId: string,
    registrationId: string,
    userId: string,
    originalAmount: number,
    discountAmount: number,
  ) {
    const finalAmount = originalAmount - discountAmount;

    // Create redemption record
    const redemption = await prisma.promoCodeRedemption.create({
      data: {
        promoCodeId,
        registrationId,
        userId,
        discountAmount: new Decimal(discountAmount),
        originalAmount: new Decimal(originalAmount),
        finalAmount: new Decimal(finalAmount),
      },
    });

    // Update promo code used count
    await prisma.promoCode.update({
      where: { id: promoCodeId },
      data: {
        usedCount: {
          increment: 1,
        },
      },
    });

    logger.info(
      `Promo code applied: ${promoCodeId} to registration: ${registrationId}, discount: $${discountAmount}`,
    );

    return redemption;
  }

  /**
   * Create a new promo code (admin-only for now)
   */
  static async createPromoCode(
    creatorId: string,
    data: CreatePromoCodeData,
    isAdmin: boolean = false,
    overrideOrganizerId?: string,
  ) {
    // Check if code already exists
    const existing = await prisma.promoCode.findUnique({
      where: { code: data.code.toUpperCase() },
    });

    if (existing) {
      throw new ValidationError('A promo code with this code already exists');
    }

    // Validate dates
    const validFrom = typeof data.validFrom === 'string' ? new Date(data.validFrom) : data.validFrom;
    const validUntil = typeof data.validUntil === 'string' ? new Date(data.validUntil) : data.validUntil;

    if (validUntil <= validFrom) {
      throw new ValidationError('Valid until date must be after valid from date');
    }

    // Validate discount value
    if (data.discountValue <= 0) {
      throw new ValidationError('Discount value must be greater than 0');
    }

    if (data.discountType === DiscountType.PERCENTAGE && data.discountValue > 100) {
      throw new ValidationError('Percentage discount cannot exceed 100%');
    }

    // Determine scope and validate
    const scope = data.scope || PromoCodeScope.EVENT;

    // Only admins can create PLATFORM scope codes
    if (scope === PromoCodeScope.PLATFORM && !isAdmin) {
      throw new ValidationError('Only administrators can create platform-wide promo codes');
    }

    // Validate scope requirements
    if (scope === PromoCodeScope.EVENT && !data.eventId) {
      throw new ValidationError('Event ID is required for single-event promo codes');
    }

    if (scope === PromoCodeScope.MULTI_EVENT && (!data.eventIds || data.eventIds.length === 0)) {
      throw new ValidationError('At least one event must be selected for multi-event promo codes');
    }

    const promoCode = await prisma.promoCode.create({
      data: {
        code: data.code.toUpperCase(),
        organizerId: isAdmin && scope === PromoCodeScope.PLATFORM ? null : (overrideOrganizerId || creatorId),
        scope,
        eventId: scope === PromoCodeScope.EVENT ? data.eventId : null,
        eventIds: scope === PromoCodeScope.MULTI_EVENT ? data.eventIds : [],
        discountType: data.discountType,
        discountValue: new Decimal(data.discountValue),
        minOrderAmount: data.minOrderAmount ? new Decimal(data.minOrderAmount) : null,
        maxDiscount: data.maxDiscount ? new Decimal(data.maxDiscount) : null,
        applicableTicketTypes: data.applicableTicketTypes || [],
        usageLimit: data.usageLimit || null,
        maxUsesPerUser: data.maxUsesPerUser || 1,
        validFrom,
        validUntil,
        isActive: data.isActive !== false,
        firstTimeOnly: data.firstTimeOnly || false,
        isStackable: data.isStackable || false,
        isReferral: data.isReferral || false,
        referrerUserId: data.referrerUserId || null,
        codePrefix: data.codePrefix || null,
        createdBy: creatorId,
        // Marketing fields
        campaignName: data.campaignName || null,
        campaignSource: data.campaignSource || null,
        isTiered: data.isTiered || false,
        discountTiers: (data.discountTiers as any) || null,
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
          },
        },
        organizer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    logger.info(`Promo code created: ${promoCode.code} by ${isAdmin ? 'admin' : 'organizer'}: ${creatorId}`);

    return promoCode;
  }

  /**
   * Generate random code suffix
   */
  private static generateCodeSuffix(length: number = 6): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Check if a promo code is available (not taken)
   */
  static async checkCodeAvailability(code: string): Promise<boolean> {
    const existing = await prisma.promoCode.findUnique({
      where: { code: code.toUpperCase() },
      select: { id: true },
    });
    return !existing;
  }

  /**
   * Generate a unique promo code
   */
  static async generateUniqueCode(): Promise<string> {
    const prefixes = ['PROMO', 'EVENT', 'DEAL', 'SAVE', 'OFFER'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    let attempts = 0;

    while (attempts < 10) {
      const suffix = this.generateCodeSuffix(6);
      const code = `${prefix}-${suffix}`;
      const available = await this.checkCodeAvailability(code);
      if (available) return code;
      attempts++;
    }

    // Fallback with longer suffix
    const suffix = this.generateCodeSuffix(8);
    return `${prefixes[0]}-${suffix}`;
  }

  /**
   * Bulk generate promo codes (admin-only)
   */
  static async bulkGenerateCodes(
    creatorId: string,
    data: BulkGenerateData,
  ): Promise<{ success: boolean; codes: string[]; count: number; batchId: string }> {
    // Validate count
    if (data.count < 1 || data.count > 1000) {
      throw new ValidationError('Count must be between 1 and 1000');
    }

    // Validate dates
    const validFrom = typeof data.validFrom === 'string' ? new Date(data.validFrom) : data.validFrom;
    const validUntil = typeof data.validUntil === 'string' ? new Date(data.validUntil) : data.validUntil;

    if (validUntil <= validFrom) {
      throw new ValidationError('Valid until date must be after valid from date');
    }

    // Validate discount
    if (data.discountValue <= 0) {
      throw new ValidationError('Discount value must be greater than 0');
    }

    if (data.discountType === DiscountType.PERCENTAGE && data.discountValue > 100) {
      throw new ValidationError('Percentage discount cannot exceed 100%');
    }

    const batchId = uuidv4();
    const prefix = data.prefix.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const codes: string[] = [];
    const createdCodes: string[] = [];

    // Generate unique codes
    let attempts = 0;
    const maxAttempts = data.count * 3;

    while (codes.length < data.count && attempts < maxAttempts) {
      const suffix = this.generateCodeSuffix(6);
      const code = `${prefix}-${suffix}`;

      // Check if code already exists
      const existing = await prisma.promoCode.findUnique({
        where: { code },
      });

      if (!existing && !codes.includes(code)) {
        codes.push(code);
      }

      attempts++;
    }

    if (codes.length < data.count) {
      throw new ValidationError(`Could only generate ${codes.length} unique codes. Try a different prefix.`);
    }

    // Create all codes in a transaction
    await prisma.$transaction(async (tx) => {
      for (const code of codes) {
        await tx.promoCode.create({
          data: {
            code,
            organizerId: null, // Admin-created bulk codes
            scope: data.scope,
            eventId: data.scope === PromoCodeScope.EVENT ? data.eventId : null,
            eventIds: data.scope === PromoCodeScope.MULTI_EVENT ? data.eventIds : [],
            discountType: data.discountType,
            discountValue: new Decimal(data.discountValue),
            minOrderAmount: data.minOrderAmount ? new Decimal(data.minOrderAmount) : null,
            maxDiscount: data.maxDiscount ? new Decimal(data.maxDiscount) : null,
            applicableTicketTypes: [],
            usageLimit: data.usageLimit || 1, // Default to single-use for bulk codes
            maxUsesPerUser: data.maxUsesPerUser || 1,
            validFrom,
            validUntil,
            isActive: true,
            firstTimeOnly: data.firstTimeOnly || false,
            codePrefix: prefix,
            batchId,
            createdBy: creatorId,
            // Marketing fields
            isReferral: data.isReferral || false,
            referrerUserId: data.referrerUserId || null,
            campaignName: data.campaignName || null,
            campaignSource: data.campaignSource || null,
            isTiered: data.isTiered || false,
            discountTiers: (data.discountTiers as any) || null,
          },
        });
        createdCodes.push(code);
      }
    });

    logger.info(`Bulk generated ${createdCodes.length} promo codes with prefix ${prefix}, batch: ${batchId}`);

    return {
      success: true,
      codes: createdCodes,
      count: createdCodes.length,
      batchId,
    };
  }

  /**
   * Get codes by batch ID
   */
  static async getCodesByBatchId(batchId: string) {
    return prisma.promoCode.findMany({
      where: { batchId },
      orderBy: { code: 'asc' },
    });
  }

  /**
   * Get promo codes for an organizer
   */
  static async getPromoCodes(organizerId: string, eventId?: string) {
    const where: { organizerId: string; eventId?: string } = { organizerId };
    if (eventId) {
      where.eventId = eventId;
    }

    const promoCodes = await prisma.promoCode.findMany({
      where,
      include: {
        event: {
          select: {
            id: true,
            title: true,
          },
        },
        _count: {
          select: {
            redemptions: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return promoCodes;
  }

  /**
   * Get all promo codes (admin only)
   */
  static async getAllPromoCodes(options?: {
    scope?: PromoCodeScope;
    eventId?: string;
    isActive?: boolean;
    batchId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = options?.page || 1;
    const limit = options?.limit || 50;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (options?.scope) {
      where.scope = options.scope;
    }

    if (options?.eventId) {
      where.OR = [
        { eventId: options.eventId },
        { eventIds: { has: options.eventId } },
      ];
    }

    if (options?.isActive !== undefined) {
      where.isActive = options.isActive;
    }

    if (options?.batchId) {
      where.batchId = options.batchId;
    }

    if (options?.search) {
      where.code = { contains: options.search.toUpperCase(), mode: 'insensitive' };
    }

    const [promoCodes, total] = await Promise.all([
      prisma.promoCode.findMany({
        where,
        include: {
          event: {
            select: {
              id: true,
              title: true,
            },
          },
          organizer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          _count: {
            select: {
              redemptions: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.promoCode.count({ where }),
    ]);

    return {
      promoCodes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get promo code statistics (admin only)
   */
  static async getPromoCodeStats() {
    const [
      totalCodes,
      activeCodes,
      totalRedemptions,
      platformCodes,
      organizerCodes,
      eventCodes,
      multiEventCodes,
    ] = await Promise.all([
      prisma.promoCode.count(),
      prisma.promoCode.count({ where: { isActive: true } }),
      prisma.promoCodeRedemption.count(),
      prisma.promoCode.count({ where: { scope: PromoCodeScope.PLATFORM } }),
      prisma.promoCode.count({ where: { scope: PromoCodeScope.ORGANIZER } }),
      prisma.promoCode.count({ where: { scope: PromoCodeScope.EVENT } }),
      prisma.promoCode.count({ where: { scope: PromoCodeScope.MULTI_EVENT } }),
    ]);

    // Get total discount amount
    const discountSum = await prisma.promoCodeRedemption.aggregate({
      _sum: {
        discountAmount: true,
      },
    });

    return {
      totalCodes,
      activeCodes,
      inactiveCodes: totalCodes - activeCodes,
      totalRedemptions,
      totalDiscountGiven: Number(discountSum._sum.discountAmount || 0),
      byScope: {
        platform: platformCodes,
        organizer: organizerCodes,
        event: eventCodes,
        multiEvent: multiEventCodes,
      },
    };
  }

  /**
   * Get a single promo code
   */
  static async getPromoCodeById(promoCodeId: string, organizerId: string) {
    const promoCode = await prisma.promoCode.findFirst({
      where: {
        id: promoCodeId,
        organizerId,
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
          },
        },
        organizer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            redemptions: true,
          },
        },
      },
    });

    if (!promoCode) {
      throw new NotFoundError('Promo code not found');
    }

    return promoCode;
  }

  /**
   * Get a single promo code by ID (admin only - no ownership check)
   */
  static async getPromoCodeByIdAdmin(promoCodeId: string) {
    const promoCode = await prisma.promoCode.findUnique({
      where: { id: promoCodeId },
      include: {
        event: {
          select: {
            id: true,
            title: true,
          },
        },
        organizer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            redemptions: true,
          },
        },
        redemptions: {
          take: 10,
          orderBy: { redeemedAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            registration: {
              select: {
                id: true,
                event: {
                  select: {
                    id: true,
                    title: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!promoCode) {
      throw new NotFoundError('Promo code not found');
    }

    return promoCode;
  }

  /**
   * Update a promo code
   */
  static async updatePromoCode(
    promoCodeId: string,
    organizerId: string,
    data: Partial<CreatePromoCodeData>,
  ) {
    // Verify ownership
    const existing = await prisma.promoCode.findFirst({
      where: {
        id: promoCodeId,
        organizerId,
      },
    });

    if (!existing) {
      throw new NotFoundError('Promo code not found');
    }

    // If code is being changed, check uniqueness
    if (data.code && data.code.toUpperCase() !== existing.code) {
      const codeExists = await prisma.promoCode.findUnique({
        where: { code: data.code.toUpperCase() },
      });

      if (codeExists) {
        throw new ValidationError('A promo code with this code already exists');
      }
    }

    const updateData: Record<string, unknown> = {};

    if (data.code) updateData.code = data.code.toUpperCase();
    if (data.eventId !== undefined) updateData.eventId = data.eventId || null;
    if (data.discountType) updateData.discountType = data.discountType;
    if (data.discountValue !== undefined) updateData.discountValue = new Decimal(data.discountValue);
    if (data.minOrderAmount !== undefined) {
      updateData.minOrderAmount = data.minOrderAmount ? new Decimal(data.minOrderAmount) : null;
    }
    if (data.maxDiscount !== undefined) {
      updateData.maxDiscount = data.maxDiscount ? new Decimal(data.maxDiscount) : null;
    }
    if (data.applicableTicketTypes) updateData.applicableTicketTypes = data.applicableTicketTypes;
    if (data.usageLimit !== undefined) updateData.usageLimit = data.usageLimit || null;
    if (data.maxUsesPerUser !== undefined) updateData.maxUsesPerUser = data.maxUsesPerUser;
    if (data.validFrom) {
      updateData.validFrom = typeof data.validFrom === 'string' ? new Date(data.validFrom) : data.validFrom;
    }
    if (data.validUntil) {
      updateData.validUntil = typeof data.validUntil === 'string' ? new Date(data.validUntil) : data.validUntil;
    }
    if ('isActive' in data) updateData.isActive = data.isActive;

    const updated = await prisma.promoCode.update({
      where: { id: promoCodeId },
      data: updateData,
      include: {
        event: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    logger.info(`Promo code updated: ${promoCodeId}`);

    return updated;
  }

  /**
   * Update a promo code (admin only - no ownership check)
   */
  static async updatePromoCodeAdmin(
    promoCodeId: string,
    data: Partial<CreatePromoCodeData>,
  ) {
    const existing = await prisma.promoCode.findUnique({
      where: { id: promoCodeId },
    });

    if (!existing) {
      throw new NotFoundError('Promo code not found');
    }

    // If code is being changed, check uniqueness
    if (data.code && data.code.toUpperCase() !== existing.code) {
      const codeExists = await prisma.promoCode.findUnique({
        where: { code: data.code.toUpperCase() },
      });

      if (codeExists) {
        throw new ValidationError('A promo code with this code already exists');
      }
    }

    const updateData: Record<string, unknown> = {};

    if (data.code) updateData.code = data.code.toUpperCase();
    if (data.scope) updateData.scope = data.scope;
    if (data.eventId !== undefined) updateData.eventId = data.eventId || null;
    if (data.eventIds !== undefined) updateData.eventIds = data.eventIds || [];
    if (data.discountType) updateData.discountType = data.discountType;
    if (data.discountValue !== undefined) updateData.discountValue = new Decimal(data.discountValue);
    if (data.minOrderAmount !== undefined) {
      updateData.minOrderAmount = data.minOrderAmount ? new Decimal(data.minOrderAmount) : null;
    }
    if (data.maxDiscount !== undefined) {
      updateData.maxDiscount = data.maxDiscount ? new Decimal(data.maxDiscount) : null;
    }
    if (data.applicableTicketTypes) updateData.applicableTicketTypes = data.applicableTicketTypes;
    if (data.usageLimit !== undefined) updateData.usageLimit = data.usageLimit || null;
    if (data.maxUsesPerUser !== undefined) updateData.maxUsesPerUser = data.maxUsesPerUser;
    if (data.validFrom) {
      updateData.validFrom = typeof data.validFrom === 'string' ? new Date(data.validFrom) : data.validFrom;
    }
    if (data.validUntil) {
      updateData.validUntil = typeof data.validUntil === 'string' ? new Date(data.validUntil) : data.validUntil;
    }
    if ('isActive' in data) updateData.isActive = data.isActive;
    if ('firstTimeOnly' in data) updateData.firstTimeOnly = data.firstTimeOnly;
    if ('isStackable' in data) updateData.isStackable = data.isStackable;

    const updated = await prisma.promoCode.update({
      where: { id: promoCodeId },
      data: updateData,
      include: {
        event: {
          select: {
            id: true,
            title: true,
          },
        },
        organizer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    logger.info(`Promo code updated by admin: ${promoCodeId}`);

    return updated;
  }

  /**
   * Delete a promo code
   */
  static async deletePromoCode(promoCodeId: string, organizerId: string) {
    // Verify ownership
    const existing = await prisma.promoCode.findFirst({
      where: {
        id: promoCodeId,
        organizerId,
      },
    });

    if (!existing) {
      throw new NotFoundError('Promo code not found');
    }

    await prisma.promoCode.delete({
      where: { id: promoCodeId },
    });

    logger.info(`Promo code deleted: ${promoCodeId}`);

    return { success: true };
  }

  /**
   * Delete a promo code (admin only - no ownership check)
   */
  static async deletePromoCodeAdmin(promoCodeId: string) {
    const existing = await prisma.promoCode.findUnique({
      where: { id: promoCodeId },
    });

    if (!existing) {
      throw new NotFoundError('Promo code not found');
    }

    await prisma.promoCode.delete({
      where: { id: promoCodeId },
    });

    logger.info(`Promo code deleted by admin: ${promoCodeId}`);

    return { success: true };
  }

  /**
   * Delete a batch of promo codes (admin only)
   */
  static async deleteBatch(batchId: string) {
    const result = await prisma.promoCode.deleteMany({
      where: { batchId },
    });

    logger.info(`Deleted ${result.count} promo codes from batch: ${batchId}`);

    return { success: true, deleted: result.count };
  }
}

