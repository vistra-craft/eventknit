import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('Error:', err);
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: Object.values((err as any).errors).map((val: any) => val.message)
    });
    return;
  }
  
  // Mongoose duplicate key error
  if ((err as any).code === 11000) {
    res.status(400).json({
      success: false,
      message: 'Duplicate field value entered'
    });
    return;
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
    return;
  }
  
  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      message: 'Token expired'
    });
    return;
  }
  
  // Default error
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message
  });
};

export const notFound = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
};
