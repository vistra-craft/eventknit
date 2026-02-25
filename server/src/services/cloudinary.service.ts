import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import { logger } from '../utils/logger.js';

const UPLOAD_TIMEOUT_MS = 60_000; // 60 s per attempt
const MAX_RETRIES = 2;            // 3 total attempts (initial + 2 retries)
const RETRY_DELAY_MS = 2_000;

const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

const isRetryableError = (error: unknown): boolean => {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return (
    msg.includes('timeout') ||
    msg.includes('econnreset') ||
    msg.includes('enotfound') ||
    msg.includes('network') ||
    msg.includes('socket')
  );
};

// Configure Cloudinary (lazy initialization to allow mocking in tests)
let cloudinaryConfigured = false;
const configureCloudinary = (): void => {
  if (cloudinaryConfigured) {
    return; // Already configured
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  // Check if Cloudinary is configured (all three required)
  if (!cloudName || !apiKey || !apiSecret) {
    // Don't log warnings - Cloudinary is optional
    return; // Don't configure if credentials are missing
  }

  try {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });
    cloudinaryConfigured = true;
    // Optionally log success (commented out to reduce noise)
    // logger.info('Cloudinary configured successfully');
  } catch (error) {
    logger.error('Failed to configure Cloudinary:', error);
    throw new Error('Failed to configure Cloudinary. Please check your environment variables.');
  }
};

export interface UploadResult {
  url: string;
  publicId: string;
  secureUrl: string;
}

// Single upload attempt — used by the retry wrapper below
const attemptImageUpload = (
  buffer: Buffer,
  folder: string,
  options?: {
    width?: number;
    height?: number;
    quality?: number | string;
    format?: string;
  },
): Promise<UploadResult> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        timeout: UPLOAD_TIMEOUT_MS,
        transformation: [
          {
            width: options?.width || 1920,
            height: options?.height || 1080,
            crop: 'limit',
            quality: options?.quality || 'auto',
            format: options?.format || 'auto',
          },
        ],
      },
      (error, result) => {
        if (error) {
          reject(new Error(error.message));
          return;
        }
        if (!result) {
          reject(new Error('No result from Cloudinary'));
          return;
        }
        resolve({
          url: result.url,
          publicId: result.public_id,
          secureUrl: result.secure_url,
        });
      },
    );

    const stream = Readable.from(buffer);
    stream.pipe(uploadStream);
  });
};

/**
 * Upload image buffer to Cloudinary with automatic retry on transient network errors.
 */
export const uploadImageToCloudinary = async (
  buffer: Buffer,
  folder: string = 'featured-events',
  options?: {
    width?: number;
    height?: number;
    quality?: number | string;
    format?: string;
  },
): Promise<UploadResult> => {
  configureCloudinary();

  if (!cloudinaryConfigured) {
    throw new Error(
      'Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.',
    );
  }

  let lastError: Error = new Error('Upload failed');

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        logger.warn(`Retrying Cloudinary upload (attempt ${attempt + 1}/${MAX_RETRIES + 1})...`);
        await delay(RETRY_DELAY_MS * attempt);
      }
      return await attemptImageUpload(buffer, folder, options);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      logger.error(`Cloudinary upload error (attempt ${attempt + 1}/${MAX_RETRIES + 1}):`, lastError.message);
      if (!isRetryableError(lastError) || attempt === MAX_RETRIES) break;
    }
  }

  throw new Error(`Failed to upload image: ${lastError.message}`);
};

/**
 * Delete image from Cloudinary
 */
export const deleteImageFromCloudinary = async (publicId: string): Promise<void> => {
  configureCloudinary();
  
  // If Cloudinary is not configured, silently skip deletion
  if (!cloudinaryConfigured) {
    logger.debug(`Cloudinary not configured, skipping deletion of: ${publicId}`);
    return;
  }

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

/**
 * Upload raw buffer to Cloudinary (for PDFs and other non-image files)
 */
export const uploadBuffer = async (
  buffer: Buffer,
  options: {
    folder?: string;
    public_id?: string;
    resource_type?: 'raw' | 'image' | 'video' | 'auto';
    format?: string;
  } = {},
): Promise<UploadResult> => {
  configureCloudinary();

  if (!cloudinaryConfigured) {
    throw new Error(
      'Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.',
    );
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder,
        public_id: options.public_id,
        resource_type: options.resource_type || 'raw',
        format: options.format,
      },
      (error, result) => {
        if (error) {
          logger.error('Cloudinary upload error:', error);
          reject(new Error(`Failed to upload file: ${error.message}`));
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

    const stream = Readable.from(buffer);
    stream.pipe(uploadStream);
  });
};

/**
 * CloudinaryService object for class-style imports
 */
export const CloudinaryService = {
  uploadImage: uploadImageToCloudinary,
  uploadBuffer,
  deleteImage: deleteImageFromCloudinary,
  extractPublicId: extractPublicIdFromUrl,
};
