/**
 * Routes Index
 * Central export point for all route configurations
 */

// Route configurations
export { authRoutes } from './authRoutes';
export { publicRoutes } from './publicRoutes';
export { userRoutes } from './userRoutes';
export { organizerRoutes } from './organizerRoutes';
export { adminRoutes } from './adminRoutes';

// Export types
export type { RouteConfig, ProtectedRouteConfig } from './types';
