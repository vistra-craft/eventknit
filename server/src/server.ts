import { connectDB, disconnectDB } from './config/database';
import { config } from './config';
import { logger } from './utils/logger';
import app from './app';

const PORT = config.port;
const HOST = config.host;

const startServer = async () => {
  try {
    // Connect to database (optional - will warn if unavailable)
    try {
      await connectDB();
    } catch (error) {
      // Already handled in connectDB, but catch here to ensure server still starts
    }

    // Start Express server
    const server = app.listen(PORT, HOST, () => {
      logger.info(`🚀 EventKnit Server running on http://${HOST}:${PORT}`);
      logger.info(`📊 Environment: ${config.env}`);
      logger.info(`🕐 Started at: ${new Date().toISOString()}`);
      logger.info(`🔍 Health check: http://localhost:${PORT}/health`);
      logger.info(`📋 API status: http://localhost:${PORT}/api/v1/status`);
      logger.info(`🔐 Auth routes: http://localhost:${PORT}/api/v1/auth`);
    });

    // Graceful shutdown handler
    const gracefulShutdown = async (signal: string) => {
      logger.info(`\n${signal} received, shutting down gracefully...`);

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

