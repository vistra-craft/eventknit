import { connectDB, disconnectDB } from './config/database.js';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import app from './app.js';
import { initializeJobs, stopJobs } from './jobs/index.js';
import { ensureSuperAdmin } from './utils/ensureSuperAdmin.js';
import { createServer } from 'http';
import { websocketService } from './services/websocket.service.js';
import { mobilePushService } from './services/mobile-push.service.js';
import { TicketSecurityService } from './services/ticket-security.service.js';
import { TicketPdfQueueService } from './services/ticket-pdf-queue.service.js';

const PORT = config.port;
const HOST = config.host;

const startServer = async () => {
  try {
    // Validate critical environment variables
    const ticketSecretKey = process.env.TICKET_SECRET_KEY;
    if (!ticketSecretKey) {
      logger.warn('TICKET_SECRET_KEY is not set - ticket QR generation will fail');
    } else if (ticketSecretKey.length < 32) {
      logger.warn(`TICKET_SECRET_KEY is only ${ticketSecretKey.length} chars (recommended: 32+)`);
    }

    // Initialize Ed25519 keys for signed tickets
    try {
      TicketSecurityService.initializeEd25519Keys();
    } catch (error) {
      logger.error('Failed to initialize Ed25519 keys:', error);
      // Non-fatal in development, fatal in production if USE_SIGNED_TICKETS=true
      if (process.env.NODE_ENV === 'production' && process.env.USE_SIGNED_TICKETS === 'true') {
        throw error;
      }
    }

    // Connect to database
    try {
      await connectDB();
      try { await ensureSuperAdmin(); } catch { /* logged internally */ }
    } catch { /* logged internally */ }

    // Initialize scheduled jobs
    try {
      initializeJobs();
    } catch (error) {
      logger.error('Failed to initialize scheduled jobs:', error);
    }

    // Initialize ticket PDF queue (BullMQ + Redis worker for async ticket delivery)
    try {
      await TicketPdfQueueService.initialize();
    } catch (error) {
      logger.error('Failed to initialize ticket PDF queue:', error);
      // Non-fatal: falls back to synchronous PDF generation
    }

    // Initialize mobile push notification service
    try {
      mobilePushService.initialize();
      if (!mobilePushService.isConfigured()) {
        logger.warn('FCM not configured - push notifications disabled');
      }
    } catch (error) {
      logger.error('Failed to initialize mobile push service:', error);
    }

    // Create HTTP server and WebSocket
    const httpServer = createServer(app);
    websocketService.initialize(httpServer);

    // Start server
    httpServer.listen(PORT, HOST, () => {
      const baseUrl = `http://localhost:${PORT}`;
      logger.info('');
      logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      logger.info(`  EventKnit Server v${process.env.npm_package_version || '1.0.0'}`);
      logger.info(`  Environment:  ${config.env}`);
      logger.info(`  Listening:    http://${HOST}:${PORT}`);
      logger.info(`  API Docs:     ${baseUrl}/api-docs`);
      logger.info(`  Health:       ${baseUrl}/health`);
      logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      logger.info('');
    });

    // Graceful shutdown handler
    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received, shutting down...`);
      stopJobs();
      await TicketPdfQueueService.shutdown();
      await new Promise<void>((resolve) => httpServer.close(() => resolve()));
      await disconnectDB();
      logger.info('Shutdown complete');
      process.exit(0);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();



