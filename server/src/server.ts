import mongoose from 'mongoose';
import { connectDB } from './config/database';
import { config } from './config';
import app from './app';

const PORT = config.port;
const HOST = config.host;

const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    // Start Express server
    const server = app.listen(PORT, HOST, () => {
      console.log(`🚀 EventKnit Server running on http://${HOST}:${PORT}`);
      console.log(`📊 Environment: ${config.env}`);
      console.log(`🕐 Started at: ${new Date().toISOString()}`);
      console.log(`🔍 Health check: http://localhost:${PORT}/health`);
      console.log(`📋 API status: http://localhost:${PORT}/api/v1/status`);
    });

    // Graceful shutdown handler
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n${signal} received, shutting down gracefully...`);

      await new Promise<void>((resolve) => server.close(() => resolve()));

      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
        console.log('🔌 MongoDB connection closed.');
      }

      console.log('✅ Shutdown complete, exiting.');
      process.exit(0);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

