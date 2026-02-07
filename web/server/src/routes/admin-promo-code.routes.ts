import { Router } from 'express';
import { AdminPromoCodeController } from '../controllers/admin-promo-code.controller.js';
import { authenticate, requireMinRole } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { UserRole } from '@prisma/client';
import Joi from 'joi';

const router = Router();

// All routes require authentication and admin role
router.use(authenticate);
router.use(requireMinRole(UserRole.ADMIN_STAFF));

// Validation schemas
const createPromoCodeSchema = Joi.object({
  code: Joi.string().min(3).max(20).required(),
  scope: Joi.string().valid('PLATFORM', 'ORGANIZER', 'EVENT', 'MULTI_EVENT').default('EVENT'),
  eventId: Joi.string().uuid().when('scope', {
    is: 'EVENT',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  eventIds: Joi.array().items(Joi.string().uuid()).when('scope', {
    is: 'MULTI_EVENT',
    then: Joi.array().min(1).required(),
    otherwise: Joi.optional(),
  }),
  discountType: Joi.string().valid('PERCENTAGE', 'FIXED_AMOUNT').required(),
  discountValue: Joi.number().positive().required(),
  minOrderAmount: Joi.number().positive().optional(),
  maxDiscount: Joi.number().positive().optional(),
  applicableTicketTypes: Joi.array().items(Joi.string()).optional(),
  usageLimit: Joi.number().integer().positive().optional(),
  maxUsesPerUser: Joi.number().integer().positive().default(1),
  validFrom: Joi.date().iso().required(),
  validUntil: Joi.date().iso().greater(Joi.ref('validFrom')).required(),
  isActive: Joi.boolean().default(true),
  firstTimeOnly: Joi.boolean().default(false),
  isStackable: Joi.boolean().default(false),
});

const updatePromoCodeSchema = Joi.object({
  code: Joi.string().min(3).max(20).optional(),
  scope: Joi.string().valid('PLATFORM', 'ORGANIZER', 'EVENT', 'MULTI_EVENT').optional(),
  eventId: Joi.string().uuid().allow(null).optional(),
  eventIds: Joi.array().items(Joi.string().uuid()).optional(),
  discountType: Joi.string().valid('PERCENTAGE', 'FIXED_AMOUNT').optional(),
  discountValue: Joi.number().positive().optional(),
  minOrderAmount: Joi.number().positive().allow(null).optional(),
  maxDiscount: Joi.number().positive().allow(null).optional(),
  applicableTicketTypes: Joi.array().items(Joi.string()).optional(),
  usageLimit: Joi.number().integer().positive().allow(null).optional(),
  maxUsesPerUser: Joi.number().integer().positive().optional(),
  validFrom: Joi.date().iso().optional(),
  validUntil: Joi.date().iso().optional(),
  isActive: Joi.boolean().optional(),
  firstTimeOnly: Joi.boolean().optional(),
  isStackable: Joi.boolean().optional(),
}).min(1);

const bulkGenerateSchema = Joi.object({
  count: Joi.number().integer().min(1).max(1000).required(),
  prefix: Joi.string().min(2).max(10).required(),
  scope: Joi.string().valid('PLATFORM', 'ORGANIZER', 'EVENT', 'MULTI_EVENT').default('PLATFORM'),
  eventId: Joi.string().uuid().when('scope', {
    is: 'EVENT',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  eventIds: Joi.array().items(Joi.string().uuid()).when('scope', {
    is: 'MULTI_EVENT',
    then: Joi.array().min(1).required(),
    otherwise: Joi.optional(),
  }),
  discountType: Joi.string().valid('PERCENTAGE', 'FIXED_AMOUNT').required(),
  discountValue: Joi.number().positive().required(),
  minOrderAmount: Joi.number().positive().optional(),
  maxDiscount: Joi.number().positive().optional(),
  usageLimit: Joi.number().integer().positive().default(1),
  maxUsesPerUser: Joi.number().integer().positive().default(1),
  validFrom: Joi.date().iso().required(),
  validUntil: Joi.date().iso().greater(Joi.ref('validFrom')).required(),
  firstTimeOnly: Joi.boolean().default(false),
});

/**
 * @route   GET /api/v1/admin/promo-codes
 * @desc    Get all promo codes with filtering
 * @access  Private (ADMIN_STAFF+)
 */
router.get('/', AdminPromoCodeController.getPromoCodes);

/**
 * @route   GET /api/v1/admin/promo-codes/stats
 * @desc    Get promo code statistics
 * @access  Private (ADMIN_STAFF+)
 */
router.get('/stats', AdminPromoCodeController.getStats);

/**
 * @route   GET /api/v1/admin/promo-codes/batch/:batchId
 * @desc    Get codes by batch ID
 * @access  Private (ADMIN_STAFF+)
 */
router.get('/batch/:batchId', AdminPromoCodeController.getCodesByBatch);

/**
 * @route   DELETE /api/v1/admin/promo-codes/batch/:batchId
 * @desc    Delete a batch of promo codes
 * @access  Private (ADMIN_STAFF+)
 */
router.delete('/batch/:batchId', AdminPromoCodeController.deleteBatch);

/**
 * @route   GET /api/v1/admin/promo-codes/:id
 * @desc    Get a single promo code by ID
 * @access  Private (ADMIN_STAFF+)
 */
router.get('/:id', AdminPromoCodeController.getPromoCodeById);

/**
 * @route   POST /api/v1/admin/promo-codes
 * @desc    Create a new promo code
 * @access  Private (ADMIN_STAFF+)
 */
router.post('/', validate(createPromoCodeSchema), AdminPromoCodeController.createPromoCode);

/**
 * @route   POST /api/v1/admin/promo-codes/bulk-generate
 * @desc    Bulk generate promo codes
 * @access  Private (ADMIN_STAFF+)
 */
router.post('/bulk-generate', validate(bulkGenerateSchema), AdminPromoCodeController.bulkGenerate);

/**
 * @route   PUT /api/v1/admin/promo-codes/:id
 * @desc    Update a promo code
 * @access  Private (ADMIN_STAFF+)
 */
router.put('/:id', validate(updatePromoCodeSchema), AdminPromoCodeController.updatePromoCode);

/**
 * @route   PATCH /api/v1/admin/promo-codes/:id/toggle
 * @desc    Toggle promo code active status
 * @access  Private (ADMIN_STAFF+)
 */
router.patch('/:id/toggle', AdminPromoCodeController.toggleActive);

/**
 * @route   DELETE /api/v1/admin/promo-codes/:id
 * @desc    Delete a promo code
 * @access  Private (ADMIN_STAFF+)
 */
router.delete('/:id', AdminPromoCodeController.deletePromoCode);

export default router;
