import { Request, Response, NextFunction } from 'express';
import { FeaturedEventService } from '../services/featured-event.service.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { uploadImageToCloudinary, extractPublicIdFromUrl, deleteImageFromCloudinary } from '../services/cloudinary.service.js';

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
        res.status(500).json({
          success: false,
          message: 'Failed to upload image',
          error: uploadError instanceof Error ? uploadError.message : 'Unknown error',
        });
        return;
      }
    }

    // Parse and convert form data types
    const data = {
      ...req.body,
      // Use uploaded image URL if file was uploaded
      imageUrl: imageUrl || req.body.imageUrl,
      customImage: imageUrl || req.body.customImage,
      displayStartDate: req.body.displayStartDate ? new Date(req.body.displayStartDate) : undefined,
      displayEndDate: req.body.displayEndDate ? new Date(req.body.displayEndDate) : undefined,
      // Convert string to number for displayOrder
      displayOrder: req.body.displayOrder ? parseInt(req.body.displayOrder, 10) : undefined,
      // Convert string to boolean for isActive
      isActive: req.body.isActive !== undefined ? req.body.isActive === 'true' || req.body.isActive === true : undefined,
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
        res.status(500).json({
          success: false,
          message: 'Failed to upload image',
          error: uploadError instanceof Error ? uploadError.message : 'Unknown error',
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


