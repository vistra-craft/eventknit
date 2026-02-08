import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from './config/index.js';
import { stream } from './utils/logger.js';
import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';
import organizerRoutes from './routes/organizer.routes.js';
import eventRoutes from './routes/event.routes.js';
import invitationRoutes from './routes/invitation.routes.js';
import templateRoutes from './routes/template.routes.js';
import featuredEventRoutes from './routes/featured-event.routes.js';
import verificationRoutes from './routes/verification.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import ticketRoutes from './routes/ticket.routes.js';
import userRoutes from './routes/user.routes.js';
import promoCodeRoutes from './routes/promo-code.routes.js';
import workstationRoutes from './routes/workstation.routes.js';
import checkpointRoutes from './routes/checkpoint.routes.js';
import badgeTemplateRoutes from './routes/badge-template.routes.js';
import facilityRoutes from './routes/facility.routes.js';
import facilityZoneRoutes from './routes/facility-zone.routes.js';
import printerRoutes from './routes/printer.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import offlineSyncRoutes from './routes/offline-sync.routes.js';
import venueCapacityRoutes from './routes/venue-capacity.routes.js';
import financialRoutes from './routes/financial.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import bulkMessageRoutes from './routes/bulk-message.routes.js';
import socialMediaRoutes from './routes/social-media.routes.js';
import socialWebhookRoutes from './routes/social-webhook.routes.js';
import supportRoutes from './routes/support.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import emailTemplateRoutes from './routes/email-template.routes.js';
import unifiedMessagingRoutes from './routes/unified-messaging.routes.js';
import feedbackRoutes from './routes/feedback.routes.js';
import adminFeedbackRoutes from './routes/admin-feedback.routes.js';
import adminPromoCodeRoutes from './routes/admin-promo-code.routes.js';
import { smsRouter, ussdRouter, mpesaRouter } from './routes/ussd-sms.routes.js';
import userDashboardRoutes from './routes/user-dashboard.routes.js';
import organizerDashboardRoutes from './routes/organizer-dashboard.routes.js';
import savedEventRoutes from './routes/saved-event.routes.js';
import eventCollectionRoutes from './routes/event-collection.routes.js';
import platformFinanceRoutes from './routes/platform-finance.routes.js';
import pushNotificationRoutes from './routes/push-notification.routes.js';
import attendeeImportRoutes from './routes/attendee-import.routes.js';
import servicePointRegistrationRoutes from './routes/service-point-registration.routes.js';
import mobileRoutes from './routes/mobile.routes.js';
import careerRoutes from './routes/career.routes.js';
import unsubscribeRoutes from './routes/unsubscribe.routes.js';
import gdprRoutes from './routes/gdpr.routes.js';
import creditRoutes from './routes/credit.routes.js';
import cartRoutes from './routes/cart.routes.js';
import configurationRoutes from './routes/configuration.routes.js';
import { errorHandler } from './middleware/error.middleware.js';
import { rateLimiter } from './middleware/rateLimiter.middleware.js';

const app = express();

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// CORS configuration (before helmet to avoid conflicts)
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);

      // In development, allow any localhost origin
      if (config.env === 'development' && origin.startsWith('http://localhost:')) {
        return callback(null, true);
      }

      // Check against configured origins
      const allowedOrigins = Array.isArray(config.cors.origin)
        ? config.cors.origin
        : [config.cors.origin];

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      callback(new Error('Not allowed by CORS'));
    },
    credentials: config.cors.credentials,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
    ],
    exposedHeaders: ['Content-Length', 'Content-Type'],
  }),
);

// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false,
  }),
);

// HTTP request logging - skip successful static/health checks to reduce noise
const morganSkip = (_req: express.Request, _res: express.Response) => {
  if (config.env === 'development') {
    // In dev, skip logging for health checks and successful favicon requests
    return _req.url === '/health' || _req.url === '/favicon.ico';
  }
  return false;
};

if (config.env === 'development') {
  app.use(morgan('dev', { stream, skip: morganSkip }));
} else {
  app.use(morgan('combined', { stream, skip: morganSkip }));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global rate limiter
app.use('/api', rateLimiter);

// Swagger API Documentation
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const swaggerDocument = YAML.load(join(__dirname, '..', 'swagger.yaml'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'EventKnit API Documentation',
}));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.env,
      version: process.env.npm_package_version || '1.0.0',
    },
  });
});

// API status endpoint
app.get('/api/v1/status', (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      message: 'EventKnit API is running',
      version: '1.0.0',
      environment: config.env,
      timestamp: new Date().toISOString(),
    },
  });
});

// API routes
// Public routes (no auth required)
import { SystemSettingsController } from './controllers/system-settings.controller.js';
app.get('/api/v1/settings/public', SystemSettingsController.getPublicSettings);

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/organizer', organizerRoutes);
app.use('/api/v1/events', eventRoutes);
app.use('/api/v1/invitations', invitationRoutes);
app.use('/api/v1/templates', templateRoutes);
app.use('/api/v1/featured-events', featuredEventRoutes);
app.use('/api/v1/verification', verificationRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/tickets', ticketRoutes);
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/user-dashboard', userDashboardRoutes);
app.use('/api/v1/saved-events', savedEventRoutes);
app.use('/api/v1/collections', eventCollectionRoutes);
app.use('/api/v1/organizer-dashboard', organizerDashboardRoutes);
app.use('/api/v1/promo-codes', promoCodeRoutes);
app.use('/api/v1/workstation', workstationRoutes);
app.use('/api/v1/checkpoints', checkpointRoutes);
app.use('/api/v1/badge-templates', badgeTemplateRoutes);
app.use('/api/v1/facilities', facilityRoutes);
app.use('/api/v1', facilityZoneRoutes);
app.use('/api/v1', printerRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/offline', offlineSyncRoutes);
app.use('/api/v1/capacity', venueCapacityRoutes);
app.use('/api/v1/admin/finance', financialRoutes);
app.use('/api/v1/admin/platform-finance', platformFinanceRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/push', pushNotificationRoutes);
app.use('/api/v1/admin/communications/bulk-messages', bulkMessageRoutes);
app.use('/api/v1/admin/social-media', socialMediaRoutes);
app.use('/api/v1/webhooks/social-media', socialWebhookRoutes);
app.use('/api/v1/admin/support', supportRoutes);
app.use('/api/v1/admin/analytics', analyticsRoutes);
app.use('/api/v1/admin/communications/email-templates', emailTemplateRoutes);
app.use('/api/v1/admin/communications', unifiedMessagingRoutes);
app.use('/api/v1/sms', smsRouter);
app.use('/api/v1/ussd', ussdRouter);
app.use('/api/v1/mpesa', mpesaRouter);
app.use('/api/v1/feedback', feedbackRoutes);
app.use('/api/v1/admin/feedback', adminFeedbackRoutes);
app.use('/api/v1/admin/promo-codes', adminPromoCodeRoutes);
app.use('/api/v1/events', attendeeImportRoutes);
app.use('/api/v1/events', servicePointRegistrationRoutes);
app.use('/api/v1/mobile', mobileRoutes);
app.use('/api/v1/careers', careerRoutes);
app.use('/api/v1/unsubscribe', unsubscribeRoutes); // Public route for email unsubscribe (no auth required)
app.use('/api/v1/gdpr', gdprRoutes); // GDPR data export and account deletion
app.use('/api/v1/credits', creditRoutes); // Credit/Voucher system
app.use('/api/v1/cart', cartRoutes); // Cart reservation system
app.use('/api/v1/configuration', configurationRoutes); // System configuration (mailTrap, maintenance mode)

// Error handler middleware (must be last)
app.use(errorHandler);

// 404 handler (must be after all routes)
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

export default app;
