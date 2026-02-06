import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { AuthenticationError } from './errors.js';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

/**
 * Generate access token
 */
export const generateAccessToken = (payload: Omit<TokenPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  } as jwt.SignOptions);
};

/**
 * Generate refresh token
 */
export const generateRefreshToken = (payload: Omit<TokenPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  } as jwt.SignOptions);
};

/**
 * Verify access token
 */
export const verifyAccessToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, config.jwt.secret) as TokenPayload;
  } catch {
    throw new Error('Invalid or expired access token');
  }
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, config.jwt.refreshSecret) as TokenPayload;
  } catch {
    throw new AuthenticationError('Invalid or expired refresh token');
  }
};

/**
 * Parse expiresIn string to seconds
 */
export const parseExpiresIn = (expiresIn: string): number => {
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) return 900; // Default 15 minutes

  const value = parseInt(match[1]!, 10);
  const unit = match[2]!;

  switch (unit) {
  case 's': return value;
  case 'm': return value * 60;
  case 'h': return value * 60 * 60;
  case 'd': return value * 24 * 60 * 60;
  default: return 900;
  }
};

// ============================================
// Unsubscribe Token Functions (for email marketing)
// ============================================

export interface UnsubscribeTokenPayload {
  userId: string;
  email: string;
  eventId?: string; // Optional: for event-specific unsubscribe
  campaignId?: string; // Optional: for tracking which campaign
  type: 'marketing' | 'event_updates' | 'all';
}

/**
 * Generate unsubscribe token for email marketing
 * Token expires in 30 days (users should be able to unsubscribe anytime)
 */
export const generateUnsubscribeToken = (payload: UnsubscribeTokenPayload): string => {
  return jwt.sign(
    { ...payload, purpose: 'unsubscribe' },
    config.jwt.secret,
    { expiresIn: '30d' } as jwt.SignOptions,
  );
};

/**
 * Verify unsubscribe token
 * Returns the payload if valid, throws error if invalid/expired
 */
export const verifyUnsubscribeToken = (token: string): UnsubscribeTokenPayload => {
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as UnsubscribeTokenPayload & { purpose: string };
    if (decoded.purpose !== 'unsubscribe') {
      throw new Error('Invalid token purpose');
    }
    return {
      userId: decoded.userId,
      email: decoded.email,
      eventId: decoded.eventId,
      campaignId: decoded.campaignId,
      type: decoded.type,
    };
  } catch {
    throw new Error('Invalid or expired unsubscribe token');
  }
};

/**
 * Generate unsubscribe URL for email marketing
 */
export const generateUnsubscribeUrl = (
  baseUrl: string,
  payload: UnsubscribeTokenPayload,
): string => {
  const token = generateUnsubscribeToken(payload);
  return `${baseUrl}/unsubscribe?token=${encodeURIComponent(token)}`;
};

