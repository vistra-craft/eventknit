import { connectDB, disconnectDB } from './config/database.js';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import app from './app.js';
import { initializeJobs, stopJobs } from './jobs/index.js';
import { ensureSuperAdmin } from './utils/ensureSuperAdmin.js';
import { createServer } from 'http';
import { websocketService } from './services/websocket.service.js';

const PORT = config.port;
const HOST = config.host;

const startServer = async () => {
  try {
    // Connect to database (optional - will warn if unavailable)
    try {
      await connectDB();
      
      // Ensure super admin exists (only if database is connected)
      try {
        await ensureSuperAdmin();
      } catch {
        // Already logged in ensureSuperAdmin, continue startup
      }
    } catch {
      // Already handled in connectDB, but catch here to ensure server still starts
    }

    // Initialize scheduled jobs
    try {
      initializeJobs();
    } catch (error) {
      logger.error('Failed to initialize scheduled jobs:', error);
      // Don't fail server startup if jobs fail to initialize
    }

    // Create HTTP server
    const httpServer = createServer(app);

    // Initialize WebSocket service
    websocketService.initialize(httpServer);

    // Start HTTP server
    httpServer.listen(PORT, HOST, () => {
      logger.info(`🚀 EventKnit Server running on http://${HOST}:${PORT}`);
      logger.info(`📊 Environment: ${config.env}`);
      logger.info(`🌐 CORS Origin: ${JSON.stringify(config.cors.origin)}`);
      logger.info(`🕐 Started at: ${new Date().toISOString()}`);
      logger.info(`🔍 Health check: http://localhost:${PORT}/health`);
      logger.info(`📋 API status: http://localhost:${PORT}/api/v1/status`);
      logger.info(`🔐 Auth routes: http://localhost:${PORT}/api/v1/auth`);
      logger.info('🔌 WebSocket server initialized');
    });

    const server = httpServer;

    // Graceful shutdown handler
    const gracefulShutdown = async (signal: string) => {
      logger.info(`\n${signal} received, shutting down gracefully...`);

      // Stop scheduled jobs
      stopJobs();

      await new Promise<void>((resolve) => server.close(() => resolve()));

      await disconnectDB();

      logger.info('✅ Shutdown complete, exiting.');
      process.exit(0);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();



