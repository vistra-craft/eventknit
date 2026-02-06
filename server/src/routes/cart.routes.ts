/**
 * Cart Routes
 *
 * Public routes for cart reservation system.
 * Supports both authenticated and guest users via session ID.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { CartService } from '../services/cart.service.js';
import { optionalAuth } from '../middleware/auth.middleware.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Type for optional auth request
interface AuthRequest extends Request {
  user?: { id: string };
}

/**
 * Get or create session ID from cookie/header
 */
function getSessionId(req: Request, res: Response): string {
  // Check header first (for API clients)
  let sessionId = req.headers['x-cart-session'] as string;

  // Fall back to cookie
  if (!sessionId) {
    sessionId = req.cookies?.cartSession;
  }

  // Generate new session if none exists
  if (!sessionId) {
    sessionId = uuidv4();
    // Set cookie for 24 hours
    res.cookie('cartSession', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    });
  }

  return sessionId;
}

/**
 * @route   GET /api/v1/cart
 * @desc    Get current cart
 * @access  Public (session-based)
 */
router.get('/', optionalAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const sessionId = getSessionId(req, res);
    const userId = req.user?.id;

    const cart = await CartService.getCart(undefined, sessionId, userId);

    if (!cart) {
      res.json({
        success: true,
        data: {
          cart: null,
          message: 'No active cart',
        },
      });
      return;
    }

    res.json({
      success: true,
      data: { cart },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/v1/cart
 * @desc    Create a new cart
 * @access  Public (session-based)
 */
router.post('/', optionalAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const sessionId = getSessionId(req, res);
    const userId = req.user?.id;

    const cart = await CartService.createCart({
      userId,
      sessionId,
      fingerprint: req.body.fingerprint,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json({
      success: true,
      data: { cart },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/v1/cart/items
 * @desc    Add item to cart
 * @access  Public (session-based)
 */
router.post('/items', optionalAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const sessionId = getSessionId(req, res);
    const userId = req.user?.id;

    // Get or create cart
    let cart = await CartService.getCart(undefined, sessionId, userId);
    if (!cart) {
      cart = await CartService.createCart({
        userId,
        sessionId,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
      });
    }

    const { eventId, ticketType, quantity, unitPrice, seatIds, promoCodeId, discountAmount } =
      req.body;

    if (!eventId || !ticketType || !quantity || unitPrice === undefined) {
      res.status(400).json({
        success: false,
        message: 'eventId, ticketType, quantity, and unitPrice are required',
      });
      return;
    }

    const updatedCart = await CartService.addItem(cart.id, {
      eventId,
      ticketType,
      quantity: parseInt(quantity, 10),
      unitPrice: parseFloat(unitPrice),
      seatIds,
      promoCodeId,
      discountAmount: discountAmount ? parseFloat(discountAmount) : undefined,
    });

    res.json({
      success: true,
      data: { cart: updatedCart },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PATCH /api/v1/cart/items/:itemId
 * @desc    Update item quantity
 * @access  Public (session-based)
 */
router.patch(
  '/items/:itemId',
  optionalAuth,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const sessionId = getSessionId(req, res);
      const userId = req.user?.id;
      const { itemId } = req.params;
      const { quantity } = req.body;

      const cart = await CartService.getCart(undefined, sessionId, userId);
      if (!cart) {
        res.status(404).json({
          success: false,
          message: 'Cart not found',
        });
        return;
      }

      const updatedCart = await CartService.updateItem(
        cart.id,
        itemId,
        parseInt(quantity, 10),
      );

      res.json({
        success: true,
        data: { cart: updatedCart },
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @route   DELETE /api/v1/cart/items/:itemId
 * @desc    Remove item from cart
 * @access  Public (session-based)
 */
router.delete(
  '/items/:itemId',
  optionalAuth,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const sessionId = getSessionId(req, res);
      const userId = req.user?.id;
      const { itemId } = req.params;

      const cart = await CartService.getCart(undefined, sessionId, userId);
      if (!cart) {
        res.status(404).json({
          success: false,
          message: 'Cart not found',
        });
        return;
      }

      const updatedCart = await CartService.removeItem(cart.id, itemId);

      res.json({
        success: true,
        data: { cart: updatedCart },
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @route   POST /api/v1/cart/reserve
 * @desc    Reserve cart for payment (locks inventory)
 * @access  Public (session-based)
 */
router.post('/reserve', optionalAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const sessionId = getSessionId(req, res);
    const userId = req.user?.id;

    const cart = await CartService.getCart(undefined, sessionId, userId);
    if (!cart) {
      res.status(404).json({
        success: false,
        message: 'Cart not found',
      });
      return;
    }

    const reservedCart = await CartService.reserveCart(cart.id);

    res.json({
      success: true,
      data: { cart: reservedCart },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/v1/cart
 * @desc    Abandon cart (releases inventory)
 * @access  Public (session-based)
 */
router.delete('/', optionalAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const sessionId = getSessionId(req, res);
    const userId = req.user?.id;

    const cart = await CartService.getCart(undefined, sessionId, userId);
    if (!cart) {
      res.status(404).json({
        success: false,
        message: 'Cart not found',
      });
      return;
    }

    await CartService.abandonCart(cart.id);

    // Clear cart session cookie
    res.clearCookie('cartSession');

    res.json({
      success: true,
      message: 'Cart abandoned successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/cart/stats
 * @desc    Get cart statistics (admin only)
 * @access  Private (Admin)
 */
router.get('/stats', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await CartService.getCartStats();

    res.json({
      success: true,
      data: { stats },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
