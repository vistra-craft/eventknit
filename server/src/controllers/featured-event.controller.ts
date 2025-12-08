import { Request, Response, NextFunction } from 'express';
import { FeaturedEventService } from '../services/featured-event.service.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { uploadImageToCloudinary, extractPublicIdFromUrl, deleteImageFromCloudinary } from '../services/cloudinary.service.js';
import { logger } from '../utils/logger.js';

export class FeaturedEventController {
  /**
   * Create a new featured event
   */
  static async createFeaturedEvent(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.get('user-agent');

      // Handle file upload if present
      let imageUrl: string | undefined;
      if (req.file) {
        try {
          const uploadOptions: {
            width: number;
            height: number;
            quality: string;
            format: string;
          } = {
            width: 1920,
            height: 1080,
            quality: 'auto',
            format: 'auto',
          };
          const uploadResult = await uploadImageToCloudinary(
            req.file.buffer,
            'featured-events',
            uploadOptions,
          );
          imageUrl = uploadResult.secureUrl;
        } catch (uploadError) {
          // Check if Cloudinary is not configured
          const errorMessage = uploadError instanceof Error ? uploadError.message : 'Unknown error';
          if (errorMessage.includes('not configured') || errorMessage.includes('CLOUDINARY')) {
            res.status(400).json({
              success: false,
              message: 'Cloudinary is not configured. Please either configure Cloudinary credentials or provide a direct image URL via the imageUrl field instead of uploading a file.',
              error: errorMessage,
            });
            return;
          }
          res.status(500).json({
            success: false,
            message: 'Failed to upload image',
            error: errorMessage,
          });
          return;
        }
      }

      // Parse and convert form data types
      let displayStartDate: Date | undefined;
      let displayEndDate: Date | undefined;
      if (req.body.displayStartDate) {
        const startDate = new Date(req.body.displayStartDate);
        if (isNaN(startDate.getTime())) {
          res.status(400).json({
            success: false,
            message: 'Invalid displayStartDate format',
          });
          return;
        }
        displayStartDate = startDate;
      }
      
      if (req.body.displayEndDate) {
        const endDate = new Date(req.body.displayEndDate);
        if (isNaN(endDate.getTime())) {
          res.status(400).json({
            success: false,
            message: 'Invalid displayEndDate format',
          });
          return;
        }
        displayEndDate = endDate;
      }

      let displayOrder: number | undefined;
      if (req.body.displayOrder !== undefined && req.body.displayOrder !== null && req.body.displayOrder !== '') {
        const parsed = parseInt(String(req.body.displayOrder), 10);
        if (isNaN(parsed)) {
          res.status(400).json({
            success: false,
            message: 'Invalid displayOrder format. Must be a number.',
          });
          return;
        }
        displayOrder = parsed;
      }

      const data = {
        ...req.body,
        // Use uploaded image URL if file was uploaded
        imageUrl: imageUrl || req.body.imageUrl,
        customImage: imageUrl || req.body.customImage,
        displayStartDate,
        displayEndDate,
        displayOrder,
        // Convert string to boolean for isActive
        isActive: req.body.isActive !== undefined ? req.body.isActive === 'true' || req.body.isActive === true : undefined,
        // Ensure type is properly set (EVENT or IMAGE)
        type: req.body.type || 'EVENT',
      };

      const featuredEvent = await FeaturedEventService.createFeaturedEvent(
        data,
        req.user.id,
        req.user.role,
        ipAddress,
        userAgent,
      );

      res.status(201).json({
        success: true,
        message: 'Featured event created successfully',
        data: { featuredEvent },
      });
    } catch (error) {
      // Log the error for debugging
      logger.error('Error creating featured event:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        body: req.body,
      });
      next(error);
    }
  }

  /**
   * Get active featured events (public)
   */
  static async getActiveFeaturedEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const featuredEvents = await FeaturedEventService.getActiveFeaturedEvents();

      res.status(200).json({
        success: true,
        data: { featuredEvents },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all featured events (admin)
   */
  static async getAllFeaturedEvents(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const featuredEvents = await FeaturedEventService.getAllFeaturedEvents();

      res.status(200).json({
        success: true,
        data: { featuredEvents },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get featured event by ID
   */
  static async getFeaturedEventById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const featuredEvent = await FeaturedEventService.getFeaturedEventById(req.params.id);

      res.status(200).json({
        success: true,
        data: { featuredEvent },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update featured event
   */
  static async updateFeaturedEvent(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.get('user-agent');

      // Get existing featured event to check for old image
      const existingEvent = await FeaturedEventService.getFeaturedEventById(req.params.id);
      let oldImageUrl: string | null = null;

      // Handle file upload if present
      let imageUrl: string | undefined;
      if (req.file) {
        try {
          const uploadOptions: {
            width: number;
            height: number;
            quality: string;
            format: string;
          } = {
            width: 1920,
            height: 1080,
            quality: 'auto',
            format: 'auto',
          };
          const uploadResult = await uploadImageToCloudinary(
            req.file.buffer,
            'featured-events',
            uploadOptions,
          );
          imageUrl = uploadResult.secureUrl;

          // Mark old image for deletion if it exists and is from Cloudinary
          if (existingEvent.imageUrl || existingEvent.customImage) {
            oldImageUrl = existingEvent.imageUrl || existingEvent.customImage || null;
          }
        } catch (uploadError) {
          // Check if Cloudinary is not configured
          const errorMessage = uploadError instanceof Error ? uploadError.message : 'Unknown error';
          if (errorMessage.includes('not configured') || errorMessage.includes('CLOUDINARY')) {
            res.status(400).json({
              success: false,
              message: 'Cloudinary is not configured. Please either configure Cloudinary credentials or provide a direct image URL via the imageUrl field instead of uploading a file.',
              error: errorMessage,
            });
            return;
          }
          res.status(500).json({
            success: false,
            message: 'Failed to upload image',
            error: errorMessage,
          });
          return;
        }
      }

      // Parse and convert form data types
      const data = {
        ...req.body,
        // Use uploaded image URL if file was uploaded, otherwise use provided imageUrl
        imageUrl: imageUrl || req.body.imageUrl,
        customImage: imageUrl || req.body.customImage,
        displayStartDate: req.body.displayStartDate ? new Date(req.body.displayStartDate) : undefined,
        displayEndDate: req.body.displayEndDate ? new Date(req.body.displayEndDate) : undefined,
        // Convert string to number for displayOrder
        displayOrder: req.body.displayOrder ? parseInt(req.body.displayOrder, 10) : undefined,
        // Convert string to boolean for isActive
        isActive: req.body.isActive !== undefined ? req.body.isActive === 'true' || req.body.isActive === true : undefined,
      };

      const featuredEvent = await FeaturedEventService.updateFeaturedEvent(
        req.params.id,
        data,
        req.user.id,
        req.user.role,
        ipAddress,
        userAgent,
      );

      // Delete old image from Cloudinary if it was replaced
      if (oldImageUrl && imageUrl) {
        const publicId = extractPublicIdFromUrl(oldImageUrl);
        if (publicId) {
          await deleteImageFromCloudinary(publicId);
        }
      }

      res.status(200).json({
        success: true,
        message: 'Featured event updated successfully',
        data: { featuredEvent },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete featured event
   */
  static async deleteFeaturedEvent(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.get('user-agent');

      await FeaturedEventService.deleteFeaturedEvent(
        req.params.id,
        req.user.id,
        req.user.role,
        ipAddress,
        userAgent,
      );

      res.status(200).json({
        success: true,
        message: 'Featured event deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}


