/**
 * Cart Reservation Service
 *
 * Handles temporary cart reservations with automatic expiry.
 * Tickets are held in cart for a configurable timeout (default 8 minutes)
 * before being released back to inventory.
 */

import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { CartStatus, Prisma } from '@prisma/client';

// Cart timeout in minutes (configurable via env)
const CART_TIMEOUT_MINUTES = parseInt(process.env.CART_TIMEOUT_MINUTES || '8', 10);

export interface CreateCartData {
  userId?: string;
  sessionId: string;
  fingerprint?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface AddCartItemData {
  eventId: string;
  ticketType: string;
  quantity: number;
  unitPrice: number;
  seatIds?: string[];
  promoCodeId?: string;
  discountAmount?: number;
}

export interface CartWithItems {
  id: string;
  userId: string | null;
  sessionId: string;
  status: CartStatus;
  expiresAt: Date;
  items: Array<{
    id: string;
    eventId: string;
    ticketType: string;
    quantity: number;
    unitPrice: number;
    seatIds: string[];
    promoCodeId: string | null;
    discountAmount: number | null;
    event: {
      id: string;
      title: string;
      startDate: Date;
      image: string | null;
    };
  }>;
  totalAmount: number;
  totalItems: number;
  remainingSeconds: number;
}

export class CartService {
  /**
   * Create a new cart reservation
   */
  static async createCart(data: CreateCartData): Promise<CartWithItems> {
    try {
      // Check if user/session already has an active cart
      const existingCart = await prisma.cartReservation.findFirst({
        where: {
          OR: [
            { sessionId: data.sessionId },
            ...(data.userId ? [{ userId: data.userId }] : []),
          ],
          status: { in: [CartStatus.ACTIVE, CartStatus.RESERVED] },
          expiresAt: { gt: new Date() },
        },
        include: {
          items: {
            include: {
              event: {
                select: {
                  id: true,
                  title: true,
                  startDate: true,
                  image: true,
                },
              },
            },
          },
        },
      });

      if (existingCart) {
        // Return existing cart with extended expiry
        const newExpiresAt = new Date(Date.now() + CART_TIMEOUT_MINUTES * 60 * 1000);
        await prisma.cartReservation.update({
          where: { id: existingCart.id },
          data: { expiresAt: newExpiresAt },
        });

        return this.formatCartResponse({
          ...existingCart,
          expiresAt: newExpiresAt,
        });
      }

      // Create new cart
      const expiresAt = new Date(Date.now() + CART_TIMEOUT_MINUTES * 60 * 1000);

      const cart = await prisma.cartReservation.create({
        data: {
          userId: data.userId,
          sessionId: data.sessionId,
          fingerprint: data.fingerprint,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          status: CartStatus.ACTIVE,
          expiresAt,
        },
        include: {
          items: {
            include: {
              event: {
                select: {
                  id: true,
                  title: true,
                  startDate: true,
                  image: true,
                },
              },
            },
          },
        },
      });

      logger.info(`Cart created: ${cart.id} for session ${data.sessionId}`);
      return this.formatCartResponse(cart);
    } catch (error) {
      logger.error('Error creating cart:', error);
      throw error;
    }
  }

  /**
   * Get cart by ID or session
   */
  static async getCart(
    cartId?: string,
    sessionId?: string,
    userId?: string,
  ): Promise<CartWithItems | null> {
    try {
      const cart = await prisma.cartReservation.findFirst({
        where: {
          OR: [
            ...(cartId ? [{ id: cartId }] : []),
            ...(sessionId ? [{ sessionId }] : []),
            ...(userId ? [{ userId }] : []),
          ],
          status: { in: [CartStatus.ACTIVE, CartStatus.RESERVED] },
          expiresAt: { gt: new Date() },
        },
        include: {
          items: {
            include: {
              event: {
                select: {
                  id: true,
                  title: true,
                  startDate: true,
                  image: true,
                },
              },
            },
          },
        },
      });

      if (!cart) {
        return null;
      }

      return this.formatCartResponse(cart);
    } catch (error) {
      logger.error('Error getting cart:', error);
      throw error;
    }
  }

  /**
   * Add item to cart
   */
  static async addItem(cartId: string, data: AddCartItemData): Promise<CartWithItems> {
    try {
      const cart = await prisma.cartReservation.findUnique({
        where: { id: cartId },
        include: { items: true },
      });

      if (!cart) {
        throw new NotFoundError('Cart not found');
      }

      if (cart.status !== CartStatus.ACTIVE) {
        throw new ValidationError('Cart is not active');
      }

      if (cart.expiresAt < new Date()) {
        throw new ValidationError('Cart has expired');
      }

      // Check event availability
      const event = await prisma.event.findUnique({
        where: { id: data.eventId },
        select: {
          id: true,
          title: true,
          startDate: true,
          image: true,
          capacity: true,
          availableSlots: true,
          maxTicketsPerUser: true,
        },
      });

      if (!event) {
        throw new NotFoundError('Event not found');
      }

      // Check capacity
      if (event.capacity !== null && event.availableSlots !== null) {
        const currentCartQuantity = cart.items
          .filter((i) => i.eventId === data.eventId)
          .reduce((sum, i) => sum + i.quantity, 0);

        if (currentCartQuantity + data.quantity > event.availableSlots) {
          throw new ValidationError(
            `Not enough tickets available. Only ${event.availableSlots - currentCartQuantity} remaining.`,
          );
        }
      }

      // Check max tickets per user
      if (data.quantity > event.maxTicketsPerUser) {
        throw new ValidationError(
          `Maximum ${event.maxTicketsPerUser} tickets allowed per purchase`,
        );
      }

      // Check for existing item with same event and ticket type
      const existingItem = cart.items.find(
        (i) => i.eventId === data.eventId && i.ticketType === data.ticketType,
      );

      if (existingItem) {
        // Update quantity
        const newQuantity = existingItem.quantity + data.quantity;
        if (newQuantity > event.maxTicketsPerUser) {
          throw new ValidationError(
            `Maximum ${event.maxTicketsPerUser} tickets allowed per purchase`,
          );
        }

        await prisma.cartItem.update({
          where: { id: existingItem.id },
          data: {
            quantity: newQuantity,
            seatIds: data.seatIds
              ? [...existingItem.seatIds, ...data.seatIds]
              : existingItem.seatIds,
          },
        });
      } else {
        // Create new item
        await prisma.cartItem.create({
          data: {
            cartId,
            eventId: data.eventId,
            ticketType: data.ticketType,
            quantity: data.quantity,
            unitPrice: data.unitPrice,
            seatIds: data.seatIds || [],
            promoCodeId: data.promoCodeId,
            discountAmount: data.discountAmount,
          },
        });
      }

      // Extend cart expiry
      const newExpiresAt = new Date(Date.now() + CART_TIMEOUT_MINUTES * 60 * 1000);
      const updatedCart = await prisma.cartReservation.update({
        where: { id: cartId },
        data: { expiresAt: newExpiresAt },
        include: {
          items: {
            include: {
              event: {
                select: {
                  id: true,
                  title: true,
                  startDate: true,
                  image: true,
                },
              },
            },
          },
        },
      });

      logger.info(`Item added to cart ${cartId}: ${data.ticketType} x${data.quantity}`);
      return this.formatCartResponse(updatedCart);
    } catch (error) {
      logger.error('Error adding item to cart:', error);
      throw error;
    }
  }

  /**
   * Update item quantity in cart
   */
  static async updateItem(
    cartId: string,
    itemId: string,
    quantity: number,
  ): Promise<CartWithItems> {
    try {
      const cart = await prisma.cartReservation.findUnique({
        where: { id: cartId },
        include: { items: true },
      });

      if (!cart) {
        throw new NotFoundError('Cart not found');
      }

      if (cart.status !== CartStatus.ACTIVE) {
        throw new ValidationError('Cart is not active');
      }

      const item = cart.items.find((i) => i.id === itemId);
      if (!item) {
        throw new NotFoundError('Cart item not found');
      }

      if (quantity <= 0) {
        // Remove item
        await prisma.cartItem.delete({ where: { id: itemId } });
      } else {
        // Update quantity
        const event = await prisma.event.findUnique({
          where: { id: item.eventId },
          select: { maxTicketsPerUser: true },
        });

        if (event && quantity > event.maxTicketsPerUser) {
          throw new ValidationError(
            `Maximum ${event.maxTicketsPerUser} tickets allowed per purchase`,
          );
        }

        await prisma.cartItem.update({
          where: { id: itemId },
          data: { quantity },
        });
      }

      // Extend cart expiry
      const newExpiresAt = new Date(Date.now() + CART_TIMEOUT_MINUTES * 60 * 1000);
      const updatedCart = await prisma.cartReservation.update({
        where: { id: cartId },
        data: { expiresAt: newExpiresAt },
        include: {
          items: {
            include: {
              event: {
                select: {
                  id: true,
                  title: true,
                  startDate: true,
                  image: true,
                },
              },
            },
          },
        },
      });

      return this.formatCartResponse(updatedCart);
    } catch (error) {
      logger.error('Error updating cart item:', error);
      throw error;
    }
  }

  /**
   * Remove item from cart
   */
  static async removeItem(cartId: string, itemId: string): Promise<CartWithItems> {
    return this.updateItem(cartId, itemId, 0);
  }

  /**
   * Reserve cart for payment (lock inventory)
   */
  static async reserveCart(cartId: string): Promise<CartWithItems> {
    try {
      return await prisma.$transaction(async (tx) => {
        const cart = await tx.cartReservation.findUnique({
          where: { id: cartId },
          include: { items: true },
        });

        if (!cart) {
          throw new NotFoundError('Cart not found');
        }

        if (cart.status !== CartStatus.ACTIVE) {
          throw new ValidationError('Cart is not active');
        }

        if (cart.expiresAt < new Date()) {
          throw new ValidationError('Cart has expired');
        }

        if (cart.items.length === 0) {
          throw new ValidationError('Cart is empty');
        }

        // Lock inventory for each item
        for (const item of cart.items) {
          if (!item.inventoryLocked) {
            const event = await tx.event.findUnique({
              where: { id: item.eventId },
              select: { capacity: true, availableSlots: true },
            });

            if (event && event.capacity !== null) {
              const currentSlots = event.availableSlots ?? event.capacity;
              if (currentSlots < item.quantity) {
                throw new ValidationError(
                  'Not enough tickets available for this item',
                );
              }

              // Decrement available slots
              await tx.event.update({
                where: { id: item.eventId },
                data: {
                  availableSlots: currentSlots - item.quantity,
                },
              });

              // Mark item as locked
              await tx.cartItem.update({
                where: { id: item.id },
                data: { inventoryLocked: true },
              });
            }
          }
        }

        // Update cart status
        const newExpiresAt = new Date(Date.now() + CART_TIMEOUT_MINUTES * 60 * 1000);
        const updatedCart = await tx.cartReservation.update({
          where: { id: cartId },
          data: {
            status: CartStatus.RESERVED,
            reservedAt: new Date(),
            expiresAt: newExpiresAt,
          },
          include: {
            items: {
              include: {
                event: {
                  select: {
                    id: true,
                    title: true,
                    startDate: true,
                    image: true,
                  },
                },
              },
            },
          },
        });

        logger.info(`Cart ${cartId} reserved for payment`);
        return this.formatCartResponse(updatedCart);
      }, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (error) {
      logger.error('Error reserving cart:', error);
      throw error;
    }
  }

  /**
   * Complete cart (convert to registration)
   */
  static async completeCart(cartId: string, registrationId: string): Promise<void> {
    try {
      await prisma.cartReservation.update({
        where: { id: cartId },
        data: {
          status: CartStatus.COMPLETED,
          completedAt: new Date(),
        },
      });

      logger.info(`Cart ${cartId} completed, registration: ${registrationId}`);
    } catch (error) {
      logger.error('Error completing cart:', error);
      throw error;
    }
  }

  /**
   * Release expired carts and restore inventory
   */
  static async releaseExpiredCarts(): Promise<{ released: number; inventoryRestored: number }> {
    try {
      const expiredCarts = await prisma.cartReservation.findMany({
        where: {
          status: { in: [CartStatus.ACTIVE, CartStatus.RESERVED] },
          expiresAt: { lt: new Date() },
        },
        include: {
          items: {
            where: { inventoryLocked: true },
          },
        },
      });

      if (expiredCarts.length === 0) {
        return { released: 0, inventoryRestored: 0 };
      }

      let inventoryRestored = 0;

      for (const cart of expiredCarts) {
        await prisma.$transaction(async (tx) => {
          // Restore inventory for locked items
          for (const item of cart.items) {
            if (item.inventoryLocked) {
              await tx.event.update({
                where: { id: item.eventId },
                data: {
                  availableSlots: {
                    increment: item.quantity,
                  },
                },
              });
              inventoryRestored++;
            }
          }

          // Mark cart as expired
          await tx.cartReservation.update({
            where: { id: cart.id },
            data: { status: CartStatus.EXPIRED },
          });
        });
      }

      logger.info(
        `Released ${expiredCarts.length} expired carts, restored ${inventoryRestored} inventory items`,
      );

      return { released: expiredCarts.length, inventoryRestored };
    } catch (error) {
      logger.error('Error releasing expired carts:', error);
      throw error;
    }
  }

  /**
   * Abandon cart (user-initiated)
   */
  static async abandonCart(cartId: string): Promise<void> {
    try {
      const cart = await prisma.cartReservation.findUnique({
        where: { id: cartId },
        include: {
          items: {
            where: { inventoryLocked: true },
          },
        },
      });

      if (!cart) {
        throw new NotFoundError('Cart not found');
      }

      await prisma.$transaction(async (tx) => {
        // Restore inventory for locked items
        for (const item of cart.items) {
          if (item.inventoryLocked) {
            await tx.event.update({
              where: { id: item.eventId },
              data: {
                availableSlots: {
                  increment: item.quantity,
                },
              },
            });
          }
        }

        // Mark cart as abandoned
        await tx.cartReservation.update({
          where: { id: cart.id },
          data: { status: CartStatus.ABANDONED },
        });
      });

      logger.info(`Cart ${cartId} abandoned by user`);
    } catch (error) {
      logger.error('Error abandoning cart:', error);
      throw error;
    }
  }

  /**
   * Get cart statistics (for monitoring)
   */
  static async getCartStats(): Promise<{
    activeCarts: number;
    reservedCarts: number;
    expiringInMinutes: number;
    totalItemsInCarts: number;
  }> {
    try {
      const now = new Date();
      const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

      const [activeCarts, reservedCarts, expiringCarts, totalItems] = await Promise.all([
        prisma.cartReservation.count({
          where: {
            status: CartStatus.ACTIVE,
            expiresAt: { gt: now },
          },
        }),
        prisma.cartReservation.count({
          where: {
            status: CartStatus.RESERVED,
            expiresAt: { gt: now },
          },
        }),
        prisma.cartReservation.count({
          where: {
            status: { in: [CartStatus.ACTIVE, CartStatus.RESERVED] },
            expiresAt: {
              gt: now,
              lt: fiveMinutesFromNow,
            },
          },
        }),
        prisma.cartItem.count({
          where: {
            cart: {
              status: { in: [CartStatus.ACTIVE, CartStatus.RESERVED] },
              expiresAt: { gt: now },
            },
          },
        }),
      ]);

      return {
        activeCarts,
        reservedCarts,
        expiringInMinutes: expiringCarts,
        totalItemsInCarts: totalItems,
      };
    } catch (error) {
      logger.error('Error getting cart stats:', error);
      throw error;
    }
  }

  /**
   * Format cart response with calculated fields
   */
  private static formatCartResponse(cart: any): CartWithItems {
    const items = cart.items.map((item: any) => ({
      id: item.id,
      eventId: item.eventId,
      ticketType: item.ticketType,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      seatIds: item.seatIds,
      promoCodeId: item.promoCodeId,
      discountAmount: item.discountAmount ? Number(item.discountAmount) : null,
      event: item.event,
    }));

    const totalAmount = items.reduce((sum: number, item: any) => {
      const itemTotal = item.unitPrice * item.quantity;
      const discount = item.discountAmount || 0;
      return sum + itemTotal - discount;
    }, 0);

    const totalItems = items.reduce((sum: number, item: any) => sum + item.quantity, 0);
    const remainingSeconds = Math.max(
      0,
      Math.floor((cart.expiresAt.getTime() - Date.now()) / 1000),
    );

    return {
      id: cart.id,
      userId: cart.userId,
      sessionId: cart.sessionId,
      status: cart.status,
      expiresAt: cart.expiresAt,
      items,
      totalAmount: Math.round(totalAmount * 100) / 100,
      totalItems,
      remainingSeconds,
    };
  }
}
