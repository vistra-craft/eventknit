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
    unsubscribeSecret: process.env.JWT_UNSUBSCRIBE_SECRET || 'dev-unsubscribe-secret-change-in-production-min-32',
  },
  
  cors: {
    // Support multiple origins (comma-separated) or single origin
    origin: process.env.CORS_ORIGIN 
      ? process.env.CORS_ORIGIN.includes(',') 
        ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
        : process.env.CORS_ORIGIN
      : 'http://localhost:5173',
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

  facebook: {
    appId: process.env.FACEBOOK_APP_ID || '',
    appSecret: process.env.FACEBOOK_APP_SECRET || '',
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  },

  apple: {
    clientId: process.env.APPLE_CLIENT_ID || '',
    teamId: process.env.APPLE_TEAM_ID || '',
    keyId: process.env.APPLE_KEY_ID || '',
    privateKeyPath: process.env.APPLE_PRIVATE_KEY_PATH || '',
  },

  socialMedia: {
    facebook: {
      clientId: process.env.FACEBOOK_CLIENT_ID || process.env.FACEBOOK_APP_ID || '',
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || process.env.FACEBOOK_APP_SECRET || '',
      redirectUri: process.env.FACEBOOK_REDIRECT_URI || '',
    },
    twitter: {
      clientId: process.env.TWITTER_CLIENT_ID || '',
      clientSecret: process.env.TWITTER_CLIENT_SECRET || '',
      redirectUri: process.env.TWITTER_REDIRECT_URI || '',
    },
    instagram: {
      clientId: process.env.INSTAGRAM_CLIENT_ID || '',
      clientSecret: process.env.INSTAGRAM_CLIENT_SECRET || '',
      redirectUri: process.env.INSTAGRAM_REDIRECT_URI || '',
    },
    linkedin: {
      clientId: process.env.LINKEDIN_CLIENT_ID || '',
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '',
      redirectUri: process.env.LINKEDIN_REDIRECT_URI || '',
    },
  },

  paystack: {
    secretKey: process.env.PAYSTACK_SECRET_KEY || '',
    publicKey: process.env.PAYSTACK_PUBLIC_KEY || '',
    webhookSecret: process.env.PAYSTACK_WEBHOOK_SECRET || '',
  },

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    publicKey: process.env.STRIPE_PUBLIC_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    environment: (process.env.STRIPE_ENVIRONMENT as 'test' | 'live') || 'test',
  },

  mpesa: {
    consumerKey: process.env.MPESA_CONSUMER_KEY || '',
    consumerSecret: process.env.MPESA_CONSUMER_SECRET || '',
    passkey: process.env.MPESA_PASSKEY || '',
    shortcode: process.env.MPESA_SHORTCODE || '',
    environment: (process.env.MPESA_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
    callbackUrl: process.env.MPESA_CALLBACK_URL || '',
  },

  sms: {
    enabled: process.env.SMS_ENABLED === 'true',
    provider: process.env.SMS_PROVIDER || 'twilio',
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    fromNumber: process.env.TWILIO_PHONE_NUMBER || '',
    defaultCountryCode: process.env.SMS_DEFAULT_COUNTRY_CODE || '1', // US default
  },

  ussd: {
    enabled: process.env.USSD_ENABLED === 'true',
    provider: process.env.USSD_PROVIDER || 'africastalking', // africastalking, hubtel, etc.
    serviceCode: process.env.USSD_SERVICE_CODE || '*384*123#',
    // Africa's Talking credentials (if using AT)
    africastalking: {
      apiKey: process.env.AT_API_KEY || '',
      username: process.env.AT_USERNAME || 'sandbox',
    },
    sessionTimeout: parseInt(process.env.USSD_SESSION_TIMEOUT || '180', 10), // 3 minutes default
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },

  admin: {
    // Admin-specific allowed origins (separate from general CORS)
    allowedOrigins: process.env.ADMIN_ALLOWED_ORIGINS
      ? process.env.ADMIN_ALLOWED_ORIGINS.includes(',')
        ? process.env.ADMIN_ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
        : [process.env.ADMIN_ALLOWED_ORIGINS]
      : ['http://localhost:5173', 'http://localhost:3010'], // Default for development

    // IP whitelist for admin access
    allowedIPs: process.env.ADMIN_ALLOWED_IPS
      ? process.env.ADMIN_ALLOWED_IPS.includes(',')
        ? process.env.ADMIN_ALLOWED_IPS.split(',').map(ip => ip.trim())
        : [process.env.ADMIN_ALLOWED_IPS]
      : [], // Empty array means IP check is disabled by default

    // Enable/disable IP whitelisting
    enableIPWhitelist: process.env.ADMIN_ENABLE_IP_WHITELIST === 'true',

    // Allow requests with no origin (mobile apps, curl) for admin endpoints
    allowNoOrigin: process.env.ADMIN_ALLOW_NO_ORIGIN === 'true' || env === 'development',

    // Allow all localhost origins in development
    allowLocalhostInDev: process.env.ADMIN_ALLOW_LOCALHOST_IN_DEV !== 'false', // Default true

    // Allow all IPs in development (disable IP whitelist in dev)
    allowAllIPsInDev: process.env.ADMIN_ALLOW_ALL_IPS_IN_DEV !== 'false', // Default true

    // Require specific subdomain for admin access (e.g., admin.eventknit.com)
    requireSpecificSubdomain: process.env.ADMIN_REQUIRE_SUBDOMAIN === 'true',
    requiredSubdomain: process.env.ADMIN_REQUIRED_SUBDOMAIN || 'admin.localhost', // e.g., 'admin.eventknit.com'

    // Geographic restrictions (future enhancement)
    enableGeoRestriction: process.env.ADMIN_ENABLE_GEO_RESTRICTION === 'true',
    allowedCountries: process.env.ADMIN_ALLOWED_COUNTRIES
      ? process.env.ADMIN_ALLOWED_COUNTRIES.split(',').map(c => c.trim())
      : [],
  },

  payout: {
    // Business days after event ends before auto-payout is eligible (default: 5)
    gracePeriodBusinessDays: parseInt(process.env.PAYOUT_GRACE_PERIOD_BUSINESS_DAYS || '5', 10),
    // System-wide kill switch for automatic payouts
    autoPayoutEnabled: process.env.AUTO_PAYOUT_ENABLED !== 'false',
  },
};

// Validate required environment variables in production
if (config.env === 'production') {
  const required = ['DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET', 'SMTP_USER', 'SMTP_PASSWORD'];
  
  // Only require SMS credentials if SMS is enabled
  if (config.sms.enabled) {
    required.push('TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER');
  }
  
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

