import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';

const app = express();

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: config.cors.origin,
  credentials: config.cors.credentials,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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

// Basic error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: config.env === 'production' ? 'Internal server error' : err.message,
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

export default app;

