export class AppError extends Error {
  public statusCode: number;

  public code?: string;

  constructor(
    message: string,
    statusCode: number = 500,
    code?: string,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed', code?: string) {
    super(message, 401, code || 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied', code?: string) {
    super(message, 403, code || 'AUTHORIZATION_ERROR');
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed', code?: string) {
    super(message, 400, code || 'VALIDATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', code?: string) {
    super(message, 404, code || 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource already exists', code?: string) {
    super(message, 409, code || 'CONFLICT');
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Database connection error. Please try again later', code?: string) {
    super(message, 503, code || 'DATABASE_ERROR');
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message: string = 'Service temporarily unavailable. Please try again later', code?: string) {
    super(message, 503, code || 'SERVICE_UNAVAILABLE');
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'You\'re sending requests too fast. Please wait a moment and try again.', code?: string) {
    super(message, 429, code || 'RATE_LIMIT_EXCEEDED');
  }
}

