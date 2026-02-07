/**
 * Social Media Platform Manager
 * 
 * Manages and provides access to configured social media platforms
 */

import { SocialMediaPlatform } from './platform.interface.js';
import { FacebookPlatform } from './platforms/facebook.platform.js';
import { TwitterPlatform } from './platforms/twitter.platform.js';
import { InstagramPlatform } from './platforms/instagram.platform.js';
import { LinkedInPlatform } from './platforms/linkedin.platform.js';
import { logger } from '../../utils/logger.js';
import { config } from '../../config/index.js';

class PlatformManager {
  private platforms: Map<string, SocialMediaPlatform> = new Map();

  constructor() {
    this.initializePlatforms();
  }

  private initializePlatforms() {
    // Initialize Facebook
    if (config.socialMedia?.facebook?.clientId && config.socialMedia?.facebook?.clientSecret) {
      this.platforms.set('facebook', new FacebookPlatform());
      logger.info('Facebook platform initialized');
    }

    // Initialize Twitter
    if (config.socialMedia?.twitter?.clientId && config.socialMedia?.twitter?.clientSecret) {
      this.platforms.set('twitter', new TwitterPlatform());
      logger.info('Twitter platform initialized');
    }

    // Initialize Instagram
    if (config.socialMedia?.instagram?.clientId && config.socialMedia?.instagram?.clientSecret) {
      this.platforms.set('instagram', new InstagramPlatform());
      logger.info('Instagram platform initialized');
    }

    // Initialize LinkedIn
    if (config.socialMedia?.linkedin?.clientId && config.socialMedia?.linkedin?.clientSecret) {
      this.platforms.set('linkedin', new LinkedInPlatform());
      logger.info('LinkedIn platform initialized');
    }
  }

  /**
   * Get platform by name
   */
  getPlatform(platformName: string): SocialMediaPlatform | null {
    const platform = this.platforms.get(platformName.toLowerCase());
    if (!platform) {
      logger.warn(`Platform ${platformName} not found or not configured`);
    }
    return platform || null;
  }

  /**
   * Get all available platforms
   */
  getAvailablePlatforms(): string[] {
    return Array.from(this.platforms.keys());
  }

  /**
   * Check if platform is available
   */
  isPlatformAvailable(platformName: string): boolean {
    return this.platforms.has(platformName.toLowerCase());
  }
}

// Singleton instance
export const platformManager = new PlatformManager();
