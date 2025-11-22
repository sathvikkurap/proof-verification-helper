// Production-grade error handling middleware
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
  code?: string;
}

export class ValidationError extends Error implements AppError {
  statusCode = 400;
  isOperational = true;
  code = 'VALIDATION_ERROR';

  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends Error implements AppError {
  statusCode = 401;
  isOperational = true;
  code = 'AUTHENTICATION_ERROR';

  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error implements AppError {
  statusCode = 403;
  isOperational = true;
  code = 'AUTHORIZATION_ERROR';

  constructor(message: string = 'Access denied') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends Error implements AppError {
  statusCode = 404;
  isOperational = true;
  code = 'NOT_FOUND';

  constructor(resource: string = 'Resource') {
    super(`${resource} not found`);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error implements AppError {
  statusCode = 409;
  isOperational = true;
  code = 'CONFLICT';

  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

// Global error handler
export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal server error';
  let code = error.code || 'INTERNAL_ERROR';
  let isOperational = error.isOperational !== false;

  // Log the error
  const errorContext = {
    url: req.url,
    method: req.method,
    userId: (req as any).userId,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    stack: error.stack,
  };

  if (isOperational) {
    // Operational errors (expected, user-related)
    logger.error('Application error', {
      message: error.message,
      stack: error.stack,
      context: errorContext,
    });
  } else {
    // Programming errors (unexpected, system-related)
    logger.error('Critical application error', {
      message: error.message,
      stack: error.stack,
      severity: 'critical',
      context: errorContext,
    });
  }

  // Don't leak error details in production for non-operational errors
  if (!isOperational && process.env.NODE_ENV === 'production') {
    message = 'Something went wrong';
    code = 'INTERNAL_ERROR';
  }

  // Send error response
  res.status(statusCode).json({
    error: {
      code,
      message,
      ...(process.env.NODE_ENV === 'development' && {
        stack: error.stack,
        details: (error as any).details,
      }),
      timestamp: new Date().toISOString(),
    },
  });
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 handler
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new NotFoundError('API endpoint');
  next(error);
};

// CORS error handler
export const corsErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err.code === 'EBADCSRFTOKEN') {
    logger.warn('CSRF token validation failed', {
      ip: req.ip,
      url: req.url,
      userAgent: req.get('User-Agent'),
    });
    return res.status(403).json({ error: 'CSRF token validation failed' });
  }
  next(err);
};