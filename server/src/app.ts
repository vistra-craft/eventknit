import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
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
import { errorHandler } from './middleware/error.middleware.js';
import { rateLimiter } from './middleware/rateLimiter.middleware.js';

const app = express();

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// CORS configuration (before helmet to avoid conflicts)
app.use(cors({
  origin: config.cors.origin,
  credentials: config.cors.credentials,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Length', 'Content-Type'],
}));

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginEmbedderPolicy: false,
}));

// Logging
if (config.env === 'development') {
  app.use(morgan('dev', { stream }));
} else {
  app.use(morgan('combined', { stream }));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global rate limiter
app.use('/api', rateLimiter);

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
app.use('/api/v1/promo-codes', promoCodeRoutes);
app.use('/api/v1/workstation', workstationRoutes);

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

