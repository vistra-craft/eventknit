import { logger } from '../utils/logger.js';

export interface GeolocationData {
  country: string;
  countryCode: string;
  region?: string;
  city?: string;
}

interface IPApiCoResponse {
  city?: string;
  region?: string;
  country_name?: string;
  country_code?: string;
  error?: boolean;
  reason?: string;
}

interface IPApiComResponse {
  city?: string;
  regionName?: string;
  country?: string;
  countryCode?: string;
  status?: string;
  message?: string;
}

/**
 * Service for IP geolocation
 * Uses multiple free services with fallback chain
 */
export class GeolocationService {
  private static cache = new Map<string, { data: GeolocationData; expires: number }>();
  private static readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Get geolocation data from IP address
   * Uses caching to reduce API calls
   */
  static async getLocationFromIP(ipAddress: string): Promise<GeolocationData | null> {
    if (!ipAddress || ipAddress === '::1' || ipAddress === '127.0.0.1' || ipAddress.startsWith('192.168.') || ipAddress.startsWith('10.') || ipAddress.startsWith('172.')) {
      // Local/private IP addresses
      return null;
    }

    // Check cache
    const cached = this.cache.get(ipAddress);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }

    try {
      // Try multiple services in order
      const services = [
        () => this.getLocationFromIPApiCo(ipAddress),
        () => this.getLocationFromIPApiCom(ipAddress),
      ];

      for (const service of services) {
        try {
          const location = await service();
          if (location) {
            // Cache the result
            this.cache.set(ipAddress, {
              data: location,
              expires: Date.now() + this.CACHE_TTL,
            });
            return location;
          }
        } catch (error) {
          logger.warn(`Geolocation service failed for IP ${ipAddress}:`, error);
          continue; // Try next service
        }
      }

      return null;
    } catch (error) {
      logger.error(`Failed to get geolocation for IP ${ipAddress}:`, error);
      return null;
    }
  }

  /**
   * Get location from ipapi.co (free tier: 1000 requests/day)
   */
  private static async getLocationFromIPApiCo(ipAddress: string): Promise<GeolocationData | null> {
    try {
       
      const response = await fetch(`https://ipapi.co/${ipAddress}/json/`, {
         
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = (await response.json()) as IPApiCoResponse;

      if (data.error || !data.country_name) {
        throw new Error(data.reason || 'Invalid response');
      }

      return {
        country: data.country_name || 'Unknown',
        countryCode: data.country_code || '',
        region: data.region || undefined,
        city: data.city || undefined,
      };
    } catch (error) {
      throw new Error(`ipapi.co failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get location from ip-api.com (free tier: 45 requests/minute)
   * Note: Free tier only supports HTTP
   */
  private static async getLocationFromIPApiCom(ipAddress: string): Promise<GeolocationData | null> {
    try {
       
      const response = await fetch(
        `http://ip-api.com/json/${ipAddress}?fields=status,message,city,country,countryCode,region,regionName`,
        {
           
          signal: AbortSignal.timeout(5000),
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = (await response.json()) as IPApiComResponse;

      if (data.status === 'fail' || !data.country) {
        throw new Error(data.message || 'Invalid response');
      }

      return {
        country: data.country || 'Unknown',
        countryCode: data.countryCode || '',
        region: data.regionName || undefined,
        city: data.city || undefined,
      };
    } catch (error) {
      throw new Error(`ip-api.com failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clear cache (useful for testing)
   */
  static clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache size (for monitoring)
   */
  static getCacheSize(): number {
    return this.cache.size;
  }
}

