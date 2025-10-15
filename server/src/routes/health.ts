import { Router } from 'express';
import { Request, Response } from 'express';

const router = Router();

// Health check endpoint
router.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Auth service is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
  });
});

// Detailed health check
router.get('/detailed', (req: Request, res: Response) => {
  const healthCheck = {
    success: true,
    message: 'Auth service is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    pid: process.pid,
    platform: process.platform,
    nodeVersion: process.version,
  };
  
  res.status(200).json(healthCheck);
});

export default router;


