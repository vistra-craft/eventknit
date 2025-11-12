import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/index.js';
import { logger, stream } from './utils/logger.js';
import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';
import organizerRoutes from './routes/organizer.routes.js';
import eventRoutes from './routes/event.routes.js';
import invitationRoutes from './routes/invitation.routes.js';
import templateRoutes from './routes/template.routes.js';
import featuredEventRoutes from './routes/featured-event.routes.js';
import verificationRoutes from './routes/verification.routes.js';
import paymentRoutes from './routes/payment.routes.js';
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
  crossOriginResourcePolicy: { policy: "cross-origin" },
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

// Check super admin endpoint (public - for deployment verification)
app.get('/api/v1/check-superadmin', async (_req, res) => {
  try {
    const { prisma } = await import('./config/database.js');
    const { UserRole } = await import('@prisma/client');
    
    const superAdmins = await prisma.user.findMany({
      where: {
        role: UserRole.SUPERADMIN,
        deletedAt: null,
      },
      select: {
        email: true,
        firstName: true,
        lastName: true,
        status: true,
        isEmailVerified: true,
        createdAt: true,
      },
    });

    res.status(200).json({
      success: true,
      data: {
        exists: superAdmins.length > 0,
        count: superAdmins.length,
        superAdmins: superAdmins.map(admin => ({
          email: admin.email,
          name: `${admin.firstName} ${admin.lastName}`,
          status: admin.status,
          emailVerified: admin.isEmailVerified,
          createdAt: admin.createdAt,
        })),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to check super admin',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// One-time seed endpoint (REMOVE AFTER USE - for initial setup only)
// This creates the super admin user. Call once, then remove this endpoint.
app.post('/api/v1/seed-superadmin', async (req, res) => {
  try {
    // Simple security: require a secret token in the request
    const secretToken = req.body.secretToken || req.headers['x-seed-token'];
    const expectedToken = process.env.SEED_SECRET_TOKEN || 'CHANGE_THIS_IN_PRODUCTION';
    
    if (secretToken !== expectedToken) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. Secret token required.',
      });
    }

    const { prisma } = await import('./config/database.js');
    const { UserRole, UserStatus } = await import('@prisma/client');
    const { hashPassword } = await import('./utils/password.js');

    const SUPERVISOR_CREDENTIALS = {
      email: 'vistracraft@gmail.com',
      password: 'Somepass123!',
      firstName: 'Vistra',
      lastName: 'Craft',
      role: UserRole.SUPERADMIN,
    };

    // Check if superuser already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: SUPERVISOR_CREDENTIALS.email },
    });

    if (existingUser) {
      if (existingUser.role !== UserRole.SUPERADMIN) {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            role: UserRole.SUPERADMIN,
            status: UserStatus.ACTIVE,
            isEmailVerified: true,
            emailVerifiedAt: new Date(),
          },
        });
        return res.status(200).json({
          success: true,
          message: 'User updated to SUPERADMIN role',
          data: { email: SUPERVISOR_CREDENTIALS.email },
        });
      }
      return res.status(200).json({
        success: true,
        message: 'Super admin already exists',
        data: { email: SUPERVISOR_CREDENTIALS.email },
      });
    }

    // Create new superuser
    const hashedPassword = await hashPassword(SUPERVISOR_CREDENTIALS.password);
    const superuser = await prisma.user.create({
      data: {
        email: SUPERVISOR_CREDENTIALS.email,
        password: hashedPassword,
        firstName: SUPERVISOR_CREDENTIALS.firstName,
        lastName: SUPERVISOR_CREDENTIALS.lastName,
        role: SUPERVISOR_CREDENTIALS.role,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });

    res.status(201).json({
      success: true,
      message: 'Super admin created successfully',
      data: {
        email: SUPERVISOR_CREDENTIALS.email,
        name: `${SUPERVISOR_CREDENTIALS.firstName} ${SUPERVISOR_CREDENTIALS.lastName}`,
        role: superuser.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to seed super admin',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
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

