/**
 * Route Configuration Types
 * Defines types for route objects with optional protection and role-based access
 */

import type { RouteObject } from 'react-router-dom';
import type { UserRole } from '../types/auth';

/**
 * Extended route configuration with protection options
 * Using intersection type to combine RouteObject with protection properties
 */
export type ProtectedRouteConfig = RouteObject & {
  /**
   * Array of roles allowed to access this route
   * If not specified, route is accessible to all authenticated users
   */
  allowedRoles?: UserRole[];

  /**
   * Whether this route requires authentication
   * Default: true for protected routes, false for public routes
   */
  requiresAuth?: boolean;
};

/**
 * Generic route configuration type
 * Can be either a standard RouteObject or a ProtectedRouteConfig
 */
export type RouteConfig = RouteObject | ProtectedRouteConfig;
