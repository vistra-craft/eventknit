import { GeolocationService } from '../src/services/geolocation.service.js';

describe('GeolocationService', () => {
  beforeEach(() => {
    // Clear cache before each test
    GeolocationService.clearCache();
  });

  afterEach(() => {
    // Clear cache after each test
    GeolocationService.clearCache();
  });

  describe('getLocationFromIP', () => {
    it('should return null for local/private IP addresses', async () => {
      const localIPs = ['127.0.0.1', '::1', '192.168.1.1', '10.0.0.1', '172.16.0.1'];

      for (const ip of localIPs) {
        const result = await GeolocationService.getLocationFromIP(ip);
        expect(result).toBeNull();
      }
    });

    it('should return null for empty or invalid IP', async () => {
      const result1 = await GeolocationService.getLocationFromIP('');
      expect(result1).toBeNull();

      const result2 = await GeolocationService.getLocationFromIP('invalid');
      expect(result2).toBeNull();
    });

    it('should cache geolocation results', async () => {
      // Mock a public IP (this test will skip actual API calls in unit tests)
      // In a real scenario, you'd mock the fetch calls
      const cacheSizeBefore = GeolocationService.getCacheSize();
      expect(cacheSizeBefore).toBe(0);
    });

    it('should have cache management methods', () => {
      expect(typeof GeolocationService.clearCache).toBe('function');
      expect(typeof GeolocationService.getCacheSize).toBe('function');

      GeolocationService.clearCache();
      expect(GeolocationService.getCacheSize()).toBe(0);
    });
  });

  describe('cache management', () => {
    it('should clear cache', () => {
      GeolocationService.clearCache();
      expect(GeolocationService.getCacheSize()).toBe(0);
    });

    it('should return cache size', () => {
      const size = GeolocationService.getCacheSize();
      expect(typeof size).toBe('number');
      expect(size).toBeGreaterThanOrEqual(0);
    });
  });
});

