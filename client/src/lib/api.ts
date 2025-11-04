/**
 * API Client Configuration and Utilities
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

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
type QueuedRequest = {
  resolve: (value: unknown) => void;
  reject: (error: unknown) => void;
  endpoint: string;
  options: RequestInit;
};

let isRefreshing = false;
let refreshQueue: QueuedRequest[] = [];

/**
 * Process queued requests after token refresh
 */
const processQueue = (error: unknown | null, token: string | null = null) => {
  refreshQueue.forEach(({ resolve, reject, endpoint, options }) => {
    if (error) {
      reject(error);
    } else {
      // Retry the request with new token
      apiRequestInternal(endpoint, options, token).then(resolve).catch(reject);
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
 * Internal API request function (used for retries)
 */
const apiRequestInternal = async <T>(
  endpoint: string,
  options: RequestInit = {},
  tokenOverride: string | null = null
): Promise<T> => {
  const token = tokenOverride || getAccessToken();
  const url = `${API_BASE_URL}${endpoint}`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers,
    credentials: 'include', // Include cookies for refresh token
  };

  try {
    const response = await fetch(url, config);

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
      const error: ApiError = {
        success: false,
        message: data.message || 'An error occurred',
        errors: data.errors,
      };
      // Add status code to error for 401 detection
      (error as ApiError & { status: number }).status = response.status;
      throw error;
    }

    return data as T;
  } catch (error) {
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
      refreshQueue.push({ resolve, reject, endpoint, options });
    });
  }

  try {
    return await apiRequestInternal<T>(endpoint, options);
  } catch (error) {
    // Check if error is 401 Unauthorized
    const apiError = error as ApiError & { status?: number };
    
    // Handle 401 errors (except for auth endpoints)
    if (apiError.status === 401) {
      // Don't try to refresh token for auth endpoints
      if (endpoint.includes('/auth/login') || endpoint.includes('/auth/register') || endpoint.includes('/auth/refresh')) {
        throw error;
      }

      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise<T>((resolve, reject) => {
          refreshQueue.push({ resolve, reject, endpoint, options });
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
 * DELETE request
 */
export const apiDelete = <T>(endpoint: string): Promise<T> => {
  return apiRequest<T>(endpoint, { method: 'DELETE' });
};

