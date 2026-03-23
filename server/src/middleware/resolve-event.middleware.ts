/**
 * Resolve Event ID Middleware
 *
 * Accepts either a UUID or a human-readable slug in the `:id` (or `:eventId`)
 * route parameter and resolves it to the canonical UUID.  The resolved UUID is
 * written back into `req.params` so that downstream controllers/services
 * always receive a UUID — no slug-vs-UUID branching needed elsewhere.
 *
 * Usage:
 *   router.post('/:id/register', resolveEventId, ...)
 *   router.get('/events/:eventId/analytics', resolveEventId('eventId'), ...)
 */

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';
import { isValidUUID } from '../utils/id.utils.js';
import { NotFoundError } from '../utils/errors.js';

/**
 * Creates a middleware that resolves the named route parameter to a UUID.
 * Defaults to `'id'` when called without arguments.
 *
 * @param paramName  The route-parameter name to resolve (default `'id'`).
 */
export function resolveEventId(paramName?: string) {
  const name = paramName || 'id';

  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const rawParam = req.params[name];
      const raw = Array.isArray(rawParam) ? rawParam[0] : rawParam;

      if (!raw) {
        return next(new NotFoundError('Event not found'));
      }

      // Already a UUID — nothing to resolve.
      if (isValidUUID(raw)) {
        return next();
      }

      // Treat as slug and look up the real UUID.
      const event = await prisma.event.findFirst({
        where: { slug: raw, deletedAt: null },
        select: { id: true },
      });

      if (!event) {
        return next(new NotFoundError('Event not found'));
      }

      // Overwrite the param so every downstream consumer sees the UUID.
      req.params[name] = event.id;
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Convenience export: resolves `req.params.id` (the most common case).
 */
export const resolveEventIdParam = resolveEventId();
