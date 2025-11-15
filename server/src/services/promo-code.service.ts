import { prisma } from '../config/database.js';
import { DiscountType } from '@prisma/client';
import { ValidationError, NotFoundError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { Decimal } from '@prisma/client/runtime/library';

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

export interface CreatePromoCodeData {
  code: string;
  eventId?: string;
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

    // 4. Check event applicability
    if (promoCode.eventId && promoCode.eventId !== eventId) {
      return {
        valid: false,
        error: 'This promo code is not valid for this event',
      };
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

    // 9. Calculate discount
    let discountAmount = 0;
    if (promoCode.discountType === DiscountType.PERCENTAGE) {
      discountAmount = (totalAmount * Number(promoCode.discountValue)) / 100;
    } else {
      discountAmount = Number(promoCode.discountValue);
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
        discountType: promoCode.discountType,
        discountValue: Number(promoCode.discountValue),
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
   * Create a new promo code
   */
  static async createPromoCode(
    organizerId: string,
    data: CreatePromoCodeData,
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

    const promoCode = await prisma.promoCode.create({
      data: {
        code: data.code.toUpperCase(),
        organizerId,
        eventId: data.eventId || null,
        discountType: data.discountType,
        discountValue: new Decimal(data.discountValue),
        minOrderAmount: data.minOrderAmount ? new Decimal(data.minOrderAmount) : null,
        maxDiscount: data.maxDiscount ? new Decimal(data.maxDiscount) : null,
        applicableTicketTypes: data.applicableTicketTypes || [],
        usageLimit: data.usageLimit || null,
        maxUsesPerUser: data.maxUsesPerUser || 1,
        validFrom,
        validUntil,
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

    logger.info(`Promo code created: ${promoCode.code} by organizer: ${organizerId}`);

    return promoCode;
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
}

