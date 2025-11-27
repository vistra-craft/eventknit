/**
 * API Client Configuration and Utilities
 */

// API Base URL - uses VITE_API_BASE_URL environment variable if set
// For local development: Uses relative path '/api/v1' to leverage Vite proxy (configured in vite.config.ts)
// For production: Set VITE_API_BASE_URL in Netlify environment variables (recommended)
// Falls back to production URL if not set (for backwards compatibility)
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? '/api/v1' : 'https://eventknit.onrender.com/api/v1');

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

/**
 * Request queue for handling concurrent requests during token refresh
 */
type QueuedRequest<T = unknown> = {
  resolve: (value: T) => void;
  reject: (error: unknown) => void;
  endpoint: string;
  options: RequestInit;
};

let isRefreshing = false;
let refreshQueue: QueuedRequest<unknown>[] = [];

/**
 * Process queued requests after token refresh
 */
const processQueue = (error: unknown | null, token: string | null = null) => {
  refreshQueue.forEach(({ resolve, reject, endpoint, options }) => {
    if (error) {
      reject(error);
    } else {
      // Retry the request with new token
      apiRequestInternal(endpoint, options, token).then(resolve as (value: unknown) => void).catch(reject);
    }
  });

  refreshQueue = [];
};

/**
 * Get the access token from localStorage
 */
export const getAccessToken = (): string | null => {
  return localStorage.getItem('accessToken');
};

/**
 * Set the access token in localStorage
 */
export const setAccessToken = (token: string): void => {
  localStorage.setItem('accessToken', token);
};

/**
 * Remove the access token from localStorage
 */
export const removeAccessToken = (): void => {
  localStorage.removeItem('accessToken');
};

/**
 * Callback for handling logout when refresh fails
 */
let onLogoutCallback: (() => void) | null = null;

/**
 * Set logout callback (called when token refresh fails)
 */
export const setLogoutCallback = (callback: () => void): void => {
  onLogoutCallback = callback;
};

/**
 * API request timeout (30 seconds)
 */
const API_TIMEOUT_MS = 30000;

/**
 * Create a timeout promise that rejects after specified milliseconds
 */
const createTimeout = (ms: number): Promise<never> => {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Request timeout after ${ms}ms`));
    }, ms);
  });
};

/**
 * Internal API request function (used for retries)
 */
const apiRequestInternal = async <T>(
  endpoint: string,
  options: RequestInit = {},
  tokenOverride: string | null = null
): Promise<T> => {
  const token = tokenOverride || getAccessToken();
  const url = `${API_BASE_URL}${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers: headers as HeadersInit,
    credentials: 'include', // Include cookies for refresh token
  };

  try {
    // Race between fetch and timeout
    const response = await Promise.race([
      fetch(url, config),
      createTimeout(API_TIMEOUT_MS),
    ]) as Response;

    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      if (!response.ok) {
        const errorText = await response.text();
        throw {
          success: false,
          message: errorText || `HTTP error! status: ${response.status}`,
        } as ApiError;
      }
      return {} as T;
    }

    const data = await response.json();

    if (!response.ok) {
      // Provide user-friendly messages for specific status codes
      let errorMessage = data.message || 'An error occurred';
      if (response.status === 503) {
        errorMessage = 'Service temporarily unavailable. The server may be down or overloaded. Please try again later.';
      } else if (response.status === 500) {
        errorMessage = 'Internal server error. Please try again later or contact support.';
      } else if (response.status === 502) {
        errorMessage = 'Bad gateway. The server is temporarily unavailable. Please try again later.';
      }

      const error: ApiError = {
        success: false,
        message: errorMessage,
        errors: data.errors,
      };
      // Add status code to error for 401 detection
      (error as ApiError & { status: number }).status = response.status;
      throw error;
    }

    return data as T;
  } catch (error) {
    // Handle timeout errors
    if (error instanceof Error && error.message.includes('timeout')) {
      throw {
        success: false,
        message: 'Request timed out. The server is taking too long to respond. Please try again.',
      } as ApiError;
    }

    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw {
        success: false,
        message: 'Network error. Please check your connection.',
      } as ApiError;
    }
    throw error;
  }
};

/**
 * Refresh access token using refresh token cookie
 * Uses internal request to avoid recursion
 */
export const refreshAccessToken = async (): Promise<string> => {
  const response = await apiRequestInternal<{
    success: true;
    message: string;
    data: {
      accessToken: string;
      expiresIn: number;
    };
  }>('/auth/refresh', {
    method: 'POST',
  });

  if (response.success && response.data) {
    setAccessToken(response.data.accessToken);
    return response.data.accessToken;
  }

  throw new Error('Failed to refresh token');
};

/**
 * Make an API request with authentication headers and automatic token refresh
 */
export const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  // If refresh is in progress, queue this request
  if (isRefreshing) {
    return new Promise<T>((resolve, reject) => {
      refreshQueue.push({
        resolve: resolve as (value: unknown) => void,
        reject,
        endpoint,
        options
      });
    });
  }

  try {
    return await apiRequestInternal<T>(endpoint, options);
  } catch (error) {
    // Check if error is 401 Unauthorized
    const apiError = error as ApiError & { status?: number };

    // Handle 401 errors (except for auth endpoints and public endpoints)
    if (apiError.status === 401) {
      // Don't try to refresh token for auth endpoints or public endpoints
      if (endpoint.includes('/auth/login') ||
        endpoint.includes('/auth/register') ||
        endpoint.includes('/auth/refresh') ||
        endpoint.includes('/register-guest')) {
        throw error;
      }

      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise<T>((resolve, reject) => {
          refreshQueue.push({
            resolve: resolve as (value: unknown) => void,
            reject,
            endpoint,
            options
          });
        });
      }

      // Start refresh process
      isRefreshing = true;

      try {
        const newToken = await refreshAccessToken();
        isRefreshing = false;

        // Process queued requests
        processQueue(null, newToken);

        // Retry original request with new token
        return await apiRequestInternal<T>(endpoint, options, newToken);
      } catch (refreshError) {
        isRefreshing = false;

        // Clear token and logout
        removeAccessToken();

        // Process queued requests with error
        processQueue(refreshError);

        // Call logout callback if set
        if (onLogoutCallback) {
          onLogoutCallback();
        }

        throw {
          success: false,
          message: 'Session expired. Please login again.',
        } as ApiError;
      }
    }

    throw error;
  }
};

/**
 * GET request
 */
export const apiGet = <T>(endpoint: string): Promise<T> => {
  return apiRequest<T>(endpoint, { method: 'GET' });
};

/**
 * POST request
 */
export const apiPost = <T>(endpoint: string, body?: unknown): Promise<T> => {
  return apiRequest<T>(endpoint, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });
};

/**
 * PUT request
 */
export const apiPut = <T>(endpoint: string, body?: unknown): Promise<T> => {
  return apiRequest<T>(endpoint, {
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  });
};

/**
 * PATCH request
 */
export const apiPatch = <T>(endpoint: string, body?: unknown): Promise<T> => {
  return apiRequest<T>(endpoint, {
    method: 'PATCH',
    body: body ? JSON.stringify(body) : undefined,
  });
};

/**
 * DELETE request
 */
export const apiDelete = <T>(endpoint: string): Promise<T> => {
  return apiRequest<T>(endpoint, { method: 'DELETE' });
};

