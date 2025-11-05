import dotenv from 'dotenv';
import path from 'path';

const env = process.env.NODE_ENV || 'development';
const envPath = path.resolve(process.cwd(), `.env.${env}`);

dotenv.config({ path: envPath });
dotenv.config(); // Also load .env for fallback

// Determine database host - defaults to localhost for local dev, 'postgres' for Docker
const getDatabaseHost = (): string => {
  // If DATABASE_URL is explicitly set, use it as-is
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('${')) {
    return process.env.DATABASE_URL;
  }
  
  // Check if DB_HOST is set (for Docker/localhost switching)
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbUser = process.env.DB_USER || process.env.POSTGRES_USER || 'eventknit';
  const dbPassword = process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD || 'eventknit123';
  const dbName = process.env.DB_NAME || process.env.POSTGRES_DB || 'eventknit';
  const dbPort = process.env.DB_PORT || process.env.POSTGRES_PORT || '5432';
  
  return `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}?schema=public`;
};

export const config = {
  env,
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '0.0.0.0',
  
  database: {
    url: getDatabaseHost(),
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-key-change-in-production-min-32-chars',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-key-change-in-production-min-32-chars',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m', // 15 minutes
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d', // 7 days
  },
  
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: process.env.CORS_CREDENTIALS === 'true' || true,
  },
  
  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || '',
    from: process.env.EMAIL_FROM || 'noreply@eventknit.com',
  },
  
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:5173',
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10), // 100 requests
    authWindowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS || '900000', 10),
    authMax: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '5', 10), // 5 requests for auth
  },
  
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5', 10),
    lockoutDuration: parseInt(process.env.LOCKOUT_DURATION_MINUTES || '30', 10), // 30 minutes
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
};

// Validate required environment variables in production
if (config.env === 'production') {
  const required = ['DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET', 'SMTP_USER', 'SMTP_PASSWORD'];
  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  if (config.jwt.secret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long in production');
  }
  
  if (config.jwt.refreshSecret.length < 32) {
    throw new Error('JWT_REFRESH_SECRET must be at least 32 characters long in production');
  }
}

