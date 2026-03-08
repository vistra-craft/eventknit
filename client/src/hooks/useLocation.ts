import { useState, useEffect } from 'react';
import { extractErrorMessage } from '@/lib/utils/error';

interface LocationData {
  city: string;
  country: string;
  countryCode: string;
  region: string;
}

interface UseLocationReturn {
  location: LocationData | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to detect user location based on IP address
 * Falls back to a default city if detection fails
 */
export const useLocation = (): UseLocationReturn => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const detectLocation = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Try multiple free IP geolocation services (fallback chain)
        const services = [
          // Service 1: ipapi.co (free tier: 1000 requests/day)
          async () => {
            const response = await fetch('https://ipapi.co/json/', {
              signal: AbortSignal.timeout(5000), // 5 second timeout
            });
            if (!response.ok) throw new Error('Service 1 failed');
            const data = await response.json();
            if (data.error) throw new Error(data.reason || 'Service 1 error');
            return {
              city: data.city || data.region || 'Nairobi',
              country: data.country_name || 'Kenya',
              countryCode: data.country_code || 'KE',
              region: data.region || data.region_code || '',
            };
          },
          // Service 2: ip-api.com (free tier: 45 requests/minute)
          // Note: ip-api.com free tier only supports HTTP, not HTTPS
          async () => {
            // Use HTTP for ip-api.com free tier (mixed content warning is acceptable for this use case)
            const response = await fetch('http://ip-api.com/json/?fields=status,message,city,country,countryCode,region,regionName', {
              signal: AbortSignal.timeout(5000),
            });
            if (!response.ok) throw new Error('Service 2 failed');
            const data = await response.json();
            if (data.status === 'fail') throw new Error(data.message || 'Service 2 error');
            return {
              city: data.city || data.regionName || 'Nairobi',
              country: data.country || 'Kenya',
              countryCode: data.countryCode || 'KE',
              region: data.regionName || data.region || '',
            };
          },
          // Service 3: ipgeolocation.io (requires API key, but we'll try without)
          // Note: This service requires an API key, so we'll skip it for now
        ];

        // Try services in order until one succeeds
        let lastError: Error | null = null;
        for (const service of services) {
          try {
            const locationData = await service();
            setLocation(locationData);
            setIsLoading(false);
            return;
          } catch (err) {
            lastError = err instanceof Error ? err : new Error('Unknown error');
            continue; // Try next service
          }
        }

        // If all services fail, use default location
        throw lastError || new Error('All location services failed');
      } catch (err) {
        console.warn('Location detection failed, using default:', err);
        // Default to Nairobi, Kenya if all services fail
        setLocation({
          city: 'Nairobi',
          country: 'Kenya',
          countryCode: 'KE',
          region: 'Nairobi',
        });
        setError(extractErrorMessage(err, 'Failed to detect location'));
      } finally {
        setIsLoading(false);
      }
    };

    detectLocation();
  }, []);

  return { location, isLoading, error };
};

/**
 * Get capital city for a country code
 * Common capital cities mapping
 */
const countryCapitals: Record<string, string> = {
  KE: 'Nairobi', // Kenya
  UG: 'Kampala', // Uganda
  TZ: 'Dodoma', // Tanzania
  RW: 'Kigali', // Rwanda
  ET: 'Addis Ababa', // Ethiopia
  GH: 'Accra', // Ghana
  NG: 'Abuja', // Nigeria
  ZA: 'Cape Town', // South Africa (legislative), Pretoria (executive)
  EG: 'Cairo', // Egypt
  US: 'Washington', // United States
  GB: 'London', // United Kingdom
  CA: 'Ottawa', // Canada
  AU: 'Canberra', // Australia
  IN: 'New Delhi', // India
  CN: 'Beijing', // China
  JP: 'Tokyo', // Japan
  FR: 'Paris', // France
  DE: 'Berlin', // Germany
  IT: 'Rome', // Italy
  ES: 'Madrid', // Spain
  BR: 'Brasília', // Brazil
  MX: 'Mexico City', // Mexico
  AR: 'Buenos Aires', // Argentina
};

/**
 * Get capital city for a country code, or return the provided city
 */
export const getCapitalCity = (countryCode: string, fallbackCity: string): string => {
  return countryCapitals[countryCode.toUpperCase()] || fallbackCity;
};

