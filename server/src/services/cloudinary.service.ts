import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import { logger } from '../utils/logger.js';

// Configure Cloudinary (lazy initialization to allow mocking in tests)
let cloudinaryConfigured = false;
const configureCloudinary = (): void => {
  if (!cloudinaryConfigured && process.env.CLOUDINARY_CLOUD_NAME) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    cloudinaryConfigured = true;
  }
};

export interface UploadResult {
  url: string;
  publicId: string;
  secureUrl: string;
}

/**
 * Upload image buffer to Cloudinary
 */
export const uploadImageToCloudinary = async (
  buffer: Buffer,
  folder: string = 'featured-events',
  options?: {
    width?: number;
    height?: number;
    quality?: number | string; // Cloudinary accepts 'auto' as string or number
    format?: string;
  },
): Promise<UploadResult> => {
  configureCloudinary();
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        transformation: [
          {
            width: options?.width || 1920,
            height: options?.height || 1080,
            crop: 'limit', // Maintain aspect ratio, limit dimensions
            quality: options?.quality || 'auto',
            format: options?.format || 'auto',
          },
        ],
      },
      (error, result) => {
        if (error) {
          logger.error('Cloudinary upload error:', error);
          reject(new Error(`Failed to upload image: ${error.message}`));
          return;
        }

        if (!result) {
          reject(new Error('Upload failed: No result from Cloudinary'));
          return;
        }

        resolve({
          url: result.url,
          publicId: result.public_id,
          secureUrl: result.secure_url,
        });
      },
    );

    // Convert buffer to stream
    const stream = Readable.from(buffer);
    stream.pipe(uploadStream);
  });
};

/**
 * Delete image from Cloudinary
 */
export const deleteImageFromCloudinary = async (publicId: string): Promise<void> => {
  configureCloudinary();
  try {
    await cloudinary.uploader.destroy(publicId);
    logger.info(`Deleted image from Cloudinary: ${publicId}`);
  } catch (error) {
    logger.error(`Failed to delete image from Cloudinary: ${publicId}`, error);
    // Don't throw - deletion failure shouldn't break the flow
  }
};

/**
 * Extract public ID from Cloudinary URL
 */
export const extractPublicIdFromUrl = (url: string): string | null => {
  try {
    // Cloudinary URL format: https://res.cloudinary.com/{cloud_name}/image/upload/{version}/{public_id}.{format}
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
};
